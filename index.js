"use strict";

const arities = { input: 0, literal: 0, add: 2, multiply: 2, concat: 2 };

function validateIR(ir) {
  if (!ir || ir.version !== 1 || typeof ir.intent !== 'string' ||
      !ir.intent.trim() || !Array.isArray(ir.nodes) || !Array.isArray(ir.outputs)) {
    throw new TypeError('Expected version 1 IR with a nonempty intent, nodes, and outputs');
  }
  const nodes = new Map();
  for (const node of ir.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id || nodes.has(node.id) ||
        !Object.hasOwn(arities, node.op)) throw new TypeError('Invalid or duplicate node');
    if (!Array.isArray(node.deps) || node.deps.length !== arities[node.op] ||
        node.deps.some(id => typeof id !== 'string')) throw new TypeError('Invalid dependencies');
    if (node.op === 'input' || node.op === 'literal') {
      if (!(typeof node.value === 'string' || typeof node.value === 'boolean' ||
            (typeof node.value === 'number' && Number.isFinite(node.value)) ||
            node.value === null)) throw new TypeError('Values must be finite JSON scalars');
    }
    nodes.set(node.id, node);
  }
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    if (!nodes.has(id)) throw new TypeError('Unknown node: ' + id);
    if (visiting.has(id)) throw new TypeError('Cyclic dependency: ' + id);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of nodes.get(id).deps) visit(dep);
    visiting.delete(id); visited.add(id);
  }
  for (const id of nodes.keys()) visit(id);
  for (const id of ir.outputs) {
    if (typeof id !== 'string' || !nodes.has(id)) throw new TypeError('Unknown output');
  }
  if (!ir.outputs.length) throw new TypeError('At least one output is required');
  return true;
}

// Compile an explicit structured intent; free-form language is metadata only.
function compileIntent(spec) {
  if (!spec || typeof spec.intent !== 'string' || !spec.inputs ||
      typeof spec.inputs !== 'object' || Array.isArray(spec.inputs) ||
      !['add', 'multiply', 'concat'].includes(spec.operation) ||
      !Array.isArray(spec.operands) || spec.operands.length !== 2) {
    throw new TypeError('Expected intent, inputs, operation, and two operands');
  }
  const nodes = [], inputs = new Map();
  for (const [name, value] of Object.entries(spec.inputs)) {
    const id = 'input:' + name;
    nodes.push({ id, op: 'input', deps: [], value }); inputs.set(name, id);
  }
  const deps = spec.operands.map((operand, i) => {
    if (operand && typeof operand === 'object' && !Array.isArray(operand) &&
        typeof operand.input === 'string' && Object.keys(operand).length === 1) {
      if (!inputs.has(operand.input)) throw new TypeError('Unknown input: ' + operand.input);
      return inputs.get(operand.input);
    }
    const id = 'literal:' + i;
    nodes.push({ id, op: 'literal', deps: [], value: operand }); return id;
  });
  nodes.push({ id: 'result', op: spec.operation, deps });
  const ir = { version: 1, intent: spec.intent, nodes, outputs: ['result'] };
  validateIR(ir);
  return ir;
}

function createRuntime(source) {
  validateIR(source);
  // Copy only schema fields; callers cannot mutate the running graph.
  const ir = { version: 1, intent: source.intent, outputs: [...source.outputs],
    nodes: source.nodes.map(n => ({ id: n.id, op: n.op, deps: [...n.deps], value: n.value })) };
  const nodes = new Map(ir.nodes.map(n => [n.id, n]));
  let overrides = new Map();
  const listeners = new Set();
  function evaluate(next) {
    const cache = new Map();
    function value(id) {
      if (cache.has(id)) return cache.get(id);
      const n = nodes.get(id);
      let result;
      if (n.op === 'input') result = next.has(id) ? next.get(id) : n.value;
      else if (n.op === 'literal') result = n.value;
      else {
        const [a, b] = n.deps.map(value);
        if (n.op === 'concat') result = String(a) + String(b);
        else {
          if (typeof a !== 'number' || typeof b !== 'number') throw new TypeError('Arithmetic requires numbers');
          result = n.op === 'add' ? a + b : a * b;
          if (!Number.isFinite(result)) throw new RangeError('Nonfinite arithmetic result');
        }
      }
      cache.set(id, result); return result;
    }
    return Object.freeze(Object.fromEntries(ir.outputs.map(id => [id, value(id)])));
  }
  let current = evaluate(overrides);
  return Object.freeze({
    get() { return current; },
    set(id, nextValue) {
      if (!nodes.has(id) || nodes.get(id).op !== 'input') throw new TypeError('Expected an input node id');
      if (!(nextValue === null || typeof nextValue === 'string' || typeof nextValue === 'boolean' ||
          (typeof nextValue === 'number' && Number.isFinite(nextValue)))) throw new TypeError('Expected a finite JSON scalar');
      const next = new Map(overrides); next.set(id, nextValue);
      const result = evaluate(next); // Failed evaluation leaves existing state intact.
      overrides = next; current = result;
      // All subscribers run after commit; return their errors without undoing state.
      const errors = [];
      for (const listener of [...listeners]) {
        try { listener(current); } catch (error) { errors.push(error); }
      }
      return { outputs: current, errors };
    },
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Expected a function');
      listeners.add(listener); return () => listeners.delete(listener);
    }
  });
}

module.exports = Object.freeze({ validateIR, compileIntent, createRuntime });

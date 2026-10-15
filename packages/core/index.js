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

module.exports = Object.freeze({ validateIR });

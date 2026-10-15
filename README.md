# reintentify

Experimental Softoy prerelease (`0.0.0-alpha.0`). Implements a small structured
intent IR utility, not a complete AI-native programming framework.

## Implemented functionality

Exports: `validateIR`, `compileIntent`, `createRuntime`.

- `validateIR(ir)` validates the graph schema, unique IDs, operation arities,
  references, outputs, finite scalar values, and absence of dependency cycles.
  Returns `true` or throws `TypeError`.
- `compileIntent(spec)` compiles an explicit structured operation into IR.
  It accepts `intent` text, an `inputs` object, an `operation` (`add`, `multiply`,
  or `concat`), and exactly two `operands`. Operands are JSON scalars or
  `{ input: 'name' }` references. Input IDs are `input:name`; output is `result`.
- `createRuntime(ir)` creates an in-memory reactive evaluator. `get()` returns
  frozen outputs; `set(inputId, scalar)` recomputes outputs and notifies
  subscribers; `subscribe(fn)` returns an unsubscribe function. `set` returns
  `{ outputs, errors }`, with subscriber errors collected after the update commits.
  Invalid updates and failed evaluations leave previous state unchanged.

## Usage

Node.js 18 or newer. CommonJS. No dependencies.

```js
const { compileIntent, createRuntime } = require('reintentify');
const ir = compileIntent({
  intent: 'Double the quantity',
  inputs: { quantity: 3 },
  operation: 'multiply',
  operands: [{ input: 'quantity' }, 2]
});
const runtime = createRuntime(ir);
console.log(runtime.get()); // { result: 6 }
const unsubscribe = runtime.subscribe(outputs => console.log(outputs));
runtime.set('input:quantity', 5); // subscriber receives { result: 10 }
unsubscribe();
```

## IR format

Version 1 has `intent` (nonempty descriptive text), `nodes`, and `outputs`.
Each node has a unique nonempty string `id`, an `op`, and `deps` (node IDs).
`input` and `literal` nodes have zero dependencies and a scalar `value` (null,
boolean, string, or finite number). `add`, `multiply`, and `concat` have exactly
two dependencies. Outputs contain one or more existing node IDs. Forward
references are allowed; missing references and cycles are rejected.

Arithmetic requires numeric operands and finite results. `concat` uses string
conversion. Validation checks graph structure, not arithmetic type compatibility;
evaluation checks operand types. Unknown extra fields are ignored. The runtime
copies the graph and recomputes requested outputs synchronously after each update.

## Scope and limitations

Natural-language text is metadata only. This release does not interpret free-form
language, call an AI model, generate application code, persist state, execute
external effects, or implement incremental scheduling. API and IR may change.
It is experimental and not ready for production use. This is functioning early
project code, not a nonfunctional placeholder.

## License

MIT; see LICENSE.

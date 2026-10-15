# @reintentify/core

Experimental Softoy prerelease (`0.0.0-alpha.0`). Implements a small structured
intent IR utility, not a complete AI-native programming framework.

## Implemented functionality

Exports: `validateIR`.

- `validateIR(ir)` validates the graph schema, unique IDs, operation arities,
  references, outputs, finite scalar values, and absence of dependency cycles.
  Returns `true` or throws `TypeError`.

## Usage

Node.js 18 or newer. CommonJS. No dependencies.

```js
const { validateIR } = require('@reintentify/core');
const ir = { version: 1, intent: 'Track quantity', nodes: [
  { id: 'quantity', op: 'input', deps: [], value: 3 }
], outputs: ['quantity'] };
console.log(validateIR(ir)); // true
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

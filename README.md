# reintentify

Experimental early-stage project under Softoy. This is a placeholder with no
implemented functionality. It is not ready for use and does not compile,
execute, or react to natural-language intents.

## Project direction

Reintentify is a potential name for an AI-native programming framework that
compiles natural-language intentions into a semantic, reactive intermediate
representation (IR). The intended framework turns intentions into living,
reactive software.

The concept is to separate intent capture, semantic compilation, and reactive
execution. The compiler would produce an explicit IR describing meaning,
dependencies, and effects. A runtime would update dependent computations when
inputs change. These are design intentions, not available capabilities.

## Initial design questions

- How should an intent express constraints and resolve ambiguity?
- Which IR nodes represent state, computation, dependencies, and effects?
- How should reactive updates propagate and handle failed effects?
- What review and validation should precede execution of generated behavior?

No API, compiler, runtime, or framework implementation is included.
No dependencies are required. The entry point exports an empty object.

## Publication status

This package is an unpublished draft. npm's name policy prohibits packages
with no genuine function used to reserve a name, so this placeholder must not
be published in its current form.

## License

MIT; see LICENSE.

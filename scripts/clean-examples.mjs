import { rm } from "node:fs/promises";

// These folders are disposable CLI demonstration output, never source inputs.
for (const directory of ["generated", "generated-brand", "generated-json", "generated-phase3", "generated-rust", "generated-v2"]) {
  await rm(new URL(`../${directory}/`, import.meta.url), { recursive: true, force: true });
}

// Empty after obsolete source files were retired; retained here so cleanup is repeatable.
for (const directory of ["bin", "bindings", "crates/typeyaml-core"]) {
  await rm(new URL(`../${directory}/`, import.meta.url), { recursive: true, force: true });
}

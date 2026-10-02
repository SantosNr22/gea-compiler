# Pebble counter size regression

From the compiler checkout, with the sibling `examples/` and `pebble/`
repositories, their dependencies, Pebble SDK and matching LLVM/LLD installed:

```sh
npm run build
node test/pebble-counter-size.mjs
```

The integration check uses Pebble's default workspace compiler selection (`compiler/dist/cli.js`), builds
the unchanged `counter-jsx` application and its `.pbw`, verifies compiled UI,
and rejects a program image larger than 10,000 bytes. The program image is not
the ELF file size, the complete Pebble app image, or the compressed bundle.

On September 28, 2026, SDK 4.33.1 and LLVM/LLD 22.1.8 produced:

| Measurement                   |   Bytes |
| ----------------------------- | ------: |
| Program image                 |   9,896 |
| Program memory, including BSS |  10,080 |
| Complete Pebble app binary    |  14,608 |
| PBW bundle                    |  20,077 |
| SDK-reported free heap        | 116,512 |

The previous generated counter retained unused Math functions through dynamic
initialization and measured 51,336 program bytes. The current constant-initialized
host functions and reference-operation tables brought the fresh build to 11,648.
Compact-mode collection then brought it to 9,896 without changing the app.

`GEA_RUNTIME_COMPACT_CODE` uses full cycle tracing on every collection, omits
generation promotion and the extra self-edge probing protocol, and avoids vector
range insertion used only to preserve buffer capacity. This trades collection
throughput for code size on small embedded heaps. It does not disable cycle
collection; self cycles are reclaimed by tracing rather than by the preliminary
filter. Normal builds retain the generational policy.

`test/runtime/compact-cycle-collection.cpp` reuses the ownership, weak-reference,
automatic-safepoint and exception-recovery tests, and checks self cycles in compact
mode. It is registered in `test/allocation-runtime.mjs` for ASan/UBSan validation.

These figures establish a build-size regression test. They do not measure
physical-watch frame time or peak runtime heap usage.

// The same ambient record global, declared and never used: no reference is
// rendered, so the `extern` nothing defines is never odr-used and the program
// links and runs.
declare const process: { exitCode: number | undefined }

const greet = (name: string): string => `hello ${name}`
console.log(greet('world'))
//! expect: hello world
export {}

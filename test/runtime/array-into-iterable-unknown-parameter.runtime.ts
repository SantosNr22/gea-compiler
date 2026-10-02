// AN ARRAY PASSED WHERE `Iterable<unknown>` IS DECLARED.
//
// node's `Readable.from(iterable: Iterable<unknown>)` is called with arrays of
// strings, numbers and mixed values. The array is read through its own
// `@@iterator`, each element entering the `unknown` carrier on the way.

function describeAll(values: Iterable<unknown>): string {
  const out: string[] = []
  for (const value of values) out.push(typeof value + ':' + String(value))
  return out.join(',')
}

//! expect: strings=string:a,string:b
console.log(`strings=${describeAll(['a', 'b'])}`)
//! expect: numbers=number:1,number:2,number:3
console.log(`numbers=${describeAll([1, 2, 3])}`)
//! expect: mixed=string:x,number:7,boolean:true
console.log(`mixed=${describeAll(['x', 7, true])}`)
//! expect: set=string:p,string:q
console.log(`set=${describeAll(new Set(['p', 'q']))}`)

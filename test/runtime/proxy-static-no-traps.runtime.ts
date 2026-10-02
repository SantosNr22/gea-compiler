//! expect: a=1 b=two
//! expect: in a=true z=false
//! expect: after set a=5 target.a=5

// A Proxy whose handler defines no trap forwards every internal method to its
// target, natively: the handler is an object literal, so the absence of each
// trap is known at compile time and no access needs a runtime lookup.

const target = { a: 1, b: 'two' }
const plain = new Proxy(target, {})
console.log('a=' + plain.a + ' b=' + plain.b)
console.log('in a=' + ('a' in plain) + ' z=' + ('z' in plain))
plain.a = 5
console.log('after set a=' + plain.a + ' target.a=' + target.a)

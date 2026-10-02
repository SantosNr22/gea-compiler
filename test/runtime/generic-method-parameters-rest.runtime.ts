// A generic method's rest parameter spelled `Parameters<E[K]>`, closed only
// in the copy a call makes. Its instantiated-member pairing once walked into
// the deferred conditional's APPARENT members (`Array<any>`'s) and recorded
// `any[] => (string | number)[]`, which rewrote `console.log`'s own
// `...optionalParams: any[]` inside the copy.
type Events = { ready(id: number, name: string): void }
class A<E extends Record<string, (...args: any[]) => void>> {
  m<K extends keyof E>(key: K, ...args: Parameters<E[K]>): void {
    console.log('x', String(key), args.length, args[0])
  }
}
new A<Events>().m('ready', 1, 'a')
//! expect: x ready 2 1

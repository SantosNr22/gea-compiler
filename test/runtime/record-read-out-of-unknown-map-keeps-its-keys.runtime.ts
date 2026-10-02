interface Doc {
  [key: string]: any
}

function keysOfValues(object: Map<unknown, unknown>): string {
  const parts: string[] = []
  for (const [key, value] of object.entries()) parts.push(`${String(key)}=${Object.keys(value as object).join('+')}`)
  return parts.join(',')
}

const loose = new Map<unknown, unknown>()
const entry: Doc = { type: 'linux', arch: 'arm64' }
loose.set('os', entry)
loose.set('empty', {})
//! expect: os=type+arch,empty=
console.log(keysOfValues(loose))

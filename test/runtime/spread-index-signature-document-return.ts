// Spreading an interface that extends an open `Document` (`[key: string]:
// any`) into a literal with one more member, and returning it as that
// interface -- mongodb's `ScramSHA.prepare` building its speculative
// handshake. The spread keeps the index signature, so the literal is the
// same open document shape plus a key.

interface BsonDocument {
  [key: string]: any
}

interface HandshakeDocument extends BsonDocument {
  ismaster?: boolean
  hello?: boolean
  client: BsonDocument
  compression: string[]
}

async function prepare(handshakeDoc: HandshakeDocument, nonce: string): Promise<HandshakeDocument> {
  const request = {
    ...handshakeDoc,
    speculativeAuthenticate: { saslStart: 1, nonce }
  }
  return request
}

async function main(): Promise<void> {
  const prepared = await prepare({ hello: true, client: { driver: 'gea' }, compression: ['none'], extra: 7 }, 'abc')
  //! expect: true none abc 7
  console.log(prepared.hello, prepared.compression[0], prepared['speculativeAuthenticate'].nonce, prepared['extra'])
  //! expect: hello,client,compression,extra,speculativeAuthenticate
  console.log(Object.keys(prepared).join(','))
}
void main()

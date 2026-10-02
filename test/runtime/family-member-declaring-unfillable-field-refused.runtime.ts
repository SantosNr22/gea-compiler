// A RECORD HANDED TO A PARAMETER NAMING THE FAMILY MEMBER THAT DECLARES THE
// FIELD THE RECORD CANNOT FILL -- REFUSED.
//
// The mirror of `client-options-record-into-optional-write-concern-source`:
// there the parameter names `ConcernOptions`, which never declares
// `metadata`, so the family layout's `metadata?: Document` (a sibling's) may
// be left absent. Here the parameter names `BucketStreamOptions` itself, and
// the body reads `options.metadata`: JavaScript sees the source's own
// `metadata` -- a Promise, which TypeScript admits into an index signature of
// `any` -- and leaving the field out would answer `undefined` for it. The
// Promise has no home in the field without boxing, so the pair is refused
// (`nodes.ts`'s `familyMemberViewFor` keeps every key the member declares).

interface ConcernOptions {
  writeConcern?: { w?: number }
}

interface BucketStreamOptions extends ConcernOptions {
  chunkSizeBytes?: number
  metadata?: { [key: string]: any }
}

function hasMetadata(options: BucketStreamOptions): boolean {
  return options.metadata !== undefined
}

function concernOf(options: ConcernOptions): number | undefined {
  return options.writeConcern?.w
}

interface ClientLikeOptions {
  appName: string
  writeConcern: { w?: number }
  metadata: Promise<{ driver: string }>
}

const client: ClientLikeOptions = { appName: 'a', writeConcern: { w: 1 }, metadata: Promise.resolve({ driver: 'a' }) }
console.log(concernOf(client))
console.log(hasMetadata(client))
console.log(hasMetadata({ chunkSizeBytes: 1 }))
//! expect-refusal: no runtime conversion is installed from native-record-ref

// `export =` of a function that also carries itself as named expandos, the
// shape @mongodb-js/saslprep ships (`saslprep.saslprep = saslprep; export =
// saslprep`). Imported by `named-import-of-export-assigned-function-expando`.
function normalize(input: string, opts?: { upper?: boolean }): string {
  return opts?.upper ? input.toUpperCase() : input.trim()
}

normalize.normalize = normalize
normalize.default = normalize

export = normalize

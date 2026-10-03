// `mongodb-connection-string-url`'s `class URLWithoutHost extends URL`, where
// `URL` is imported from a module that exports `const URLAlias = URL`. The
// base's identity follows the alias into that module, but the heritage VALUE
// is the import read in this file: the alias target is an expression of
// another module, and lowering this module body cannot cite its result.
import { Location } from './_const-class-alias-export.js'

class ConnectionString extends Location {
  get isSrv(): boolean {
    return this.scheme === 'mongodb+srv'
  }
}

const url = new ConnectionString('mongodb+srv://cluster0.example.net')
//! expect: mongodb+srv true true
console.log(url.scheme + ' ' + url.isSrv + ' ' + (url instanceof Location))

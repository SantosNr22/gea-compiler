// The aliasing module of class-extends-imported-const-class-alias.ts, shaped
// like node-compat's `whatwg-url.ts`: a `const` alias of a class, exported
// under the class's own name with its `type` twin.
class Location {
  readonly href: string
  constructor(href: string) {
    this.href = href
  }
  get scheme(): string {
    return this.href.slice(0, this.href.indexOf(':'))
  }
}

const LocationAlias = Location
type LocationAlias = Location

export { LocationAlias as Location }

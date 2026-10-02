//! expect: {"fields":{"event":"force-end"}}
//! expect: {"fields":{"event":"force-end"}}
function envelope(payload: object) {
  return { fields: payload }
}

const result = envelope({ event: 'force-end' })
console.log(JSON.stringify(result))
console.log(JSON.stringify({ fields: result.fields }))

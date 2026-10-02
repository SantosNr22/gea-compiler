// Property names that are C/C++ preprocessor macros in a header the emitted
// translation unit includes (`EOF` from stdio.h, `Z_*` from zlib.h, `errno`,
// `stdin`, `SIGINT`, `ENOENT`, `NULL`) and names C++ reserves to the
// implementation (`__proto__`-style `__x__`, `_Upper`). Emitted as bare members
// they were rewritten by the preprocessor (`double Z_NO_COMPRESSION;` became
// `double 0;`); the member spelling is escaped, while reflection keeps the JS
// names.
//! expect: keys:EOF,Z_NO_COMPRESSION,Z_DEFAULT_COMPRESSION,errno,stdin,SIGINT,ENOENT,NULL,__tag__,_Hidden,plain
//! expect: sum:-1|0|-1|2|in|2|-2||t|h|p
//! expect: json:{"EOF":-1,"Z_NO_COMPRESSION":0,"Z_DEFAULT_COMPRESSION":-1,"errno":2,"stdin":"in","SIGINT":2,"ENOENT":-2,"NULL":null,"__tag__":"t","_Hidden":"h","plain":"p"}
//! expect: class:EOF,Z_BEST_SPEED,errno={"EOF":"EOF","Z_BEST_SPEED":1,"errno":5}:EOF15
interface Constants {
  EOF: number
  Z_NO_COMPRESSION: number
  Z_DEFAULT_COMPRESSION: number
  errno: number
  stdin: string
  SIGINT: number
  ENOENT: number
  NULL: null
  __tag__: string
  _Hidden: string
  plain: string
}
const constants: Constants = {
  EOF: -1,
  Z_NO_COMPRESSION: 0,
  Z_DEFAULT_COMPRESSION: -1,
  errno: 2,
  stdin: 'in',
  SIGINT: 2,
  ENOENT: -2,
  NULL: null,
  __tag__: 't',
  _Hidden: 'h',
  plain: 'p'
}
console.log('keys:' + Object.keys(constants).join(','))
console.log(
  'sum:' +
    [
      constants.EOF,
      constants.Z_NO_COMPRESSION,
      constants.Z_DEFAULT_COMPRESSION,
      constants.errno,
      constants.stdin,
      constants.SIGINT,
      constants.ENOENT,
      constants.NULL,
      constants.__tag__,
      constants._Hidden,
      constants.plain
    ].join('|')
)
console.log('json:' + JSON.stringify(constants))

class Codes {
  EOF = 'EOF'
  Z_BEST_SPEED = 1
  errno = 0
}
const codes = new Codes()
codes.errno = 5
console.log('class:' + Object.keys(codes).join(',') + '=' + JSON.stringify(codes) + ':' + codes.EOF + codes.Z_BEST_SPEED + codes.errno)

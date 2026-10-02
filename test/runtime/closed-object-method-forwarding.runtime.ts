//! expect: {"command":"join","fields":{"authorization":"credential","sequence":"1"}}
//! expect: {"command":"presence","fields":{"audioState":"U"}}
//! expect: {"command":"transport","fields":{"direction":"recv","sequence":"1"}}
export {}

class Channel {
  request(command: string, fields: object): void {
    this.send(command, { ...fields, sequence: '1' })
  }

  presence(): void {
    this.send('presence', { audioState: 'U' })
  }

  private send(command: string, fields: object): void {
    console.log(JSON.stringify({ command, fields }))
  }
}

class Controller {
  private readonly channel = new Channel()

  start(): void {
    this.channel.request('join', { authorization: 'credential' })
  }

  presence(): void {
    this.channel.presence()
  }

  transport(): void {
    const channel: { request(command: string, fields: object): void } = this.channel
    channel.request('transport', { direction: 'recv' })
  }
}

const controller = new Controller()
controller.start()
controller.presence()
controller.transport()

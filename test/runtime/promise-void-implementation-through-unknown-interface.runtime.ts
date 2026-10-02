// A typed Promise<void> crossing a Promise<unknown> interface must adopt the
// source state and fulfill with undefined, rather than box the promise itself.
interface Agent {
  join(fail: boolean, pending: boolean): Promise<unknown>
}

let deliver: (() => void) | undefined

class NativeAgent implements Agent {
  async join(fail: boolean, pending: boolean): Promise<void> {
    if (pending) {
      await new Promise<void>((resolve) => {
        deliver = resolve
      })
    }
    if (fail) throw new Error('join rejected')
    console.log('native joined')
  }
}

async function main(): Promise<void> {
  const agent: Agent = new NativeAgent()
  const value = await agent.join(false, false)
  console.log('caller resumed', value === undefined)
  const pending = agent.join(false, true)
  deliver?.()
  console.log('pending resumed', (await pending) === undefined)
  try {
    const rejected = agent.join(true, true)
    deliver?.()
    await rejected
    console.log('incorrect fulfillment')
  } catch (error) {
    console.log('caller rejected', error instanceof Error ? error.message : 'incorrect error')
  }
}

main()
//! expect: native joined
//! expect: caller resumed true
//! expect: pending resumed true
//! expect: caller rejected join rejected
//! emitted-lacks: static_cast<gea::Promise<void>>

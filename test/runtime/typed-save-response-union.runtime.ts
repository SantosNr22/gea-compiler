//! expect: saved edited rev2 task.md true
//! expect: failed denied
interface Session {
  title: string
  note: string | null
}
type Stored<T> = T & { revision: string; file: string }
type Result<T> = { ok: true; value: T } | { ok: false; error: string }
class Editor {
  value: Stored<Session> = { title: 'initial', note: null, revision: 'rev1', file: 'task.md' }
  edit(patch: Partial<Session>): void {
    this.value = { ...this.value, ...patch }
  }
  save(response: string): void {
    const payload: unknown = JSON.parse(response)
    const result = payload as Result<Stored<Session>>
    if (result.ok) {
      this.value = { ...result.value }
      console.log('saved', this.value.title, this.value.revision, this.value.file, this.value.note === null)
    } else console.log('failed', result.error)
  }
}
const editor = new Editor()
editor.edit({ title: 'edited' })
const value = { ...editor.value, revision: 'rev2' }
editor.save(JSON.stringify({ ok: true, value }))
editor.save('{"ok":false,"error":"denied"}')

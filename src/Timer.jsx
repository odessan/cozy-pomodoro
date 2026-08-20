import { useEffect, useRef, useState } from 'react'
import { playChime } from './chime.js'

const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
const clampMin = (v) => Math.min(180, Math.max(1, Math.round(Number(v) || 0)))
const clampRounds = (v) => Math.min(12, Math.max(1, Math.round(Number(v) || 0)))

export default function Timer({ phase, setPhase }) {
  const [durations, setDurations] = useState({ work: 25, break: 5 })
  const [rounds, setRounds] = useState(4) // one round = focus + break
  const [roundsDone, setRoundsDone] = useState(0) // completed focus sessions
  const [done, setDone] = useState(false)

  const fullMs = durations[phase] * 60_000
  const [remaining, setRemaining] = useState(fullMs)
  const [running, setRunning] = useState(false)
  const endRef = useRef(0)
  const stateRef = useRef({}) // latest state, so the key handler can bind once

  // Reload the full duration when the phase or a duration changes while idle.
  // Deliberately NOT keyed on `running` — otherwise pausing would reset the
  // clock to full instead of freezing the remaining time.
  useEffect(() => {
    if (!running && !done) setRemaining(durations[phase] * 60_000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, durations])

  // the tick — timestamp-derived, re-arms on phase change so the cycle continues
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const left = endRef.current - Date.now()
      if (left > 0) {
        setRemaining(left)
        return
      }
      clearInterval(id)
      playChime()
      if (phase === 'work') {
        const completed = roundsDone + 1
        setRoundsDone(completed)
        if (completed >= rounds) {
          // last focus done — stop cleanly, skip the trailing break
          setRunning(false)
          setDone(true)
          setRemaining(0)
          return
        }
        const nextMs = durations.break * 60_000
        endRef.current = Date.now() + nextMs
        setRemaining(nextMs)
        setPhase('break')
      } else {
        const nextMs = durations.work * 60_000
        endRef.current = Date.now() + nextMs
        setRemaining(nextMs)
        setPhase('work')
      }
    }, 250)
    return () => clearInterval(id)
  }, [running, phase, durations, rounds, roundsDone, setPhase])

  // #2 — mirror the countdown into the tab title so you can glance from another tab
  useEffect(() => {
    const base = 'cozy pomodoro ⏳'
    if (done) document.title = `done ✨ · cozy pomodoro`
    else if (running) document.title = `${fmt(remaining)} · ${phase === 'work' ? 'focus' : 'break'}`
    else document.title = base
  }, [running, remaining, phase, done])

  // #3 — spacebar starts/pauses (ignored while typing in an input)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return
      const t = e.target
      if (t?.closest?.('.yt')) return // the music player owns its own keys
      // number/range fields ignore Space anyway — only bail on real text entry
      if (t && (t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (t && t.tagName === 'INPUT' && t.type !== 'number') return
      e.preventDefault()
      const s = stateRef.current
      if (s.done) return
      s.running ? s.pause() : s.start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const start = () => {
    endRef.current = Date.now() + remaining
    setRunning(true)
  }
  const pause = () => setRunning(false)
  const startOver = () => {
    setRunning(false)
    setDone(false)
    setRoundsDone(0)
    setPhase('work')
    setRemaining(durations.work * 60_000)
  }
  const skip = () => {
    const next = phase === 'work' ? 'break' : 'work'
    if (running) {
      endRef.current = Date.now() + durations[next] * 60_000
      setRemaining(durations[next] * 60_000)
    }
    setPhase(next) // manual jump doesn't count toward rounds
  }

  stateRef.current = { running, done, start, pause }

  if (done) {
    return (
      <section className="timer">
        <p className="phase-label">nice work ✨</p>
        <div className="clock done-mark">✨</div>
        <p className="done-text">
          {rounds} {rounds === 1 ? 'round' : 'rounds'} complete — go rest for real.
        </p>
        <div className="controls">
          <button className="btn btn-primary" onClick={startOver}>
            start over ↺
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="timer">
      <p className="phase-label">{phase === 'work' ? 'focus time' : 'break ☕'}</p>

      <div className="rounds-track" aria-label={`round ${Math.min(rounds, roundsDone + 1)} of ${rounds}`}>
        {Array.from({ length: rounds }).map((_, i) => (
          <span key={i} className={`dot${i < roundsDone ? ' is-done' : ''}`} />
        ))}
      </div>

      <div className="clock">{fmt(remaining)}</div>

      <div className="controls">
        {running ? (
          <button className="btn btn-primary" onClick={pause}>
            pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={start}>
            {remaining < fullMs && remaining > 0 ? 'resume' : 'start'}
          </button>
        )}
        <button className="btn" onClick={startOver}>
          reset
        </button>
        <button className="btn" onClick={skip}>
          skip →
        </button>
      </div>

      <div className="durations">
        <label className={phase === 'work' ? 'is-active' : ''}>
          <span>focus</span>
          <input
            type="number"
            min="1"
            max="180"
            value={durations.work}
            onChange={(e) => setDurations((d) => ({ ...d, work: clampMin(e.target.value) }))}
            aria-label="focus minutes"
          />
          <span>min</span>
        </label>
        <label className={phase === 'break' ? 'is-active' : ''}>
          <span>break</span>
          <input
            type="number"
            min="1"
            max="180"
            value={durations.break}
            onChange={(e) => setDurations((d) => ({ ...d, break: clampMin(e.target.value) }))}
            aria-label="break minutes"
          />
          <span>min</span>
        </label>
        <label className="rounds-field">
          <span>rounds</span>
          <input
            type="number"
            min="1"
            max="12"
            value={rounds}
            onChange={(e) => setRounds(clampRounds(e.target.value))}
            aria-label="number of rounds"
          />
        </label>
      </div>
    </section>
  )
}

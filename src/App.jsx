import { useState } from 'react'
import Timer from './Timer.jsx'
import MusicDock from './MusicDock.jsx'

export default function App() {
  const [phase, setPhase] = useState('work')

  return (
    <div className={`app app-${phase}`}>
      <div className="steam" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <header className="masthead">
        <h1>cozy pomodoro</h1>
        <p>focus a little, rest a little ⏳</p>
      </header>

      <main className="stage">
        <Timer phase={phase} setPhase={setPhase} />
        <MusicDock />
      </main>
    </div>
  )
}

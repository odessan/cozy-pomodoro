# cozy pomodoro ⏳

A warm little pomodoro timer that plays your own music while you focus.

Paste a Spotify or YouTube link and it becomes the soundtrack for your session —
YouTube plays **audio-only** (the video is hidden), so a playlist just keeps
going in the background while the timer runs.

## Features

- Configurable focus / break minutes and number of rounds
- Timestamp-derived countdown, so it stays accurate in a background tab
- Soft Web Audio chime at the end of each phase — no audio file to load
- Countdown mirrored into the tab title
- **Space** starts and pauses the timer
- Music dock: Spotify embed, or a YouTube video/playlist with play, skip,
  volume and mute — and a watchdog that resumes any pause you didn't ask for

## Run it

```bash
npm install
npm run dev
```

```bash
npm test        # detectEmbed + buildSrc unit tests
npm run build   # production bundle into dist/
```

## Deploy

Static build — drag `dist/` onto Netlify, or:

```bash
npx netlify deploy --prod --dir=dist
```

## Notes

YouTube audio-only needs the official IFrame API: there's no attribute to hide
just the video on a plain embed. The iframe is rendered by hand (a playlist-only
`YT.Player` never initialises its `src`), then the API attaches to it. It stays
in the DOM as a clipped 1px sliver with `tabIndex="-1"` — off-screen media gets
throttled, and a focusable hidden iframe swallows the spacebar.

Built with React + Vite.

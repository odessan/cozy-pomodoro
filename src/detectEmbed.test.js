import { describe, it, expect } from 'vitest'
import { detectEmbed } from './detectEmbed.js'

describe('detectEmbed', () => {
  it('routes a Spotify playlist to the embed player', () => {
    const r = detectEmbed('https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd')
    expect(r).toEqual({
      service: 'spotify',
      embedSrc: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd',
    })
  })

  it('handles a Spotify track with an intl prefix and query string', () => {
    const r = detectEmbed('https://open.spotify.com/intl-de/track/4cOdK2wGLETKBW3PvgPWqT?si=abc')
    expect(r).toEqual({
      service: 'spotify',
      embedSrc: 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT',
    })
  })

  it('extracts ids from a YouTube playlist', () => {
    const r = detectEmbed('https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMxxx')
    expect(r).toEqual({ service: 'youtube', videoId: null, listId: 'PLrAXtmRdnEQy6nuLMxxx' })
  })

  it('extracts the video id from a bare YouTube watch link', () => {
    const r = detectEmbed('https://www.youtube.com/watch?v=jfKfPfyJRdk')
    expect(r).toEqual({ service: 'youtube', videoId: 'jfKfPfyJRdk', listId: null })
  })

  it('keeps both video and list ids when a watch link is inside a playlist', () => {
    const r = detectEmbed('https://www.youtube.com/watch?v=jfKfPfyJRdk&list=PLabc')
    expect(r).toEqual({ service: 'youtube', videoId: 'jfKfPfyJRdk', listId: 'PLabc' })
  })

  it('extracts the video id from a youtu.be short link', () => {
    const r = detectEmbed('https://youtu.be/jfKfPfyJRdk')
    expect(r).toEqual({ service: 'youtube', videoId: 'jfKfPfyJRdk', listId: null })
  })

  it('returns null for garbage', () => {
    expect(detectEmbed('not a link')).toBeNull()
    expect(detectEmbed('https://example.com/whatever')).toBeNull()
    expect(detectEmbed('')).toBeNull()
    expect(detectEmbed(null)).toBeNull()
  })
})

import { buildSrc } from './YouTubePlayer.jsx'

describe('buildSrc', () => {
  it('loops a lone video so it does not go silent mid-session', () => {
    const src = buildSrc('abc123', null)
    expect(src).toContain('loop=1')
    expect(src).toContain('playlist=abc123')
  })

  it('does not loop when a playlist supplies the next track', () => {
    expect(buildSrc('abc123', 'PL1')).not.toContain('loop=1')
    expect(buildSrc(null, 'PL1')).toContain('videoseries')
  })
})

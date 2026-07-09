import { useState } from 'react'
import { Play, Square } from 'lucide-react'
import { Progression } from 'src/utils/progressions'
import { Mode } from 'src/utils/types'
import { ChordFlavor } from 'src/utils/chords'
import { analyzeLoop } from 'src/utils/loop'

interface IProps {
  progressions: Progression[]
  modes: Mode[]
  onPlay: (progression: Progression) => void
  activeProgressionId: string | null
}

function romanWithFlavour(roman: string, flavour?: ChordFlavor): string {
  if (!flavour) return roman
  if (flavour === 'flat7') return roman + '7'
  if (flavour === 'maj7') return roman + 'maj7'
  if (flavour === 'sus4') return roman + 'sus4'
  if (flavour === 'sus2') return roman + 'sus2'
  return roman
}

const ProgressionsPanel = ({ progressions, modes, onPlay, activeProgressionId }: IProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="progressions-panel">
      <button
        className="progressions-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        Chord Progressions {open ? '\u25B4' : '\u25BE'}
      </button>
      {open && (
        <div className="progressions-list">
          <p className="progressions-disclaimer">
            Not official music theory terms. Names are just what I like to call them / how the progression feels.
          </p>
          {progressions.map(p => {
            const romanNumerals = p.steps.map(step => {
              const mode = modes.find(m => m.name === step.mode)
              return mode ? mode.romanNumerals[step.degreeIndex] : '?'
            })
            const pattern = romanNumerals.map((roman, i) =>
              romanWithFlavour(roman, p.steps[i].flavour)
            ).join(' \u2013 ')
            const loop = analyzeLoop(romanNumerals)
            const label = loop.isLoop ? loop.character : null
            return (
              <div key={p.id} className="progression-row">
                <div className="progression-info">
                  {p.spotifyUrl ? (
                    <a
                      className="progression-name progression-spotify-link"
                      href={p.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open playlist on Spotify"
                    >
                      {p.name}
                      <svg
                        className="spotify-icon"
                        viewBox="0 0 496 512"
                        width="14"
                        height="14"
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm100.7 364.9c-4.2 0-6.8-1.4-10.7-3.5-62.4-37.4-135-39.7-206.7-24.5-4.2 1.4-9.8 2.8-13 2.8-8.4 0-14-6.3-14-13.7 0-9.8 6.3-14.7 14-16.1 82.9-18.4 165.5-15.5 235.6 26.6 6.3 4.2 9.8 8.4 9.8 18.4-.1 9.7-7.7 15.5-15 10zm27.9-70.7c-5.6 0-9.1-2.1-13-4.9-59.1-35.7-142.6-52.5-231.7-30.2-4.9 1.4-7.7 2.8-12.5 2.8-10.5 0-19-8.4-19-19s5.6-16.9 15.5-19.4c26.7-6.6 53.9-11.5 91.6-11.5 62.2 0 122.1 15.5 169.1 44.1 7.7 4.9 11.2 11.2 11.2 19.5 0 10.6-8.4 18.6-19 18.6zm32.2-77.2c-5.6 0-9.1-1.4-14-4.2-63.5-38-171.9-52.5-250.9-30.2-5.6 1.4-11.9 4.2-18.4 4.2-13.7 0-24.5-10.9-24.5-24.5 0-13.7 8.4-21.7 17.5-24.5 27.1-8.1 57.6-12.5 96-12.5 66.9 0 137.1 14.7 191.6 47.6 8.1 4.9 13.7 13.7 13.7 25.2 0 13.7-11.2 25.2-25 25.2z"
                        />
                      </svg>
                    </a>
                  ) : (
                    <span className="progression-name">{p.name}</span>
                  )}
                  <span className="progression-pattern">
                    {pattern}
                    {label && <span className="progression-cadence"> &mdash; {label}</span>}
                  </span>
                  <span className="progression-songs">{p.songs.join(', ')}</span>
                </div>
                <button
                  className={`play-progression-btn${activeProgressionId === p.id ? ' playing' : ''}`}
                  onClick={() => onPlay(p)}
                >
                  {activeProgressionId === p.id ? <Square size={14} /> : <Play size={14} />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProgressionsPanel

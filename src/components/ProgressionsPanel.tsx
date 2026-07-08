import { useState } from 'react'
import { Progression } from 'src/utils/progressions'
import { Mode } from 'src/utils/types'
import { ChordFlavor } from 'src/utils/chords'

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
            const pattern = p.steps.map(step => {
              const mode = modes.find(m => m.name === step.mode)
              const roman = mode ? mode.romanNumerals[step.degreeIndex] : '?'
              return romanWithFlavour(roman, step.flavour)
            }).join(' \u2013 ')
            return (
              <div key={p.id} className="progression-row">
                <div className="progression-info">
                  <span className="progression-name">{p.name}</span>
                  <span className="progression-pattern">{pattern}</span>
                  <span className="progression-songs">{p.songs.join(', ')}</span>
                </div>
                <button
                  className={`play-progression-btn${activeProgressionId === p.id ? ' playing' : ''}`}
                  onClick={() => onPlay(p)}
                >
                  {activeProgressionId === p.id ? '\u25A0' : '\u25B6'}
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

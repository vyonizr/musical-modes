import React from 'react'
import { Mode } from 'src/utils/types'
import { COLOR_CLASSNAMES, KEY_ROWS } from 'src/utils/constants'
import { triggerAttackChord, triggerReleaseChord, ChordFlavor, ChordHandle, display7thChordName, displaySusChordName } from 'src/utils/chords'

interface IProps {
  index: number
  mode: Mode
  activeRowIndex: number
  keyboardPressedChords: string[]
  activeFlavour?: ChordFlavor
  activeProgressionStep?: { mode: string; degreeIndex: number; flavour?: ChordFlavor } | null
  showKeyHint?: boolean
}

const TableContent = ({
  mode,
  index,
  activeRowIndex,
  keyboardPressedChords,
  activeFlavour,
  activeProgressionStep,
  showKeyHint = true,
}: IProps) => {
  const capitalizedName = mode.name.charAt(0).toUpperCase() + mode.name.slice(1)

  // Keyed by column, not by chord name: the handle must outlive any re-render
  // that changes the chord or flavour under the pointer.
  const heldRef = React.useRef(new Map<number, ChordHandle>())

  const releaseCell = (chordIndex: number) => {
    const handle = heldRef.current.get(chordIndex)
    if (!handle) return
    heldRef.current.delete(chordIndex)
    triggerReleaseChord(handle)
  }

  const attackCell = (chordIndex: number, chord: string) => {
    releaseCell(chordIndex)
    heldRef.current.set(chordIndex, triggerAttackChord(chord, activeFlavour))
  }

  React.useEffect(() => {
    const held = heldRef.current
    return () => {
      held.forEach(triggerReleaseChord)
      held.clear()
    }
  }, [])

  return (
    <tbody>
      <tr className={`mode-name-header ${COLOR_CLASSNAMES[index]}`}>
        <th colSpan={7}>{capitalizedName}</th>
      </tr>
      <tr className={`mode-row ${COLOR_CLASSNAMES[index]} bold`}>
        {mode.chords.map((chord: string, chordIndex: number) => {
          let displayName =
            activeFlavour === "sus4" || activeFlavour === "sus2"
              ? displaySusChordName(chord, activeFlavour)
              : activeFlavour
              ? display7thChordName(chord, activeFlavour)
              : chord
          if (activeProgressionStep && activeProgressionStep.mode === mode.name && activeProgressionStep.degreeIndex === chordIndex && activeProgressionStep.flavour) {
            const pf = activeProgressionStep.flavour
            displayName = pf === "sus4" || pf === "sus2"
              ? displaySusChordName(chord, pf)
              : display7thChordName(chord, pf)
          }
          const fontSize =
            displayName.length > 7 ? '0.65em' :
            displayName.length > 5 ? '0.8em' : undefined
          return (
          <td
            key={chordIndex}
            className={`pointer noselect playable-chord${
              keyboardPressedChords.includes(chord) ? ' keyboard-active' : ''
            }${
              activeProgressionStep && activeProgressionStep.mode === mode.name && activeProgressionStep.degreeIndex === chordIndex ? ' progression-active' : ''
            }`}
            onMouseDown={() => attackCell(chordIndex, chord)}
            onMouseUp={() => releaseCell(chordIndex)}
            onMouseLeave={() => releaseCell(chordIndex)}
            onTouchStart={(e) => { e.preventDefault(); attackCell(chordIndex, chord) }}
            onTouchEnd={() => releaseCell(chordIndex)}
            onTouchCancel={() => releaseCell(chordIndex)}
          >
            <div className='chord-container'>
              <span style={fontSize ? { fontSize } : undefined}>{displayName}</span>
              <span className='roman-label'>{mode.romanNumerals[chordIndex]}</span>
            </div>
            {showKeyHint && activeRowIndex < KEY_ROWS.length && (
              <span className='key-hint'>{KEY_ROWS[activeRowIndex][chordIndex]}</span>
            )}
          </td>
          )
        })}
      </tr>
    </tbody>
  )
}

export default TableContent

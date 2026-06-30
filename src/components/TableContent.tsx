import React from 'react'
import { Mode } from 'src/utils/types'
import { COLOR_CLASSNAMES, KEY_ROWS } from 'src/utils/constants'
import { triggerAttackChord, triggerReleaseChord, ChordFlavor, display7thChordName, displaySusChordName } from 'src/utils/chords'

interface IProps {
  index: number
  mode: Mode
  activeRowIndex: number
  keyboardPressedChords: string[]
  activeFlavour?: ChordFlavor
}

const TableContent = ({
  mode,
  index,
  activeRowIndex,
  keyboardPressedChords,
  activeFlavour,
}: IProps) => {
  const capitalizedName = mode.name.charAt(0).toUpperCase() + mode.name.slice(1)

  return (
    <tbody>
      <tr className={`mode-name-header ${COLOR_CLASSNAMES[index]}`}>
        <th colSpan={7}>{capitalizedName}</th>
      </tr>
      <tr className={`mode-row ${COLOR_CLASSNAMES[index]} bold`}>
        {mode.chords.map((chord: string, chordIndex: number) => {
          const displayName =
            activeFlavour === "sus4" || activeFlavour === "sus2"
              ? displaySusChordName(chord, activeFlavour)
              : activeFlavour
              ? display7thChordName(chord, activeFlavour)
              : chord
          const fontSize =
            displayName.length > 7 ? '0.65em' :
            displayName.length > 5 ? '0.8em' : undefined
          return (
          <td
            key={chordIndex}
            className={`pointer noselect playable-chord${
              keyboardPressedChords.includes(chord) ? ' keyboard-active' : ''
            }`}
            onMouseDown={() => triggerAttackChord(chord, activeFlavour)}
            onMouseUp={() => triggerReleaseChord(chord, activeFlavour)}
            onMouseLeave={() => triggerReleaseChord(chord, activeFlavour)}
          >
            <div className='chord-container'>
              <span style={fontSize ? { fontSize } : undefined}>{displayName}</span>
              <span className='roman-label'>{mode.romanNumerals[chordIndex]}</span>
            </div>
            {activeRowIndex < KEY_ROWS.length && (
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

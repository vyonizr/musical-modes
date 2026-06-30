import React from 'react'
import { Mode } from 'src/utils/types'
import { COLOR_CLASSNAMES, KEY_ROWS } from 'src/utils/constants'
import { triggerAttackChord, triggerReleaseChord } from 'src/utils/chords'

interface IProps {
  index: number
  mode: Mode
  activeRowIndex: number
  keyboardPressedChords: string[]
}

const TableContent = ({
  mode,
  index,
  activeRowIndex,
  keyboardPressedChords,
}: IProps) => {
  const capitalizedName = mode.name.charAt(0).toUpperCase() + mode.name.slice(1)

  return (
    <tbody>
      <tr className={`mode-name-header ${COLOR_CLASSNAMES[index]}`}>
        <th colSpan={7}>{capitalizedName}</th>
      </tr>
      <tr className={`mode-row ${COLOR_CLASSNAMES[index]} bold`}>
        {mode.chords.map((chord: string, chordIndex: number) => (
          <td
            key={chordIndex}
            className={`pointer noselect playable-chord${
              keyboardPressedChords.includes(chord) ? ' keyboard-active' : ''
            }`}
            onMouseDown={() => triggerAttackChord(chord)}
            onMouseUp={() => triggerReleaseChord(chord)}
            onMouseLeave={() => triggerReleaseChord(chord)}
          >
            <div className='chord-container'>
              <span>{chord}</span>
              <span className='roman-label'>{mode.romanNumerals[chordIndex]}</span>
            </div>
            {activeRowIndex < KEY_ROWS.length && (
              <span className='key-hint'>{KEY_ROWS[activeRowIndex][chordIndex]}</span>
            )}
          </td>
        ))}
      </tr>
    </tbody>
  )
}

export default TableContent

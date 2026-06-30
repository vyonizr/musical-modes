import React from 'react'
import { Mode } from 'src/utils/types'
import { COLOR_CLASSNAMES } from 'src/utils/constants'
import { triggerAttackChord, triggerReleaseChord } from 'src/utils/chords'

interface IProps {
  index: number
  mode: Mode
  keyboardPressedChords: string[]
}

const TableContent = ({
  mode,
  index,
  keyboardPressedChords,
}: IProps) => {
  return (
    <tbody>
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
          </td>
        ))}
      </tr>
    </tbody>
  )
}

export default TableContent

import React, { Fragment } from 'react'
import { Mode } from 'src/utils/types'
import { COLOR_CLASSNAMES } from 'src/utils/constants'
import { chordsSwitch, playChord } from 'src/utils/chords'

interface IProps {
  highlighted: {
    current: string | null
    previous: string | null
  }
  index: number
  mode: Mode
}

const TableContent = ({ highlighted, mode, index }: IProps) => {
  return (
    <tbody>
      <tr
        className={`mode-row ${COLOR_CLASSNAMES[index]} bold ${
          highlighted.current == mode.name ? 'highlighted' : ''
        }`}
      >
        {mode.chords.map((chord: string, index: number) => (
          <td
            key={index}
            className='pointer noselect playable-chord'
            onClick={() => playChord(chord)}
          >
            <audio
              id={`audio-${chord}`}
              src={chordsSwitch(chord)}
              preload='auto'
            />
            <div className='relative chord-container'>
              <span>{chord}</span>
              {highlighted.current == mode.name && (
                <div className='roman-appear'>
                  <span>{mode.romanNumerals[index]}</span>
                </div>
              )}
              {highlighted.previous == mode.name && (
                <div className='roman-disappear'>
                  <span>{mode.romanNumerals[index]}</span>
                </div>
              )}
            </div>
          </td>
        ))}
      </tr>
    </tbody>
  )
}

export default TableContent

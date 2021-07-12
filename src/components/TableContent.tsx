import React from 'react'
import { Mode } from 'src/utils/types'
import { COLOR_CLASSNAMES } from 'src/utils/constants'
import { chordsSwitch, playChord } from 'src/utils/chords'

interface IProps {
  isRomanMode: boolean
  index: number
  mode: Mode
}

const TableContent = ({ isRomanMode, mode, index }: IProps) => {
  const handleChordDisplay = (
    isRomanMode: boolean,
    romanNumeral: string,
    chord: string
  ): string => {
    return isRomanMode ? romanNumeral : chord
  }

  return (
    <tbody>
      <tr className={`mode-row ${COLOR_CLASSNAMES[index]} bold`}>
        {mode.chords.map((chord: string, index: number) => (
          <td
            key={index}
            className='pointer noselect playable-chord'
            onMouseDown={() => playChord(chord)}
          >
            <audio
              id={`audio-${chord}`}
              src={chordsSwitch(chord)}
              preload='auto'
            />
            <div className='chord-container'>
              <span>
                {handleChordDisplay(
                  isRomanMode,
                  mode.romanNumerals[index],
                  chord
                )}
              </span>
            </div>
          </td>
        ))}
      </tr>
    </tbody>
  )
}

export default TableContent

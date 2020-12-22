import React, { Fragment } from 'react'
import { Mode } from 'src/utils/types'
import { COLOR_CLASSNAMES } from 'src/utils/constants'
import { playChord } from 'src/utils/chords'

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
    <Fragment>
      <tr
        className={`${COLOR_CLASSNAMES[index]} bold ${
          highlighted.current == mode.name ? 'highlighted' : ''
        }`}
      >
        {mode.chords.map((chord: string, index: number) => (
          <td
            key={index}
            className='pointer noselect playable-chord'
            onClick={() => playChord(chord)}
          >
            <div className='relative'>
              <span>{chord}</span>
              {highlighted.current == mode.name && (
                <span className='roman-appear'>
                  {mode.romanNumerals[index]}
                </span>
              )}
              {highlighted.previous == mode.name && (
                <span className='roman-disappear'>
                  {mode.romanNumerals[index]}
                </span>
              )}
            </div>
          </td>
        ))}
      </tr>
    </Fragment>
  )
}

export default TableContent

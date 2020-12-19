import React, { Fragment } from 'react'
import { Mode } from '../utils/types'
import { COLOR_CLASSNAMES } from '../utils/constants'

interface IProps {
  highlighted: boolean
  index: number
  mode: Mode
}

const TableContent = ({ highlighted, mode, index }: IProps) => {
  return (
    <Fragment>
      <tr
        className={`${COLOR_CLASSNAMES[index]} bold ${
          highlighted ? 'highlighted' : ''
        }`}
      >
        {mode.chords.map((chord: string, index: number) => (
          <td key={index}>
            <div className='relative'>
              <span>{chord}</span>
              {highlighted && (
                <span className='roman-appear'>
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

import React from 'react'
import { Mode } from '../utils/types'
import { COLOR_CLASSNAMES } from '../utils/constants'

interface IProps {
  highlighted: boolean
  view: string
  index: number
  mode: Mode
}

const TableContent = ({ highlighted, view, mode, index }: IProps) => {
  return (
    <tr
      className={`${COLOR_CLASSNAMES[index]} bold mode-row ${
        highlighted ? 'highlighted' : ''
      }`}
    >
      {view === 'Chords' &&
        mode.chords.map((chord: string, index: number) => (
          <td key={index} className='pv3 ph3'>
            {chord}
          </td>
        ))}
      {view === 'Numerals' &&
        mode.romanNumerals.map((roman: string, index: number) => (
          <td key={index} className='tc'>
            {roman}
          </td>
        ))}
      {view === 'Intervals' &&
        mode.intervals.map((interval: string, index: number) => (
          <td key={index}>{interval}</td>
        ))}
    </tr>
  )
}

export default TableContent

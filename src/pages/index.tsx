import { useState, Fragment } from 'react'
import Head from 'next/head'

import { generateModes } from '../utils'
import { KEYS, TABLE_VIEW_OPTIONS, COLOR_CLASSNAMES } from '../utils/constants'

import TableContent from '../components/TableContent'

export default function Home() {
  const [selectedScale, setSelectedScale] = useState('C')
  const [view, setView] = useState(TABLE_VIEW_OPTIONS[0])
  const [highlighted, setHighlighed] = useState('')

  const handleSelectChange = ({ target }) => {
    setSelectedScale(target.value)
  }
  const handleRadioChange = ({ target }) => {
    setView(target.value)
  }
  const highlightMode = (modeName: string) => {
    if (highlighted === modeName) {
      setHighlighed(null)
    } else {
      setHighlighed(modeName)
    }
  }

  return (
    <div>
      <Head>
        <title>Musical Modes</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main>
        <h1 className='f1 lh-title'>Musical Modes</h1>
        <div className='flex justify-center'>
          <div className='mh3'>
            <select
              value={selectedScale}
              name='modes'
              id='modes'
              onChange={handleSelectChange}
              disabled={view !== 'Chords'}
            >
              {KEYS.map((pianoKey: string, index) => (
                <option key={index} value={pianoKey}>
                  {pianoKey}
                </option>
              ))}
            </select>
          </div>
          <div className='mh3'>
            {TABLE_VIEW_OPTIONS.map((option: string, index) => (
              <div key={index}>
                <input
                  type='radio'
                  name='view'
                  value={option}
                  checked={view === option}
                  onChange={handleRadioChange}
                />
                <label htmlFor={option}>{option}</label>
              </div>
            ))}
          </div>
        </div>
        <table className='f6 w-100 mw8 center'>
          {generateModes(selectedScale).map((mode, index) => (
            <TableContent
              highlighted={highlighted === mode.name}
              view={view}
              mode={mode}
              index={index}
              key={index}
            />
          ))}
        </table>
        <div className='legends-wrapper'>
          {COLOR_CLASSNAMES.map((modeName) => (
            <div
              className={`bg-${modeName} white legends-items max-content`}
              onMouseOver={() => highlightMode(modeName)}
              onMouseLeave={() => highlightMode('')}
            >
              {modeName}
            </div>
          ))}
        </div>
        <footer className='w-100 tc'>
          © {new Date().getFullYear()} vyonizr
        </footer>
      </main>
    </div>
  )
}

import { Fragment, useState } from 'react'
import Head from 'next/head'

import { generateModes } from '../utils'
import { KEYS, COLOR_CLASSNAMES } from '../utils/constants'
import { Mode } from '../utils/types'

import TableContent from '../components/TableContent'
import Slider from '../components/Slider'

export default function Home() {
  const [selectedScale, setSelectedScale] = useState('C')
  const [isRomanMode, setIsRomanMode] = useState(false)
  const [activeModes, setActiveModes] = useState(COLOR_CLASSNAMES)

  const handleSelectChange = (
    event: React.ChangeEvent<{ value: string }>
  ): void => {
    setSelectedScale(event.target.value)
  }

  const toggleActiveMode = (modeName: string): void => {
    const updatedActiveModes = [...activeModes]
    if (updatedActiveModes.some((activeMode) => activeMode === modeName)) {
      const filtered = updatedActiveModes.filter(
        (activeMode) => activeMode !== modeName
      )
      setActiveModes(filtered)
    } else {
      updatedActiveModes.push(modeName)
      setActiveModes(updatedActiveModes)
    }
  }

  const isModeActive = (modeName: string): boolean => {
    return activeModes.some((activeMode) => activeMode === modeName)
  }

  return (
    <div>
      <Head>
        <title>Musical Modes</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main>
        <h1 className='title black'>Musical Modes</h1>
        <div className='mode-select black'>
          <div className='roman-select'>
            <label htmlFor='isRomanMode'>Roman Numerals</label>
            <Slider
              name='isRomanMode'
              isChecked={isRomanMode}
              onClick={() => setIsRomanMode((currentState) => !currentState)}
            />
          </div>
          <div className='key-select'>
            <label htmlFor='modes'>Root Key</label>
            <select
              value={selectedScale}
              name='modes'
              id='modes'
              onChange={(event: React.ChangeEvent<{ value: string }>) =>
                handleSelectChange(event)
              }
            >
              {KEYS.map((pianoKey: string, index: number) => (
                <option key={index} value={pianoKey}>
                  {pianoKey}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='table-container'>
          {activeModes.length === 0 ? (
            <h3>Nothing to play ☹️</h3>
          ) : (
            <Fragment>
              <p className='black'>Tap to play the chords</p>
              <table>
                {generateModes(selectedScale).map(
                  (mode: Mode, index: number) => (
                    <Fragment key={index}>
                      {isModeActive(mode.name) && (
                        <TableContent
                          isRomanMode={isRomanMode}
                          mode={mode}
                          index={index}
                        />
                      )}
                    </Fragment>
                  )
                )}
              </table>
            </Fragment>
          )}
        </div>
        <div className='legends-wrapper'>
          {COLOR_CLASSNAMES.map((modeName: string, index: number) => (
            <div
              key={index}
              className={`bg-${
                isModeActive(modeName) ? `${modeName} white` : 'disabled'
              } legends-items max-content pointer noselect`}
              onClick={() => toggleActiveMode(modeName)}
            >
              {modeName}
            </div>
          ))}
        </div>
        <footer>
          © {new Date().getFullYear()}{' '}
          <a
            href='https://vyonizr.com/'
            target='_blank'
            rel='noopener noreferrer'
          >
            vyonizr
          </a>
        </footer>
      </main>
    </div>
  )
}

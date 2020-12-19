import { useState } from 'react'
import Head from 'next/head'

import { generateModes } from '../utils'
import { KEYS, COLOR_CLASSNAMES } from '../utils/constants'
import { Mode } from '../utils/types'

import TableContent from '../components/TableContent'

export default function Home() {
  const [selectedScale, setSelectedScale] = useState('C')
  const [highlighted, setHighlighed] = useState('')

  const handleSelectChange = (
    event: React.ChangeEvent<{ value: string }>
  ): void => {
    setSelectedScale(event.target.value)
  }
  const highlightMode = (modeName: string): void => {
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
        <h1 className='title black'>Musical Modes</h1>
        <table>
          {generateModes(selectedScale).map((mode: Mode, index: number) => (
            <TableContent
              highlighted={highlighted === mode.name}
              mode={mode}
              index={index}
              key={index}
            />
          ))}
        </table>
        <div className='legends-wrapper'>
          {COLOR_CLASSNAMES.map((modeName: string) => (
            <div
              className={`bg-${modeName} white legends-items max-content`}
              onMouseOver={() => highlightMode(modeName)}
              onMouseLeave={() => highlightMode('')}
            >
              {modeName}
            </div>
          ))}
        </div>
        <div className='mode-select black'>
          <h3>Select Key</h3>
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

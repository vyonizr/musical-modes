import { useState } from 'react'
import Head from 'next/head'

import { generateModes } from '../utils'
import { KEYS, COLOR_CLASSNAMES } from '../utils/constants'
import { Mode } from '../utils/types'

import TableContent from '../components/TableContent'

export default function Home() {
  const [selectedScale, setSelectedScale] = useState('C')
  const [highlighted, setHighlighed] = useState({
    current: null,
    previous: null,
  })

  const handleSelectChange = (
    event: React.ChangeEvent<{ value: string }>
  ): void => {
    setSelectedScale(event.target.value)
  }
  const highlightMode = (modeName: string | null): void => {
    setHighlighed({
      current: modeName,
      previous: highlighted.current,
    })
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
              key={index}
              highlighted={highlighted}
              mode={mode}
              index={index}
            />
          ))}
        </table>
        <div className='legends-wrapper'>
          {COLOR_CLASSNAMES.map((modeName: string, index: number) => (
            <div
              key={index}
              className={`bg-${modeName} white legends-items max-content pointer noselect`}
              onMouseOver={() => highlightMode(modeName)}
              onMouseLeave={() => highlightMode(null)}
            >
              {modeName}
            </div>
          ))}
        </div>
        <div className='mode-select black'>
          <label htmlFor='modes'>Select Key</label>
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

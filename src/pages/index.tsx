import { Fragment, useState, useEffect, useRef } from 'react'
import Head from 'next/head'

import { generateModes } from '../utils'
import { KEYS, COLOR_CLASSNAMES } from '../utils/constants'
import { Mode } from '../utils/types'
import { triggerAttackChord, triggerReleaseChord } from '../utils/chords'

import TableContent from '../components/TableContent'
import Slider from '../components/Slider'

const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

function isTextInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true
  return false
}

export default function Home() {
  const [selectedScale, setSelectedScale] = useState('C')
  const [isRomanMode, setIsRomanMode] = useState(false)
  const [activeModes, setActiveModes] = useState([COLOR_CLASSNAMES[0]])

  const selectedScaleRef = useRef(selectedScale)
  const activeModesRef = useRef(activeModes)
  const [keyboardPressedChords, setKeyboardPressedChords] = useState<string[]>(
    []
  )
  const pressedChordsRef = useRef(new Set<string>())

  useEffect(() => {
    selectedScaleRef.current = selectedScale
    activeModesRef.current = activeModes
  }, [selectedScale, activeModes])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (isTextInput(e.target)) return

      const key = e.key.toUpperCase()
      const modes = generateModes(selectedScaleRef.current)
      const activeModeNames = activeModesRef.current
      const activeModesData = modes.filter((m) =>
        activeModeNames.includes(m.name)
      )

      for (let row = 0; row < KEY_ROWS.length; row++) {
        const col = KEY_ROWS[row].indexOf(key)
        if (
          col !== -1 &&
          row < activeModesData.length &&
          col < activeModesData[row].chords.length
        ) {
          const chordName = activeModesData[row].chords[col]
          pressedChordsRef.current.add(chordName)
          setKeyboardPressedChords((prev) => [...prev, chordName])
          triggerAttackChord(chordName)
          return
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      const modes = generateModes(selectedScaleRef.current)
      const activeModeNames = activeModesRef.current
      const activeModesData = modes.filter((m) =>
        activeModeNames.includes(m.name)
      )

      for (let row = 0; row < KEY_ROWS.length; row++) {
        const col = KEY_ROWS[row].indexOf(key)
        if (
          col !== -1 &&
          row < activeModesData.length &&
          col < activeModesData[row].chords.length
        ) {
          const chordName = activeModesData[row].chords[col]
          pressedChordsRef.current.delete(chordName)
          setKeyboardPressedChords((prev) =>
            prev.filter((c) => c !== chordName)
          )
          triggerReleaseChord(chordName)
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      pressedChordsRef.current.forEach((chordName) =>
        triggerReleaseChord(chordName)
      )
      pressedChordsRef.current.clear()
    }
  }, [])

  const handleSelectChange = (
    event: React.ChangeEvent<{ value: string }>
  ): void => {
    setSelectedScale(event.target.value)
    ;(document.activeElement as HTMLElement)?.blur()
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
              onClick={() => {
                setIsRomanMode((currentState) => !currentState)
                ;(document.activeElement as HTMLElement)?.blur()
              }}
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
            <h3>Nothing to play 😕</h3>
          ) : (
            <Fragment>
              <p className='black' style={{ marginTop: '0.5rem' }}>
                Tap or use keyboard to play the chords
              </p>
              <table>
                {generateModes(selectedScale).map(
                  (mode: Mode, index: number) => (
                    <Fragment key={index}>
                      {isModeActive(mode.name) && (
                        <TableContent
                          isRomanMode={isRomanMode}
                          mode={mode}
                          index={index}
                          keyboardPressedChords={keyboardPressedChords}
                        />
                      )}
                    </Fragment>
                  )
                )}
              </table>
            </Fragment>
          )}
        </div>
        <p className='black' style={{ marginTop: '1rem' }}>
          Toggle modes
        </p>
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
          </a>{' '}
          |{' '}
          <a
            href='https://github.com/vyonizr/musical-modes'
            target='_blank'
            rel='noopener noreferrer'
          >
            Github
          </a>
        </footer>
      </main>
    </div>
  )
}

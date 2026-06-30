import { Fragment, useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { Joyride, Step, STATUS, EVENTS, EventData } from 'react-joyride'

import { generateModes } from '../utils'
import { KEYS, COLOR_CLASSNAMES, KEY_ROWS } from '../utils/constants'
import { Mode } from '../utils/types'
import {
  triggerAttackChord,
  triggerReleaseChord,
  ChordFlavor,
} from '../utils/chords'

import TableContent from '../components/TableContent'

const TOUR_STEPS: Step[] = [
  {
    target: '#modes',
    content: 'Pick a root key. All chords on the page will update to match.',
    skipBeacon: true,
  },
  {
    target: '.legends-wrapper',
    content:
      'Toggle which modes are shown. Each coloured button is a different musical mode.',
  },
  {
    target: 'table',
    content:
      'Tap any chord to play it. On desktop, you can hold it down to sustain.',
  },
  {
    target: 'table',
    content:
      'Your keyboard maps to the chords too — Q through U for the top row, A through J for the second, Z through M for the third.',
  },
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
  const [activeModes, setActiveModes] = useState([COLOR_CLASSNAMES[0]])

  const [tourRun, setTourRun] = useState(false)
  const [tourStepIndex, setTourStepIndex] = useState(0)

  const selectedScaleRef = useRef(selectedScale)
  const activeModesRef = useRef(activeModes)
  const sevenFlavourRef = useRef<ChordFlavor | undefined>(undefined)
  const [activeFlavour, setActiveFlavour] = useState<ChordFlavor | undefined>(undefined)
  const [keyboardPressedChords, setKeyboardPressedChords] = useState<string[]>(
    []
  )
  const pressedChordsRef = useRef(
    new Map<string, ChordFlavor | undefined>()
  )

  useEffect(() => {
    if (!localStorage.getItem('musical-modes-tour-seen')) {
      setTourRun(true)
      setTourStepIndex(0)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const urlKey = params.get('key')
    if (urlKey) {
      const matched = KEYS.find(k => k.replace('♭', 'b') === urlKey)
      if (matched) setSelectedScale(matched)
    }

    const urlModes = params.get('modes')
    if (urlModes) {
      const parsed = urlModes.split(',').filter(m => COLOR_CLASSNAMES.includes(m))
      if (parsed.length > 0) setActiveModes(parsed)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('key', selectedScale.replace('♭', 'b'))
    params.set('modes', activeModes.join(','))
    history.replaceState(null, '', '?' + params.toString())
  }, [selectedScale, activeModes])

  useEffect(() => {
    selectedScaleRef.current = selectedScale
    activeModesRef.current = activeModes
  }, [selectedScale, activeModes])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (isTextInput(e.target)) return

      const rawKey = e.key
      if (rawKey === ',') {
        sevenFlavourRef.current = 'flat7'
        setActiveFlavour('flat7')
        return
      }
      if (rawKey === '.') {
        sevenFlavourRef.current = 'maj7'
        setActiveFlavour('maj7')
        return
      }
      if (rawKey === 'k') {
        sevenFlavourRef.current = 'sus2'
        setActiveFlavour('sus2')
        return
      }
      if (rawKey === 'l') {
        sevenFlavourRef.current = 'sus4'
        setActiveFlavour('sus4')
        return
      }

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
          const flavour = sevenFlavourRef.current
          pressedChordsRef.current.set(chordName, flavour)
          setKeyboardPressedChords((prev) => [...prev, chordName])
          triggerAttackChord(chordName, flavour)
          return
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const rawKey = e.key
      if (rawKey === ',' || rawKey === '.' || rawKey === 'k' || rawKey === 'l') {
        sevenFlavourRef.current = undefined
        setActiveFlavour(undefined)
        return
      }

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
          const flavour = pressedChordsRef.current.get(chordName)
          pressedChordsRef.current.delete(chordName)
          setKeyboardPressedChords((prev) =>
            prev.filter((c) => c !== chordName)
          )
          triggerReleaseChord(chordName, flavour)
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      pressedChordsRef.current.forEach((flavour, chordName) =>
        triggerReleaseChord(chordName, flavour)
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

  const handleJoyrideEvent = useCallback((data: EventData) => {
    const { action, index, status, type } = data
    if (type === EVENTS.STEP_AFTER) {
      setTourStepIndex(index + 1)
    }
    if (status === STATUS.FINISHED || action === 'skip') {
      setTourRun(false)
      localStorage.setItem('musical-modes-tour-seen', 'true')
    }
  }, [])

  const restartTour = () => {
    setTourRun(true)
    setTourStepIndex(0)
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
                {(() => {
                  let activeRowCount = 0
                  return generateModes(selectedScale).map(
                    (mode: Mode, index: number) => (
                      <Fragment key={index}>
                        {isModeActive(mode.name) && (
                          <TableContent
                            mode={mode}
                            index={index}
                            activeRowIndex={activeRowCount++}
                            keyboardPressedChords={keyboardPressedChords}
                            activeFlavour={activeFlavour}
                          />
                        )}
                      </Fragment>
                    )
                  )
                })()}
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
          </a>{' '}
          |{' '}
          <span
            className='pointer noselect'
            onClick={restartTour}
            style={{ textDecoration: 'underline' }}
          >
            ?
          </span>
        </footer>
      </main>
      <Joyride
        steps={TOUR_STEPS}
        run={tourRun}
        stepIndex={tourStepIndex}
        continuous
        onEvent={handleJoyrideEvent}
        options={{
          overlayClickAction: false,
          buttons: ['back', 'close', 'primary', 'skip'],
          closeButtonAction: 'skip',
          primaryColor: '#4285f4',
          zIndex: 10000,
        }}
        locale={{
          next: 'Next',
          skip: 'Skip',
          last: 'Done',
        }}
      />
    </div>
  )
}

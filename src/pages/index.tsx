import { Fragment, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Head from 'next/head'
import { Joyride, Step, STATUS, EVENTS, EventData } from 'react-joyride'

import { generateModes } from '../utils'
import { KEYS, KEYS_SHARP, COLOR_CLASSNAMES, KEY_ROWS, PIANO_WHITE_KEYS, PIANO_BLACK_KEYS, CHROMATIC_ROW1, CHROMATIC_ROW2 } from '../utils/constants'
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
    content: 'Tap a note on the keyboard to set the root key. Every chord on the page updates to match.',
    skipBeacon: true,
  },
  {
    target: '.accidental-toggle',
    content: (
      <span>
        Switch between flat (<code>♭</code>) and sharp (<code>♯</code>) spelling for accidental notes — same sound, different notation.
      </span>
    ),
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
    content: (
      <span>
        Your keyboard maps to the chords too — <code>Q</code> through <code>U</code> for the top row, <code>A</code> through <code>J</code> for the second, <code>Z</code> through <code>M</code> for the third.
      </span>
    ),
  },
  {
    target: '#modifier-hint',
    content: (
      <span>
        Hold <code>,</code> or <code>.</code> for 7th chords; <code>k</code> or <code>l</code> for sus chords. You can press a modifier before or after a chord key — hold a chord and add the modifier to hear it transform instantly.
      </span>
    ),
  },
]

const MODIFIER_KEYS: Record<string, ChordFlavor> = { ',': 'flat7', '.': 'maj7', k: 'sus2', l: 'sus4' }

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
  const [preferSharp, setPreferSharp] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

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
  const preferSharpRef = useRef(preferSharp)

  useEffect(() => {
    setIsTouchDevice(!window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

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

    if (params.get('acc') === 'sharp') {
      setPreferSharp(true)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('key', selectedScale.replace('♭', 'b'))
    params.set('modes', activeModes.join(','))
    params.set('acc', preferSharp ? 'sharp' : 'flat')
    history.replaceState(null, '', '?' + params.toString())
  }, [selectedScale, activeModes, preferSharp])

  useEffect(() => {
    selectedScaleRef.current = selectedScale
    activeModesRef.current = activeModes
    preferSharpRef.current = preferSharp
  }, [selectedScale, activeModes, preferSharp])

  useEffect(() => {
    const getActiveModes = () =>
      generateModes(selectedScaleRef.current, preferSharpRef.current)
        .filter(m => activeModesRef.current.includes(m.name))

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (isTextInput(e.target)) return

      const rawKey = e.key
      const flavour = MODIFIER_KEYS[rawKey]
      if (flavour) {
        sevenFlavourRef.current = flavour
        setActiveFlavour(flavour)
        pressedChordsRef.current.forEach((oldFlavour, chordName) => {
          triggerReleaseChord(chordName, oldFlavour)
          triggerAttackChord(chordName, flavour)
          pressedChordsRef.current.set(chordName, flavour)
        })
        return
      }

      const key = e.key.toUpperCase()
      const activeModesData = getActiveModes()

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
      if (rawKey in MODIFIER_KEYS) {
        sevenFlavourRef.current = undefined
        setActiveFlavour(undefined)
        pressedChordsRef.current.forEach((oldFlavour, chordName) => {
          triggerReleaseChord(chordName, oldFlavour)
          triggerAttackChord(chordName, undefined)
          pressedChordsRef.current.set(chordName, undefined)
        })
        return
      }

      const key = e.key.toUpperCase()
      const activeModesData = getActiveModes()

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

  const toggleActiveMode = (modeName: string) =>
    setActiveModes(prev =>
      prev.includes(modeName) ? prev.filter(m => m !== modeName) : [...prev, modeName]
    )

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

  const visibleSteps = useMemo(() => {
    if (isTouchDevice) {
      return TOUR_STEPS.filter(s => s.target !== '#modifier-hint')
    }
    return TOUR_STEPS
  }, [isTouchDevice])

  return (
    <div>
      <Head>
        <title>Musical Modes</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main>
        <h1 className='title black'>Musical Modes</h1>
        <div className='key-selector-root'>
          <div className='key-selector-header'>
            <label>Root Key</label>
            <div className='accidental-toggle'>
              <button
                className={`acc-btn${!preferSharp ? ' active' : ''}`}
                onClick={() => setPreferSharp(false)}
                aria-pressed={!preferSharp}
              >
                ♭
              </button>
              <button
                className={`acc-btn${preferSharp ? ' active' : ''}`}
                onClick={() => setPreferSharp(true)}
                aria-pressed={preferSharp}
              >
                ♯
              </button>
            </div>
          </div>
          <div className='piano-keyboard' id='modes'>
            {PIANO_BLACK_KEYS.map(({ index, left }) => (
              <button
                key={index}
                className={`black-key${selectedScale === KEYS[index] ? ' selected' : ''} noselect`}
                style={{ left }}
                onClick={() => setSelectedScale(KEYS[index])}
                aria-pressed={selectedScale === KEYS[index]}
                aria-label={preferSharp ? KEYS_SHARP[index] : KEYS[index]}
              >
                {preferSharp ? KEYS_SHARP[index] : KEYS[index]}
              </button>
            ))}
            {PIANO_WHITE_KEYS.map(({ index, label }) => (
              <button
                key={index}
                className={`white-key${selectedScale === KEYS[index] ? ' selected' : ''} noselect`}
                onClick={() => setSelectedScale(KEYS[index])}
                aria-pressed={selectedScale === KEYS[index]}
                aria-label={label}
              >
                {label}
              </button>
            ))}
          </div>
          <div className='chromatic-grid'>
            {CHROMATIC_ROW1.map((keyIndex) => (
              <button
                key={`n-${keyIndex}`}
                className={`chromatic-grid-item natural${selectedScale === KEYS[keyIndex] ? ' selected' : ''} noselect`}
                onClick={() => setSelectedScale(KEYS[keyIndex])}
                aria-pressed={selectedScale === KEYS[keyIndex]}
                aria-label={KEYS[keyIndex]}
              >
                {KEYS[keyIndex]}
              </button>
            ))}
            {CHROMATIC_ROW2.map((keyIndex, col) => (
              <button
                key={`a-${col}`}
                className={`chromatic-grid-item accidental${keyIndex !== null && selectedScale === KEYS[keyIndex] ? ' selected' : ''} noselect`}
                onClick={() => { if (keyIndex !== null) setSelectedScale(KEYS[keyIndex]) }}
                aria-pressed={keyIndex !== null && selectedScale === KEYS[keyIndex]}
                aria-label={keyIndex !== null ? (preferSharp ? KEYS_SHARP[keyIndex] : KEYS[keyIndex]) : undefined}
                disabled={keyIndex === null}
                style={keyIndex === null ? { visibility: 'hidden' } : undefined}
              >
                {keyIndex !== null ? (preferSharp ? KEYS_SHARP[keyIndex] : KEYS[keyIndex]) : ''}
              </button>
            ))}
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
                  return generateModes(selectedScale, preferSharp).map(
                    (mode: Mode, index: number) => (
                      <Fragment key={index}>
                        {activeModes.includes(mode.name) && (
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
        <p id='modifier-hint' className='black' style={{ marginTop: '0.25rem' }}>
          Hold <code>,</code> &middot; <code>.</code> &middot; <code>k</code> &middot; <code>l</code> for 7th / sus chords
        </p>
        <p className='black' style={{ marginTop: '1rem' }}>
          Toggle modes
        </p>
        <div className='legends-wrapper'>
          {COLOR_CLASSNAMES.map((modeName: string, index: number) => (
            <div
              key={index}
              className={`bg-${
                activeModes.includes(modeName) ? `${modeName} white` : 'disabled'
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
        steps={visibleSteps}
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

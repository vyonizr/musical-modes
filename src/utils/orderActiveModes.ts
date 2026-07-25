import { Mode } from 'src/utils/types'

// The mode table and the keyboard engine must agree on row order, so both go
// through here. Row order is enable order: activeModes is appended to as the
// user turns modes on, and that order survives the URL round-trip. Unknown
// names (a stale ?modes= value) are dropped here and nowhere else.
const orderActiveModes = (modes: Mode[], activeModes: string[]): Mode[] =>
  activeModes
    .map((name) => modes.find((mode) => mode.name === name))
    .filter((mode): mode is Mode => mode !== undefined)

export default orderActiveModes

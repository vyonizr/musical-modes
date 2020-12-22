const withBasePath = (fileName: string): string => {
  return `/assets/audio/${fileName}`
}

const CHORD_C = withBasePath('c.ogg')
const CHORD_D_FLAT = withBasePath('d_flat.ogg')
const CHORD_D = withBasePath('d.ogg')
const CHORD_E_FLAT = withBasePath('e_flat.ogg')
const CHORD_E = withBasePath('e.ogg')
const CHORD_F = withBasePath('f.ogg')
const CHORD_G_FLAT = withBasePath('g_flat.ogg')
const CHORD_G = withBasePath('g.ogg')
const CHORD_A_FLAT = withBasePath('a_flat.ogg')
const CHORD_A = withBasePath('a.ogg')
const CHORD_B_FLAT = withBasePath('b_flat.ogg')
const CHORD_B = withBasePath('b.ogg')

const CHORD_C_MINOR = withBasePath('c_minor.ogg')
const CHORD_D_FLAT_MINOR = withBasePath('d_flat_minor.ogg')
const CHORD_D_MINOR = withBasePath('d_minor.ogg')
const CHORD_E_FLAT_MINOR = withBasePath('e_flat_minor.ogg')
const CHORD_E_MINOR = withBasePath('e_minor.ogg')
const CHORD_F_MINOR = withBasePath('f_minor.ogg')
const CHORD_G_FLAT_MINOR = withBasePath('g_flat_minor.ogg')
const CHORD_G_MINOR = withBasePath('g_minor.ogg')
const CHORD_A_FLAT_MINOR = withBasePath('a_flat_minor.ogg')
const CHORD_A_MINOR = withBasePath('a_minor.ogg')
const CHORD_B_FLAT_MINOR = withBasePath('b_flat_minor.ogg')
const CHORD_B_MINOR = withBasePath('b_minor.ogg')

const CHORD_C_DIM = withBasePath('c_dim.ogg')
const CHORD_D_FLAT_DIM = withBasePath('d_flat_dim.ogg')
const CHORD_D_DIM = withBasePath('d_dim.ogg')
const CHORD_E_FLAT_DIM = withBasePath('e_flat_dim.ogg')
const CHORD_E_DIM = withBasePath('e_dim.ogg')
const CHORD_F_DIM = withBasePath('f_dim.ogg')
const CHORD_G_FLAT_DIM = withBasePath('g_flat_dim.ogg')
const CHORD_G_DIM = withBasePath('g_dim.ogg')
const CHORD_A_FLAT_DIM = withBasePath('a_flat_dim.ogg')
const CHORD_A_DIM = withBasePath('a_dim.ogg')
const CHORD_B_FLAT_DIM = withBasePath('b_flat_dim.ogg')
const CHORD_B_DIM = withBasePath('b_dim.ogg')

const chordsSwitch = (chordName = 'C'): string => {
  switch (chordName) {
    case 'C':
      return CHORD_C
    case 'Cdim':
      return CHORD_C_DIM
    case 'Cm':
      return CHORD_C_MINOR
    case 'D♭':
      return CHORD_D_FLAT
    case 'C♯dim':
    case 'D♭dim':
      return CHORD_D_FLAT_DIM
    case 'D♭m':
      return CHORD_D_FLAT_MINOR
    case 'D':
      return CHORD_D
    case 'Ddim':
      return CHORD_D_DIM
    case 'Dm':
      return CHORD_D_MINOR
    case 'E♭':
      return CHORD_E_FLAT
    case 'D♯dim':
    case 'E♭dim':
      return CHORD_E_FLAT_DIM
    case 'E♭m':
      return CHORD_E_FLAT_MINOR
    case 'E':
      return CHORD_E
    case 'Edim':
      return CHORD_E_DIM
    case 'Em':
      return CHORD_E_MINOR
    case 'F':
      return CHORD_F
    case 'Fdim':
      return CHORD_F_DIM
    case 'Fm':
      return CHORD_F_MINOR
    case 'G♭':
      return CHORD_G_FLAT
    case 'F♯dim':
    case 'G♭dim':
      return CHORD_G_FLAT_DIM
    case 'G♭m':
      return CHORD_G_FLAT_MINOR
    case 'G':
      return CHORD_G
    case 'Gdim':
      return CHORD_G_DIM
    case 'Gm':
      return CHORD_G_MINOR
    case 'A♭':
      return CHORD_A_FLAT
    case 'G♯dim':
    case 'A♭dim':
      return CHORD_A_FLAT_DIM
    case 'A♭m':
      return CHORD_A_FLAT_MINOR
    case 'A':
      return CHORD_A
    case 'Adim':
      return CHORD_A_DIM
    case 'Am':
      return CHORD_A_MINOR
    case 'B♭':
      return CHORD_B_FLAT
    case 'A♯dim':
    case 'B♭dim':
      return CHORD_B_FLAT_DIM
    case 'B♭m':
      return CHORD_B_FLAT_MINOR
    case 'B':
      return CHORD_B
    case 'Bdim':
      return CHORD_B_DIM
    case 'Bm':
      return CHORD_B_MINOR
    default:
      return CHORD_C
  }
}

const playChord = (chordName = 'C'): void => {
  const audio = new Audio(chordsSwitch(chordName))
  audio.play()
}

export { playChord }

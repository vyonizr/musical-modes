import { AppProps } from 'next/app'

import '../styles/normalize.css'
import '../styles/globals.css'
import '../styles/modes.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp

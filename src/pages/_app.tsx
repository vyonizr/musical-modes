import { AppProps } from 'next/app'
import { SerwistProvider } from '@serwist/next/react'

import '../styles/normalize.css'
import '../styles/globals.css'
import '../styles/modes.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SerwistProvider swUrl="/sw.js">
      <Component {...pageProps} />
    </SerwistProvider>
  )
}

export default MyApp

import Document, {
  DocumentContext,
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_IMAGE,
} from '../utils/env'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)

    return { ...initialProps }
  }

  render() {
    return (
      <Html lang='en'>
        <Head>
          <meta charSet='utf-8' />
          <meta
            name='keywords'
            content='music theory mode scale scale key vyonizr'
          />
          <meta property='og:type' content='website' />
          <meta property='og:site_name' content={SITE_NAME} />
          <meta property='og:title' content={SITE_TITLE} />
          <meta property='og:description' content={SITE_DESCRIPTION} />
          <meta property='og:image' content={SITE_IMAGE} />
          <meta name='twitter:card' content={SITE_DESCRIPTION} />
          <meta name='twitter:site' content={SITE_NAME} />
          <meta name='twitter:title' content={SITE_TITLE} />
          <meta name='twitter:description' content={SITE_DESCRIPTION} />
          <meta property='twitter:image' content={SITE_IMAGE} />

          <link rel='preconnect' href='https://fonts.gstatic.com' />
          <link
            href='https://fonts.googleapis.com/css2?family=Quicksand:wght@400;700&display=swap'
            rel='stylesheet'
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument

import { Helmet } from 'react-helmet-async'
import { buildMeta, SITE_NAME } from '../../lib/seo'

export function Seo({ title, description, path = '' }) {
  const meta = buildMeta({ title, description, path })
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={meta.ogImage} />
      <link rel="canonical" href={meta.url} />
    </Helmet>
  )
}

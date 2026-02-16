import { ImageResponse } from 'next/og'
import { getMDXContent } from '../fetch'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug
  const allWritings = getMDXContent({ contentDir: 'content/writing' })
  const post = allWritings.find((post) => post.slug === slug)

  const title = post?.metadata.title ?? 'kyzo'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(145deg, #f8f8f8 0%, #ececec 50%, #e4e4e4 100%)',
          padding: '60px 80px',
        }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 300,
              color: '#171717',
              lineHeight: 1.2,
              textTransform: 'lowercase',
            }}>
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 300,
              color: '#a3a3a3',
              textTransform: 'lowercase',
            }}>
            kyzo.io
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}

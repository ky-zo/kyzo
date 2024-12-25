import { EmbeddedTweet, TweetNotFound, type TweetProps } from 'react-tweet'
import { getTweet as _getTweet } from 'react-tweet/api'

import './tweet.css'

import { unstable_cache } from 'next/cache'

const getTweet = unstable_cache(async (id: string) => _getTweet(id), ['tweet'], { revalidate: 3600 * 24 })

const TweetContent = async ({ id, components, onError }: TweetProps) => {
  let error
  const tweet = id
    ? await getTweet(id).catch((err) => {
        if (onError) {
          error = onError(err)
        } else {
          console.error(err)
          error = err
        }
      })
    : undefined

  if (!tweet) {
    const NotFound = components?.TweetNotFound || TweetNotFound
    return <NotFound error={error} />
  }

  return (
    <EmbeddedTweet
      tweet={tweet}
      components={components}
    />
  )
}

export const ReactTweet = (props: TweetProps) => <TweetContent {...props} />

export async function TweetComponent({ id }: { id: string }) {
  return (
    <div className="tweet light not-prose my-6 bg-white">
      <div className={`flex justify-center`}>
        <ReactTweet id={id} />
      </div>
    </div>
  )
}

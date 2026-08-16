/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['next-mdx-remote'],
  async redirects() {
    return [
      {
        source: '/random',
        destination: '/interactive',
        permanent: true,
      },
      {
        source: '/random/:path*',
        destination: '/interactive/:path*',
        permanent: true,
      },
      {
        source: '/interactive/x-followers',
        destination: '/interactive/graphs',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig

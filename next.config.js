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
    ]
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
    ],
  },
  // Increase body size limit so profile completions with image data aren't rejected
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/trailstorm',
        destination: '/trailstorm/2026-jaisalmer-trailstorm-event',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;

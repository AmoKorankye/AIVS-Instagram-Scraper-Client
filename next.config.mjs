/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Disable image optimization for Electron packaging
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

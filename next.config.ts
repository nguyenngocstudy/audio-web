/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      // Add your R2 custom domain if any
    ],
    // Allow data URLs for preview
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
};
module.exports = nextConfig;

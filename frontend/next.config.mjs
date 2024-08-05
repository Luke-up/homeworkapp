/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Set file watching to enable hot reloading in Docker
    // Not perfect, but it's all we have for now
    webpack(config, { dev }) {
      if (dev) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        };
      }
      return config;
    },
  };
  
  export default nextConfig;
  
/** @type {import('next').NextConfig} */
const withSvgr = require("next-plugin-svgr");

const nextConfig = withSvgr({
  reactStrictMode: false,
  poweredByHeader: false,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/antd/,
      use: {
        loader: "babel-loader",
        options: {
          presets: ["next/babel"],
        },
      },
    });
    return config;
  },
  experimental: {
    esmExternals: "loose",
  },
});

module.exports = nextConfig;

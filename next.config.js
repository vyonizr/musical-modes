const runtimeCaching = require('next-pwa/cache');
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching,
  buildExcludes: [/middleware-manifest.json$/],
  disable: process.env.NODE_ENV === 'development',
})

const plugins = []

plugins.push(withPWA)

const nextConfig = {}

module.exports = () => plugins.reduce((acc, next) => next(acc), nextConfig)
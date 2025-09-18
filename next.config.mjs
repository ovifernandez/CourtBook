/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Ayuda a detectar problemas en desarrollo
  swcMinify: true, // Usa el compilador SWC para minificación rápida

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=()" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-eval'; img-src 'self' data:;" },
        ],
      },
    ]
  },
}

export default nextConfig

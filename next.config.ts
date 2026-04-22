/** @type {import('next').NextConfig} */
// Define the CSP policy as a string for readability
// const cspHeader = `
//     default-src 'self';
//     script-src 'self' 'unsafe-eval' 'unsafe-inline';
//     style-src 'self' 'unsafe-inline';
//     img-src 'self' blob: data:;
//     font-src 'self';
//     object-src 'none';
//     base-uri 'self';
//     form-action 'self';
//     frame-ancestors 'none';
//     upgrade-insecure-requests;
// `

// const nextConfig = {
//   async headers() {
//     return [
//       {
//         // Apply these headers to all routes in your application
//         source: '/(.*)',
//         headers: [
//           {
//             key: 'Content-Security-Policy',
//             // Remove newlines from the CSP string for the header value
//             value: cspHeader.replace(/\n/g, ''),
//           },
//           {
//             key: 'Strict-Transport-Security',
//             // Forces HTTPS for 1 year (31536000 seconds) including subdomains
//             value: 'max-age=31536000; includeSubDomains; preload',
//           },
//           {
//             key: 'X-Frame-Options',
//             // Prevents your site from being embedded in an iframe (Anti-Clickjacking)
//             value: 'DENY',
//           },
//           {
//             key: 'X-Content-Type-Options',
//             // Prevents browsers from guessing (sniffing) the MIME type
//             value: 'nosniff',
//           },
//           {
//             key: 'Referrer-Policy',
//             // Only sends the full URL for same-origin requests
//             value: 'strict-origin-when-cross-origin',
//           },
//         ],
//       },
//     ]
//   },
// }

// export default nextConfig;

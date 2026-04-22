// import pino from 'pino';

// const isDevelopment = process.env.NODE_ENV === 'development';

// export const logger = pino({
//     level: process.env.LOG_LEVEL || 'info',
//     // In development, make logs readable. In production, use JSON for parsers.
//     transport: isDevelopment
//         ? {
//             target: 'pino-pretty',
//             options: { colorize: true },
//         }
//         : undefined,
//     // Standardize fields to avoid mixing 'userId' vs 'user_id'
//     base: {
//         env: process.env.NODE_ENV,
//         service: 'my-app',
//     },
// });
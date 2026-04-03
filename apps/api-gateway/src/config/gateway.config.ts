export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nats: {
    url: process.env.NATS_URL || 'nats://localhost:4222',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'srp-hrms-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
});

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port:           parseInt(process.env.PORT ?? '3001', 10),
  jwtSecret:      process.env.JWT_SECRET ?? 'dev_secret_CHANGE_before_deploying_to_prod_min32ch',
  jwtExpiresIn:   '8h',
  cookieName:     'egx_session',
  cookieMaxAgeMs: 8 * 60 * 60 * 1000,   // 8 h in ms
  bcryptRounds:   12,
  isProd:         process.env.NODE_ENV === 'production',
  corsOrigin:     process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  dataFile:       process.env.DATA_FILE  ?? './data/users.json',
};

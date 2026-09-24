export default () => {
  const environment = process.env.NODE_ENV || 'development';

  const configuredFrontendOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (environment === 'production' && configuredFrontendOrigins.length === 0) {
    throw new Error(
      'FRONTEND_URL es obligatorio en producción. Configura uno o más orígenes separados por coma.',
    );
  }

  const jwtSecret = process.env.JWT_SECRET ||
    (environment === 'production' ? '' : 'dev-only-change-this-secret');

  if (!jwtSecret) {
    throw new Error('JWT_SECRET es obligatorio en producción.');
  }

  const corsOrigins =
    environment === 'production'
      ? configuredFrontendOrigins
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          ...configuredFrontendOrigins,
        ];

  return {
    app: {
      name: 'Bootcamp API',
      version: '1.0.0',
      environment,
    },

    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      name: process.env.DB_NAME || 'bootcamp',
    },

    supabase: {
      url: process.env.SUPABASE_URL || '',
      key: process.env.SUPABASE_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },

    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },

    auth: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
      jwtSecret,
    },

    cors: {
      origin: corsOrigins,
    },

    api: {
      prefix: 'api',
      version: 'v1',
    },
  };
};

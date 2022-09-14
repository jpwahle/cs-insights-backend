import { APIOptions } from './interfaces';
import fs from 'fs';

/* istanbul ignore next */
function getSecret(path: string): string | undefined {
  try {
    const secret = fs.readFileSync(path, 'utf8');
    return secret;
  } catch (e) {
    console.warn(`Could not read secret from ${path}`);
  }
}

/* istanbul ignore next */
export const options: APIOptions = {
  // Environment
  environment: {
    version: 'VERSION',
    production: process.env.NODE_ENV === 'production',
  },

  // Authorization
  auth: {
    jwt: {
      secret:
        getSecret('/run/secrets/jwt_secret') ||
        process.env.JWT_SECRET ||
        'Never use this in production. Use JWT_SECRET environment variable.',
      maxAge: '4w',
    },
  },
  // User
  user: {
    default: {
      email: process.env.ADMIN_USER || 'admin@cs-insights.com',
      password: process.env.ADMIN_PASSWORD || 'admin',
      fullname: process.env.ADMIN_NAME || 'admin',
      isAdmin: true,
      isActive: true,
    },
  },

  // Swagger Autogen
  docs: {
    title: 'REST API Documentation for NLP-land-backend',
    oasFile: './docs/oas.json',
    swaggerUiServePath: '/docs/swagger-ui',
    redocUiServePath: '/docs/redoc',
  },

  // MongoDB connection
  database: {
    url: `mongodb://${getSecret('/run/secrets/mongo_user') || process.env.MONGO_USER}:${
      getSecret('/run/secrets/mongo_password') || process.env.MONGO_PASSWORD
    }@${process.env.MONGO_HOST}`,
    autoIndex: true,
    db: process.env.MONGO_DB || 'test',
  },

  // API server
  server: {
    port: 3000,
    jsonParserLimit: '50mb',
    prefix: '/api',
    version: `/v${process.env.npm_package_version?.split('.', 1)[0]}`,
    get baseRoute() {
      return this.prefix + this.version;
    },
    cacheTTL: 0,
  },
};

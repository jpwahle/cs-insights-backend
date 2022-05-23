import { APIOptions } from './interfaces';

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
        process.env.JWT_SECRET ||
        'Never use this in production. Use JWT_SECRET environment variable.',
      maxAge: '4w',
    },
  },
  // User
  user: {
    default: {
      email: process.env.ADMIN_USER || 'jpw@nlpland.com',
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
    swaggerUiServePath: 'docs/swagger-ui',
    redocUiServePath: '/docs/redoc',
  },

  // MongoDB connection
  database: {
    url: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}`,
    db: 'nlpland_schemas',
    autoIndex: true,
  },

  // API server
  server: {
    port: 3000,
    jsonParserLimit: '10mb',
    prefix: '/api',
    version: `/v${process.env.npm_package_version?.split('.', 1)[0]}`,
    get baseRoute() {
      return this.prefix + this.version;
    },
  },
};

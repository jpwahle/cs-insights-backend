export interface APIOptions {
  environment: {
    version: string;
    production: boolean;
  };
  auth: {
    jwt: {
      secret: string;
      maxAge: string;
    };
  };
  user: {
    default: {
      email: string;
      password: string;
      fullname: string;
      isAdmin: boolean;
      isActive: boolean;
    };
  };
  docs: {
    title: string;
    oasFile: string;
    swaggerUiServePath: string;
    redocUiServePath: string;
  };
  database: {
    url: string;
    db: string;
    autoIndex: boolean;
  };
  server: {
    port: number;
    jsonParserLimit: string;
    prefix: string;
    version: string;
    route: string;
  };
}

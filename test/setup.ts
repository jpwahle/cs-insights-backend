import { APIServer } from '../src/app/apiserver';
import { loadOptions } from '../src/config';
import { APIOptions } from '../src/config/interfaces';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { initServer } from '../src/app';

let mongod: MongoMemoryServer;
export let app: APIServer;

export async function initDb() {
  mongod = await MongoMemoryServer.create();
}

export async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}

export async function clearDatabase(dropDatabases: string[] = []) {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    if (dropDatabases.indexOf(key) !== -1) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

export async function initApi(): Promise<{
  app: APIServer;
  options: APIOptions;
}> {
  const options = await loadOptions('./test', 'options.js');
  options.database.url = mongod.getUri();

  if (app) {
    return { app, options };
  }

  options.server.port = 3002;
  app = await initServer(options);

  return { app, options };
}

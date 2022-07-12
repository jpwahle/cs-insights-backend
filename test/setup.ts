import { APIServer } from '../src/app/apiserver';
import { loadOptions } from '../src/config';
import { APIOptions } from '../src/config/interfaces';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { initServer } from '../src/app';

let mongod: MongoMemoryServer;
export let apiServer: APIServer;

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
  apiServer: APIServer;
  apiOptions: APIOptions;
}> {
  const apiOptions = await loadOptions('./test', 'options.js');
  apiOptions.database.url = mongod.getUri();

  if (apiServer) {
    return { apiServer, apiOptions };
  }

  apiOptions.server.port = 3002;
  apiServer = await initServer(apiOptions);

  return { apiServer, apiOptions };
}

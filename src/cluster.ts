import cluster from 'cluster';
import { initServer } from './app';
import { loadOptions } from './config';

const numCPUs = require('os').cpus().length;

if (cluster.isPrimary) {
  // fork workers
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  try {
    initServer(loadOptions());
  } catch (err) {
    console.log(err);
    process.exit(-1);
  }
}

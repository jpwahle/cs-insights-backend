import { initServer } from './app';
import { loadOptions } from './config';

(async () => {
  await initServer(await loadOptions());
})();

import * as Setup from './setup';
import 'mocha';

before(() => {
  console.log('BEFORE ALL TESTS STARTED');
  return new Promise<void>((resolve) => {
    Setup.initApi().then(() => {
      setTimeout(() => {
        resolve();
      }, 200);
    });
  });
});

after(async () => {
  await Setup.clearDatabase();
  await Setup.closeDatabase();
});

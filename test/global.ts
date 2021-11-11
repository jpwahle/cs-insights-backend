import * as Setup from './setup';

after(async () => {
  await Setup.clearDatabase();
  await Setup.closeDatabase();
});

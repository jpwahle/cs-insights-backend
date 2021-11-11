process.env.NODE_ENV = 'test';

import 'mocha';
import { expect } from 'chai';
import { loadOptions } from '../../src/config';
import { options } from '../../src/config/default';
const lodash = require('lodash');

describe('config', () => {
  specify('User config available', async () => {
    const config = await loadOptions('./test', 'options.js');

    expect(config).to.deep.equal(
      lodash.merge({}, options, {
        database: {
          db: 'test',
        },
      })
    );
  });

  specify('User config not available', async () => {
    const config = await loadOptions('/does/not/exist', 'options.js');
    expect(config).to.deep.equal(options);
  });

  specify('Undefined args', async () => {
    const config = await loadOptions(undefined, undefined);
    expect(config).to.deep.equal(options);
  });
});

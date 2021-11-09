import lodash from 'lodash';
import fs from 'fs';
import path from 'path';
import { options as defaultOptions } from './default';
import { APIOptions } from './interfaces';

export function loadOptions(
  baseDir: string = '/etc/nlpland/config',
  configPath: string = 'nlpland.js'
): APIOptions {
  let options: APIOptions = defaultOptions;

  // construct user config path
  const userConfigPath = path.resolve(baseDir, configPath);

  try {
    // load user configuration from file
    const userOptions: APIOptions = require(userConfigPath);
    options = lodash.merge({}, defaultOptions, userOptions);
  } catch (err) {
    if (fs.existsSync(path.join(baseDir, configPath))) {
      // create user config path first
      try {
        fs.mkdirSync(baseDir);
      } catch (_) {}
      try {
        fs.mkdirSync(path.join(baseDir, path.dirname(configPath)));
      } catch (_) {}
    }
  }
  return options;
}

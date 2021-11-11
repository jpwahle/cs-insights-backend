import lodash from 'lodash';
import path from 'path';
import { options as defaultOptions } from './default';
import { APIOptions } from './interfaces';

export async function loadOptions(
  baseDir: string = '/etc/nlpland/config',
  configPath: string = 'nlpland.js'
): Promise<APIOptions> {
  let options: APIOptions = defaultOptions;

  // construct user config path
  const userConfigPath = path.resolve(baseDir, configPath);

  try {
    // load user configuration from file
    const userOptions: APIOptions = require(userConfigPath);
    options = lodash.merge({}, defaultOptions, userOptions);
  } catch (err) {
    return options;
  }
  return options;
}

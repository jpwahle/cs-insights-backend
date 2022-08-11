import path from 'path';
import { options as defaultOptions } from './default';
import { APIOptions } from './interfaces';
const lodash = require('lodash');

export async function loadOptions(
  baseDir: string = '/etc/cs-insights-crawler/config',
  configPath: string = 'cs-insights-crawler.js'
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

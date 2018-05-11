var conf = require('config');
import dg from 'debug';

const debug = dg('deql.options');

//import conf from "config";
/* Изменить путь до нужного проекта */
debug('deql.projectName ', conf.projectName);
const projectName = process.env['projectName'] || conf.projectName;
console.log('PROJECT NAME: ', projectName);
var project = require('project_server/index.js').default;
const { modules, projectOptions, dependencies } = project;

function getKeyOptions(v, ret, suf = '', options) {
  const suffix = suf ? suf + '_' : '';
  Object.keys(v).forEach(key => {
    if (typeof v[key] === 'object') {
      ret[key] = {};
      if (options && options.hasOwnProperty(key)) {
        getKeyOptions(v[key], ret[key], suffix + key, options[key]);
      }
    } else {
      if (v[key] !== undefined) {
        debug('v', key, v[key]);
        ret[key] = v[key];
      }
      if (options && options[key] !== undefined) {
        debug('options', key, options[key]);
        ret[key] = options[key];
      }
      if (process.env[suffix + key] !== undefined) {
        debug('process', key, process.env[suffix + key]);
        ret[key] = process.env[suffix + key];
      }
      debug('ret', key, ret[key]);
      if (ret[key] === 'true') {
        ret[key] = true;
      }
      if (ret[key] === 'false') {
        ret[key] = false;
      }
    }
  });
}

function reduceConfig(options = {}) {
  const ret = {};

  Object.keys(conf).forEach(key => {
    const v = conf.get(key);
    if (typeof v === 'object') {
      ret[key] = {};
      // debug('getKeyOptions', v, ret[key], key, options[key]);
      getKeyOptions(v, ret[key], key, options[key]);
    } else {
      ret[key] = process.env[key] || options[key] || v;

      if (ret[key] === 'true') {
        ret[key] = true;
      }
      if (ret[key] === 'false') {
        ret[key] = false;
      }
    }
  });
  if (ret.hasOwnProperty('DEBUG_MODULES')) {
    const modules = ret['DEBUG_MODULES'].replace(/ /g, '');
    ret.debugModules = modules.split(',');
  }

  return ret;
}

const config = reduceConfig(projectOptions);
const options = {
  config,
  modules,
  dependencies,
};

debug('options.config', config);
export default options;

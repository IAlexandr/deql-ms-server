import { promiseObjectsWaterfall } from './utils';

export function initDbModels({ sequelize, syncForce, modules }) {
  let hasDbModules = false;
  const promises = Object.keys(modules).reduce((v, n) => {
    if (modules[n] && modules[n].hasOwnProperty('dbmodels')) {
      v[n] = () => modules[n].dbmodels(sequelize, syncForce);
      hasDbModules = true;
    }
    return v;
  }, {});
  if (!hasDbModules) {
    return Promise.resolve();
  }
  return promiseObjectsWaterfall(promises);
}

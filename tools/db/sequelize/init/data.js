import { promiseWaterfall, configDbSeed } from './utils';
import logger from './../../../logger';

const { debug } = logger('db.sequelize.init.data', false);

export default function(modulesProps) {
  const dbSeedsFuncs = Object.keys(modulesProps)
    .sort((a, b) => {
      if (!modulesProps[a].hasOwnProperty('orderWeight')) {
        return -1;
      }
      if (modulesProps[a].orderWeight > modulesProps[b].orderWeight)
        return 1;
      if (modulesProps[a].orderWeight < modulesProps[b].orderWeight)
        return -1;
      return 0;
    })
    .reduce((v, n) => {
      if (modulesProps[n].hasOwnProperty('dbseedSchema')) {
        debug(`[${n}] dbseed schema prepared.`);
        if (modulesProps[n].dbseedSchema.length < 1) {
          debug(`[${n}] has empty dbseedSchema.`);
        }
        v.push(() => configDbSeed(modulesProps[n].dbseedSchema));
      }
      return v;
    }, []);
  return promiseWaterfall(dbSeedsFuncs);
}

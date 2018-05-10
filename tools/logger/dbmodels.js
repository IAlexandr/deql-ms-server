import Sequelize from 'sequelize';
import dbseedSchema from './dbseed-schema';

const localSyncForce = false;
const isNeedDbSeed = true;
const dbSeedOrderWeight = 1000;

export default function(sequelize, syncForce) {
  sequelize.Log = sequelize.define('Log', {
    key: {
      type: Sequelize.STRING,
    },
    props: {
      type: Sequelize.JSON,
    },
    message: {
      type: Sequelize.JSON,
    },
    type: {
      type: Sequelize.STRING,
    },
    time: {
      type: Sequelize.FLOAT,
    },
  });

  return sequelize
    .syncModels({
      models: [sequelize.Log],
      force: syncForce || localSyncForce,
    })
    .then(() => {
      let schema = [];
      if (isNeedDbSeed) {
        schema = dbseedSchema;
      }

      return Promise.resolve({
        dbseedSchema: schema,
        orderWeight: dbSeedOrderWeight,
      });
    });
}

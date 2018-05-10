import Sequelize from 'sequelize';
const dbseedSchema = [];

const localSyncForce = false;
const isNeedDbSeed = false;
const dbSeedOrderWeight = 1;

export default function(sequelize, syncForce) {
  sequelize.ReqSession = sequelize.define('ReqSession', {
    sid: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    userId: Sequelize.STRING,
    expires: Sequelize.DATE,
    data: Sequelize.STRING(50000),
  });

  return sequelize
    .syncModels({
      models: [sequelize.ReqSession],
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

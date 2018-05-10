import logger from './../../tools/logger';
const { debug } = logger('logger.dbseed-schema', false);

function createLogs() {
  let arr = [
    {
      body: {
        key: 'test key',
        props: {
          type: 'Sequelize.JSON',
        },
        message: {
          type: 'Sequelize.JSON',
        },
        type: 'test type',
      },
    },
  ];
  return arr;
}

const logs = {
  modelName: 'Log',
  docs: createLogs(),
};

export default [logs];

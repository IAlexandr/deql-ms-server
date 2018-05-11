import Sequelize from 'sequelize';
import { initDbModels } from './init/models';
import initialData from './init/data';
import { syncModels } from './init/utils';
import { sync as syncSchemaRules } from 'tools/graphql/schema-rules';
import logger from './../../logger';
const pg = require('pg');

const { debug, errDebug, time } = logger('db.sequelize');

export let db;

function checkConnection(dbConf, callback) {
  const config = {
    user: dbConf.username, //env var: PGUSER
    database: 'postgres', //env var: PGDATABASE
    password: dbConf.password, //env var: PGPASSWORD
    host: dbConf.options.host, // Server hosting the postgres database
    port: dbConf.options.port, //env var: PGPORT
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  };
  const connected = time('checkConnection');
  const Client = new pg.Client(config);
  Client.connect(err => {
    if (err) {
      errDebug('connect', err.message);
      connected('=> done with err', err.message);
      Client.end();
      return callback(err);
    }
    connected('=> ok.');
    Client.query('CREATE DATABASE ' + dbConf.dbName, function(err) {
      if (err && err.code !== '42P04') {
        errDebug('Client.query CREATE DATABASE', err);
        Client.end();
        return callback(err);
      }
      Client.end();
      return callback();
    });
  });
}

export const init = function({ dbConfig, NODE_ENV, modules }) {
  return new Promise((resolve, reject) => {
    /*eslint no-unused-vars: 1*/
    let {
      dbName,
      username,
      password,
      options,
      syncForce,
      accessDbSeed,
      accessSyncForce,
    } = dbConfig;
    options.operatorsAliases = false;
    db = new Sequelize(dbName, username, password, options);
    /* adding operators to db object */
    db.Op = Sequelize.Op;
    checkConnection(dbConfig, err => {
      if (err) {
        return reject(err);
      }
      db
        .authenticate()
        .then(() => {
          debug(`db '${dbName}' authenticated.`);
          debug('NODE_ENV >>>', NODE_ENV);
          if (NODE_ENV === 'production') {
            syncForce = false;
            accessDbSeed = false;
            accessSyncForce = false;
          }
          db.syncModels = syncModels;
          initDbModels({ sequelize: db, syncForce, modules })
            .then(modulesProps => {
              debug('dbmodels initialized');
              if (accessDbSeed && modulesProps) {
                const initialDataTime = time('initialData');
                initialData(modulesProps)
                  .then(() => {
                    initialDataTime('done.');
                    // Синхронизация правил с бд.
                    // syncSchemaRules({ db, modules }).then(() => {
                    //   debug('syncSchemaRules done.');
                    //   return resolve(db);
                    // });
                    return resolve(db);
                  })
                  .catch(err => {
                    initialDataTime('done with err.', err.message);
                    return reject(err);
                  });
              } else {
                return resolve(db);
              }
            })
            .catch(err => {
              errDebug('initDbModeles', err.message);
              return reject(err);
            });
        })
        .catch(err => {
          errDebug('db authenticate', err.message);
          return reject(err);
        });
    });
  });
};

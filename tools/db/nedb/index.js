import Datastore from 'nedb';
import path from 'path';
import logger from 'tools/logger';
import options from 'tools/options';
const { debug, time } = logger('tools.nedb');

var baseDbPath = path.join(process.cwd(), 'nedb-collections');
var AUTO_COMPACTION_INTERVAL = 120 * 1000; // мс

export let db = {};

export const init = ({ modules }) =>
  new Promise((resolve, reject) => {
    Object.keys(modules).forEach(n => {
      if (modules[n] && modules[n].hasOwnProperty('nedb')) {
        if (modules[n].nedb.hasOwnProperty('dbmodels')) {
          Object.keys(modules[n].nedb.dbmodels).forEach(function(
            collection
          ) {
            db[collection] = new Datastore({
              filename: path.join(baseDbPath, collection),
              autoload: true,
            });
            db[collection].persistence.setAutocompactionInterval(
              AUTO_COMPACTION_INTERVAL
            );
          });
        }
        if (
          options.config.NODE_ENV !== 'production' &&
          modules[n].nedb.hasOwnProperty('dbseed')
        ) {
          // TODO globalSyncForce
          modules[n].nedb.dbseed(db).then(() => {
            return resolve(db);
          });
        } else {
          return resolve(db);
        }
      }
    });
  });

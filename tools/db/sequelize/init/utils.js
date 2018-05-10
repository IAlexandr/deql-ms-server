import { db } from './../index';
import options from './../../../options';
import 'isomorphic-fetch';
import logger from './../../../logger';
const { debug, errDebug } = logger('db.sequelize.utils', false);

export function getJsonByUrl(url) {
  return fetch(url).then(response => {
    if (response.status >= 400) {
      throw new Error(`Bad response. url: ${url}`);
    }
    return response.json();
  });
}

function wtflw(models, i = 0, results = []) {
  debug('wtflw', `funcName ${models[i].funcName}`, models[i].props);
  return models[i].model[models[i].funcName](models[i].props)
    .then(res => {
      results.push(res);
      i++;
      if (i < models.length) {
        return wtflw(models, i, results);
      }
      return results;
    })
    .catch(errDebug);
}

function getParentDoc({ modelName, where }) {
  return db[modelName].findOne({ where }).then(doc => {
    if (!doc) {
      throw new Error(
        `Документ в бд не найден. (Свойства поиска: ${JSON.stringify(
          modelName
        )}, ${JSON.stringify(where)})`
      );
    }
    return doc;
  });
}

function addTo({ newDoc, toModelName, modelName, where }) {
  return getParentDoc({ modelName, where }).then(parentDoc => {
    return parentDoc[`add${toModelName}`](newDoc).then(() => {
      return newDoc;
    });
  });
}

function addDoc({ modelName, docProps }) {
  return db[modelName].create(docProps.body).then(newDoc => {
    if (docProps.hasOwnProperty('addTo')) {
      switch (Object.prototype.toString.call(docProps.addTo)) {
      case '[object Array]': {
        const props = docProps.addTo.map(addToConf => {
          return {
            model: { addTo },
            funcName: 'addTo',
            props: {
              newDoc,
              toModelName: modelName,
              modelName: addToConf.modelName,
              where: addToConf.where,
            },
          };
        });
        return wtflw(props).then(res => {
          return res;
        });
      }
      case '[object Object]':
        return addTo({
          newDoc,
          toModelName: modelName,
          modelName: docProps.addTo.modelName,
          where: docProps.addTo.where,
        });
        // return getParentDoc({ modelName: docProps.addTo.modelName, where: docProps.addTo.where })
        //   .then(parentDoc => {
        //     return parentDoc[`add${modelName}`](newDoc)
        //       .then(() => {
        //         return newDoc;
        //       });
        //   });
      }
    } else {
      return newDoc;
    }
  });
}

function addDocs({ modelName, docsProps }) {
  const props = docsProps.map(docProps => {
    return {
      model: { addDoc },
      funcName: 'addDoc',
      props: { modelName, docProps },
    };
  });
  return wtflw(props).then(res => {
    return res;
  });
}

export function configDbSeed(config) {
  const props = config.map(conf => {
    return {
      model: { addDocs },
      funcName: 'addDocs',
      props: { modelName: conf.modelName, docsProps: conf.docs },
    };
  });
  if (props.length < 1) {
    debug('config is empty');
    return Promise.resolve();
  }
  return wtflw(props).then(res => {
    return res;
  });
}

export function syncModels({ models, force }) {
  if (!options.config.sequelize.accessSyncForce) {
    force = false;
  }
  models = models.map(model => ({
    model,
    funcName: 'sync',
    props: { force, cascade: true },
  }));
  return wtflw(models).then(res => {
    return res;
  });
}

export function promiseObjectsWaterfall(promises) {
  function run(promiseKeys, results) {
    return promises[promiseKeys[0]]().then(result => {
      results[promiseKeys[0]] = result;
      if (promiseKeys.length > 1) {
        promiseKeys = promiseKeys.splice(1);
        return run(promiseKeys, results);
      }
      return results;
    });
  }

  return new Promise((resolve, reject) => {
    const results = {};
    run(Object.keys(promises), results)
      .then(results => {
        return resolve(results);
      })
      .catch(reject);
  });
}

export function promiseWaterfall(promises) {
  function run(promises, results) {
    return new Promise((resolve, reject) => {
      const func = promises[0];
      func().then(result => {
        results[0] = result;
        if (promises.length > 1) {
          promises = promises.splice(1);
          return run(promises, results)
            .then(resolve)
            .catch(reject);
        }
        return resolve(results);
      });
    });
  }

  return new Promise((resolve, reject) => {
    const results = [];
    run(promises, results)
      .then(results => {
        return resolve(results);
      })
      .catch(reject);
  });
}

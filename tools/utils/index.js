import dg from 'debug';
const debug = dg('deql.*.tools.utils');

export function assign(obj2, obj1) {
  const result = Object.keys(obj1).reduce((p, v) => {
    if (
      p.hasOwnProperty(v) &&
      typeof p[v] === 'object' &&
      !Array.isArray(p[v])
    ) {
      debug(
        `duplicate (object) key '${v}, merging.'`,
        '\n p[v]:',
        p[v],
        '\nobj1[v]',
        obj1[v]
      );
      p[v] = assign(obj1[v], p[v]);
    } else if (p.hasOwnProperty(v) && Array.isArray(p[v])) {
      debug(
        `duplicate (array) key '${v}, merging.'`,
        '\n p[v]:',
        p[v],
        '\nobj1[v]',
        obj1[v]
      );
      p[v] = [...new Set([...p[v], ...obj1[v]])];
    } else {
      p[v] = obj1[v];
    }
    return p;
  }, obj2);
  return result;
}

export function promiseWaterfall(promises) {
  function run(promises, results) {
    return new Promise((resolve, reject) => {
      const func = promises[0];
      func().then(result => {
        results = results.concat(result);
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

/**
 *
 *
 * @export
 * @param {any} input
 * @param {any} spacing
 * @returns
 */
export function splitArray(input, spacing) {
  var output = [];
  for (var i = 0; i < input.length; i += spacing)
    output[output.length] = input.slice(i, i + spacing);
  return output;
}
/**
 *
 *
 * @export
 * @param {string} ns
 * @param {any} obj
 * @returns
 */
export function valBy(ns, obj) {
  const levels = ns.split('.');
  const first = levels.shift();
  if (typeof obj[first] === 'undefined') {
    return undefined;
  }
  if (levels.length) {
    return valBy(levels.join('.'), obj[first]);
  }
  return obj[first];
}
/**
 *
 *
 * @export
 * @param {string} path
 * @param {object} obj
 * @param {any} value
 * @returns
 */
export function setBy(path, obj, value) {
  const pList = path.split('.');
  const key = pList.pop();
  const pointer = pList.reduce((accumulator, currentValue) => {
    if (accumulator[currentValue] === undefined)
      accumulator[currentValue] = {};
    return accumulator[currentValue];
  }, obj);
  pointer[key] = value;
  return obj;
}

/**
 *
 *
 * @export
 * @param {any} o1
 * @param {any} o2
 * @param {any} fieldsSchema
 * @returns
 */
export function mergeObjectsBySchema(o1, o2, fieldsSchema) {
  Object.keys(fieldsSchema).forEach(targetFieldPath => {
    const sourceFieldPath = fieldsSchema[targetFieldPath];
    setBy(targetFieldPath, o1, valBy(sourceFieldPath, o2));
  });
  return o1;
}

import { assign } from 'tools/utils';
import projectSchemaRules from 'server/schema-rules';

import dg from 'debug';
const debug = dg('deql.*.graphql.schema-rules.rules');

const deqlRules = {
  manage: {
    rUser: {
      // name: "read user info", если name НЕ указан, берется наименование ключа rUser.
      displayName: 'Просмотр пользователя',
    },
  },
  ui: {
    viewTest: {
      displayName: 'Просмотр чего нибудь 2',
      defaultRoles: ['mSomething'],
    },
  },
};

export const allRules = assign(projectSchemaRules, deqlRules);

/**
 *
 * @param {String} ruleName
 */
export const getRule = function(moduleName, withQuotes = true) {
  if (!allRules.hasOwnProperty(moduleName)) {
    debug(`[schema-rules] MODULE NAME '${moduleName}' NOT FOUND!`);
    return () => {};
  }
  return ruleName => {
    if (!allRules[moduleName].hasOwnProperty(ruleName)) {
      debug(`[schema-rules] RULE '${ruleName}' NOT FOUND!`);
      return null;
    }
    if (allRules[moduleName][ruleName].hasOwnProperty('name')) {
      return `"${moduleName}:${allRules[moduleName][ruleName].name}"`;
    }
    let r = `${moduleName}:${ruleName}`;
    if (withQuotes) {
      r = `"${r}"`;
    }

    debug('r', r);
    return r;
  };
};

export const getModuleRules = function(moduleName) {
  if (!allRules.hasOwnProperty(moduleName)) {
    debug(`[schema-rules] schema not defined. (for module '${moduleName}')`);
    return [];
  }
  const gRule = getRule(moduleName, false);
  return Object.keys(allRules[moduleName]).reduce((p, ruleName) => {
    const rule = Object.assign({}, allRules[moduleName][ruleName]);
    rule.name = gRule(ruleName);
    p.push(rule);
    return p;
  }, []);
};

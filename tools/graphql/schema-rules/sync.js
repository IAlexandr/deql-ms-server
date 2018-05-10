import { allRules, getModuleRules } from './rules';
import { promiseWaterfall } from 'tools/utils';
import dg from 'debug';
const debug = dg('deql.*.graphql.schema-rules.sync');

const requiredModules = ['ui'];

export default ({ db, modules }) => {
  const resRules = Object.keys(allRules).reduce((p, moduleName) => {
    if (
      modules.hasOwnProperty(moduleName) ||
      requiredModules.includes(moduleName)
    ) {
      const rules = getModuleRules(moduleName);
      if (rules.length) {
        p = p.concat(rules);
      }
    }
    return p;
  }, []);
  return sync(db, resRules);
};

function sync(db, rules) {
  debug('sync');
  const roles = rules.reduce((p, rule) => {
    if (rule.hasOwnProperty('defaultRoles')) {
      p = [...new Set([...p, ...rule.defaultRoles])];
    }
    return p;
  }, []);
  debug('roles', roles);
  const rolePromises = getRolePromises(roles);
  function getRolePromises(roles) {
    debug('getRolePromises', roles);
    return roles.map(name => {
      return () =>
        new Promise(resovle => {
          db.Role.findOne({ where: { name } }).then(roleDoc => {
            if (roleDoc) {
              return resovle(roleDoc);
            }
            db.Role.create({
              name,
            }).then(doc => {
              return resovle(doc);
            });
          });
        });
    });
  }

  const rulePromises = rules.map(rule => {
    return () =>
      new Promise(resolve => {
        debug('rulePromises');
        db.Rule.findOne({ where: { name: rule.name } }).then(ruleDoc => {
          if (ruleDoc) {
            return resolve(ruleDoc);
          }
          db.Rule.create({
            name: rule.name,
            props: {
              displayName: rule.displayName,
            },
          }).then(doc => {
            if (rule.hasOwnProperty('defaultRoles')) {
              const promises = getRolePromises(rule.defaultRoles);
              promiseWaterfall(promises).then(roleDocs => {
                // debug('roleDocs', roleDocs);
                const roleIds = roleDocs.map(role => role.id);
                doc.addRoles(roleIds).then(resolve);
              });
            } else {
              return resolve(doc);
            }
          });
        });
      });
  });

  return promiseWaterfall(rolePromises).then(() =>
    promiseWaterfall(rulePromises)
  );
}

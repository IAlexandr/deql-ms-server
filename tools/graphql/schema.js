import {
  makeExecutableSchema,
  mergeSchemas,
  addMockFunctionsToSchema,
} from 'graphql-tools';
import pubsub from './pubsub';
import options from './../options';
import logger from './../logger';
const { time, debug } = logger('tools.graphql.schema', true);

const { modules } = options;

const moduleSchemas = () => {
  debug('preparing schemas..');
  // пользуемся directives пока не приняли pullRequest https://github.com/apollographql/graphql-tools/pull/682
  const directives = Object.keys(modules).reduce((p, moduleName) => {
    const m = modules[moduleName];
    if (
      m.hasOwnProperty('graphql') &&
      m.graphql.hasOwnProperty('directives')
    ) {
      if (!p) {
        p = {};
      }
      return Object.assign(p, m.graphql.directives);
    }
    return p;
  }, null);

  return Object.keys(modules).reduce(
    (p, moduleName) => {
      const m = modules[moduleName];
      if (m.hasOwnProperty('graphql')) {
        const {
          typeDefs,
          resolvers,
          // directives, использовать после принятия pullRequest'а https://github.com/apollographql/graphql-tools/pull/682
          schemaStitching,
        } = m.graphql;
        if (
          typeDefs &&
          typeDefs.hasOwnProperty('schema') &&
          resolvers &&
          typeof resolvers === 'function'
        ) {
          debug(`module '${moduleName}' has graphql schema`);
          // debug(`module '${moduleName}' typeDefs:`, typeDefs);

          const exSchema = {
            typeDefs: typeDefs.schema,
            resolvers: resolvers(pubsub),
          };

          if (directives) {
            exSchema.schemaDirectives = directives;
          }

          const schema = makeExecutableSchema(exSchema);
          // addMockFunctionsToSchema({ schema });
          p.schemas.push(schema);
          if (
            schemaStitching &&
            schemaStitching.hasOwnProperty('linkSchemaDefs') &&
            schemaStitching.hasOwnProperty('resolvers')
          ) {
            debug(`module '${moduleName}' has schemaStitching`);
            const { linkSchemaDefs, resolvers } = schemaStitching;
            p.schemas.push(linkSchemaDefs);
            p.resolvers.push(resolvers);
          }
          if (
            typeDefs.hasOwnProperty('links') &&
            Array.isArray(typeDefs.links) &&
            typeDefs.links.length
          ) {
            p.links.concat(typeDefs.links);
          }
        }
      }

      return p;
    },
    { schemas: [], links: [], resolvers: [] }
  );
};

export default function() {
  const { schemas, links, resolvers } = moduleSchemas();
  return mergeSchemas({
    schemas,
    links,
    resolvers: mergeInfo => {
      const pp = resolvers.reduce((p, v) => {
        const vResolvers = v(mergeInfo);
        // debug('vResolvers', vResolvers);
        Object.keys(vResolvers).forEach(vResolverKey => {
          if (p.hasOwnProperty(vResolverKey)) {
            //debug('vResolverKey', vResolverKey);
            p[vResolverKey] = Object.assign(
              p[vResolverKey],
              vResolvers[vResolverKey]
            );
          } else {
            p[vResolverKey] = vResolvers[vResolverKey];
          }
        });
        return p;
      }, {});
      //debug('pp', pp);
      return pp;
    },
  });
}

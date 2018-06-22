import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { graphqlExpress } from 'graphql-server-express';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import logger from './tools/logger';
const { debug, errDebug, time } = logger('server');
import expressPlayground from 'graphql-playground-middleware-express';
import cookieParser from 'cookie-parser';
import schemaMerge from './tools/graphql/schema';
import routes from './tools/routes';
import { express as middleware } from 'graphql-voyager/middleware';
import path from 'path';
import options from './tools/options';
import compressStaticFiles from './tools/compressStaticFiles/index';
import { ApolloEngine } from 'apollo-engine';
import compression from 'compression';
const { config, modules, dependencies } = options;
debug('initializing');
const initialized = time('initializing');

const PORT = config.port;
const app = express();

compressStaticFiles(app);
app.use('*', cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, './../client_build')));
app.use('/static/', express.static(path.resolve(__dirname, './../static')));

dependencies({ app }).then(context => {
  // todo убрать context db
  const { db } = context;
  routes(app);
  const schema = schemaMerge();
  app.use('/voyager', middleware({ endpointUrl: '/graphql' }));
  app.use(compression());
  app.use('/graphql', bodyParser.json(), (req, res, next) => {
    // debug('req.session.id:', req.session.id);
    return graphqlExpress({
      schema,
      context: Object.assign({ session: req.session }, context), //{ req, res }
      tracing: true,
      cacheControl: true,
    })(req, res, next);
  });
  if (config.NODE_ENV !== 'production' || config.playgroundEnable) {
    app.get(
      '/playground',
      expressPlayground({
        endpoint: '/graphql',
        subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
      })
    );
  }
  app.use((req, res, next) => {
    debug('!!!!!not resolved url:', req.url);
    return next();
  });

  const serverListening = () => {
    initialized('done.');
    console.log(`GraphQL Server is now running on http://localhost:${PORT}`);
    const ss = new SubscriptionServer(
      {
        execute,
        subscribe,
        schema,
        onConnect: (connectionParams, webSocket) => {
          // subscription allowed, check access restriction occurs in the resolvers
          return {};
        },
      },
      {
        server: ws,
        path: '/subscriptions',
      }
    );
  };

  const ws = http.Server(app);
  if (
    config.hasOwnProperty('graphql') &&
    config.graphql.hasOwnProperty('engineApiKey') &&
    config.graphql.useEngine
  ) {
    console.log('using ApolloEngine.');
    const engine = new ApolloEngine({
      apiKey: config.graphql.engineApiKey,
    });
    engine.listen(
      {
        port: PORT,
        httpServer: ws,
      },
      serverListening
    );
  } else {
    ws.listen(PORT, serverListening);
  }
});

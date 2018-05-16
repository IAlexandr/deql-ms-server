import session from 'express-session';
const RedisStore = require('connect-redis')(session);
import logger from 'tools/logger';
import options from 'tools/options';
var expressSessionGlobal;
const { debug, time } = logger('redis.express-session');

export default function(app) {
  const done = time('initializing..');
  const sessionStore = new RedisStore({
    password: options.config.redis.password,
    host: options.config.redis.host,
    port: options.config.redis.port,
    ttl: 7 * 24 * 60 * 60,
  });
  const expressSession = session({
    secret: 'deql',
    // cookie.maxAge in milliseconds
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
  });
  expressSessionGlobal = expressSession;
  app.use(expressSession);
  done('done.');
  return expressSession;
}

export function getSessionStore() {
  return expressSessionGlobal;
}

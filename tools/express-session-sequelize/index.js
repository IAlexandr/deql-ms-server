import session from 'express-session';
import sessionSequelize from 'connect-session-sequelize';
const SequelizeStore = sessionSequelize(session.Store);
var expressSessionGlobal;

export default function(app, db) {
  const sessionStore = new SequelizeStore({
    db,
    table: 'ReqSession',
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 7 * 24 * 60 * 60 * 1000,
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

  return expressSession;
}

export function getSessionStore() {
  return expressSessionGlobal;
}

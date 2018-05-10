import io from 'socket.io';
import sharedsession from 'express-socket.io-session';
import { getSessionStore } from './../express-session-sequelize/index';
var serverio;

var routes = [];
export default io;

export function serverWS() {
  return serverio;
}
export function routerWS(route, func) {
  routes.push({ route: route, func: func });
}
export function startWS(httpServer) {
  serverio = io(httpServer);

  serverio.use((socket, useNext) => {
    socket.updateSocketSession = function(next) {
      updateSocketSession(socket, () => {
        socket.session = socket.handshake.session;
        if (!Array.isArray(socket.session.roles)) {
          socket.session.roles = ['guest'];
        }
        next();
      });
    };
    useNext();
  });

  routes.forEach(item => {
    serverio.on(item.route, item.func);
  });

  return serverio;
}

export function getSocket(req, res, next) {
  req.io = serverio;

  if (req.headers && req.headers.cookie && req.headers.cookie.indexOf) {
    var sid = req.headers.cookie.indexOf('io=');
    if (sid > -1) {
      sid = req.headers.cookie.slice(sid + 3).split(' ')[0];
      if (sid.indexOf(';') > -1) {
        sid = sid.split(';')[0];
      }
      if (req.io.sockets.connected[sid]) {
        //console.log(session.Cookie());
        req.socketio = req.io.sockets.connected[sid];
      }
    }
  }

  next();
}

export function updateSocketSession(socket, next) {
  if (getSessionStore) {
    sharedsession(getSessionStore(), {
      autoSave: false,
    })(socket, next);
  } else {
    next();
  }
}

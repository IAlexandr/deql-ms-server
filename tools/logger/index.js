import dg from 'debug';
import conf from 'config';
import { db } from './../db/sequelize';
import { routerWS } from './../ws';

routerWS('connect', socket => {
  socket.on('logs', (key, cb) => {
    if (typeof cb !== 'function') {
      return null;
    }
    socket.updateSocketSession(() => {
      if (
        socket.session &&
        socket.session.info &&
        socket.session.info.system
      ) {
        var where = {
          order: [['createdAt', 'DESC']],
          limit: 3000,
          attributes: ['key', 'message', 'createdAt'],
        };
        if (key) {
          where.where = { key: key };
        }
        db.Log.findAll(where)
          .then(logs => {
            cb(null, logs);
          })
          .catch(e => {
            cb(e);
          });
      } else {
        cb('нет прав');
      }
    });
  });
});

export default function(key, publish = true) {
  const projectName = conf.projectName || 'default';
  const topicKey = `deql.${projectName}.${key}`;

  function log(key, message, type = 'info', time) {
    if (publish && db && db.hasOwnProperty('Log')) {
      db.Log.create({ key, message, type, time });
    }
  }

  return {
    debug: function() {
      dg(`${topicKey}`).call(
        undefined,
        '|',
        new Date().toJSON(),
        '|',
        ...arguments
      );
      log(key, argsStrConcat(arguments));
    },
    errDebug: function() {
      dg(`${topicKey}.error`).call(
        undefined,
        '|',
        new Date().toJSON(),
        '|',
        ...arguments
      );
      log(key, argsStrConcat(arguments), 'error');
    },
    time: function() {
      dg(`${topicKey}`).call(
        undefined,
        '|',
        new Date().toJSON(),
        '|',
        ...arguments
      );
      const args = arguments;
      let dt = new Date();
      return function() {
        const diff = new Date() - dt;
        dg(`${topicKey}`).call(
          undefined,
          '|',
          new Date().toJSON(),
          '| TIME: ',
          diff / 1000,
          '|',
          ...args,
          '|',
          ...arguments
        );
        let message = argsStrConcat(args);
        message += argsStrConcat(arguments);
        log(key, message, 'time', diff / 1000);
      };
    },
  };
}

function argsStrConcat(args) {
  const arr = [...args];
  return arr.reduce((v, n) => {
    v += `${n} | `;
    return v;
  }, ' | ');
}

import { createClient } from 'redis';
import options from 'tools/options';
import logger from 'tools/logger';
const { debug, time } = logger('tools.redis');

let client;

export function getValue({ key }) {
  return new Promise((resolve, reject) => {
    if (!client || !client.connected) {
      {
        debug('[getValue] client.connected:', client.connected);
        return reject(new Error('client.connected: false'));
      }
    }
    client.get(key, (err, res) => {
      if (err) {
        return reject(err);
      }
      debug(`[getValue] KEY: "${key}" has VALUE: ${res}`);
      return resolve(res);
    });
  });
}

export function connect() {
  const done = time('connecting..', createClient);
  return new Promise((resolve, reject) => {
    client = createClient({
      ...{
        retry_strategy: function(options) {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error('The server refused the connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
          }
          // reconnect after
          return Math.min(options.attempt * 100, 3000);
        },
      },
      ...{
        password: options.config.redis.password,
        host: options.config.redis.host,
        port: options.config.redis.port,
      },
    });

    client.on('error', function(err) {
      console.log('Error ' + err);
    });

    client.auth(options.config.redis.password, (err, result) => {
      if (err) {
        done('done. client.auth with err:', err.message);
        return reject(err);
      }
      done('done.', result);
      return resolve(client);
    });
  });
}

export default client;

import { RedisPubSub } from 'graphql-redis-subscriptions';
import options from 'tools/options';
import logger from 'tools/logger';

const { debug } = logger('graphql.pubsub');
const pubsub = new RedisPubSub({
  connection: {
    host: options.config.redis.host,
    port: options.config.redis.port,
    password: options.config.redis.password,
  },
});
debug('redis connection port ', options.config.redis.port);

export default pubsub;

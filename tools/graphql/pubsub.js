import { RedisPubSub } from 'graphql-redis-subscriptions';
import options from 'tools/options';
import logger from 'tools/logger';

const { debug } = logger('graphql.pubsub');
const pubsub = new RedisPubSub({
  connection: { port: options.config.redis.port },
});
debug('redis connection port ', options.config.redis.port);

export default pubsub;

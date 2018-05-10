import GraphQLJSON from 'graphql-type-json';
import logger from './../../tools/logger';
const { time, debug, errDebug } = logger('appState.resolvers', true);

const guest = {
  isElevated: false,
  login: 'guest',
  userName: 'guest',
  roles: [
    {
      id: 0,
      name: 'guest',
      rules: [],
    },
  ],
};
var t = 0;
export default pubsub => ({
  JSON: GraphQLJSON,
  Query: {
    SessionInfo: (users, args, { db, session }) => {
      if (session.user && session.user.login) {
        return db.User.findOne({
          where: { login: session.user.login },
          include: [
            {
              model: db.Role,
            },
          ],
        })
          .then(user => {
            if (user) {
              return {
                isElevated: true,
                login: user.login,
                userName: user.props.displayName,
                roles: session.user.Roles,
              };
            } else {
              return guest;
            }
          })
          .catch(err => {
            return guest;
            errDebug(err);
          });
      } else {
        session.user = guest;
        return guest;
      }
      //db.User.findOne(()=>{})
    },
  },
  Subscription: {
    sessionInfoChanged: {
      subscribe: () => {
        debug('sessionInfoChanged subscribed!');
        return pubsub.asyncIterator('SESSION_INFO_CHANGED');
      },
    },
  },
  Mutation: {
    login: (parent, { login, password }, { db, session }) => {
      return db.User.findOne({
        include: [
          {
            model: db.Role,
          },
        ],
        where: { login },
      }).then(userDoc => {
        if (!userDoc) {
          throw new Error('Пользователь не найден');
        }
        if (userDoc.password !== password) {
          throw new Error('Неверный пароль!');
        }
        session.user = userDoc.toJSON();
        session.user.isElevated = true;
        session.user.Roles = [];
        if (userDoc.Roles && userDoc.Roles.length) {
          userDoc.Roles.forEach(role => {
            session.user.Roles.push({
              id: role.id,
              name: role.name,
              rules: [],
            });
          });
        }

        let sessionInfo = {
          isElevated: true,
          id: session.user.id,
          login: session.user.login,
          userName: session.user.props.displayName,
          roles: session.user.Roles,
        };

        if (userDoc.Roles && userDoc.Roles.length) {
          const temp = userDoc.Roles.map(role => role.id);
          return db.Rule.findAll({
            include: [
              {
                model: db.Role,
                where: {
                  id: {
                    [db.Op.in]: temp,
                  },
                },
              },
            ],
          }).then(rules => {
            if (rules && rules.length) {
              rules.forEach(rule => {
                rule.Roles.forEach(role => {
                  const position = session.user.Roles.findIndex(
                    item => item.id === role.id
                  );
                  session.user.Roles[position].rules.push(rule.name);
                });
              });
              //console.log(sessionInfo);
              pubsub.publish('SESSION_INFO_CHANGED', {
                sessionInfoChanged: sessionInfo,
              });
              // pubsub.publish('SESSION_INFO_CHANGED', {
              //   sessionInfoChanged: sessionInfo,
              // });
              return sessionInfo;
            } else {
              //console.log(sessionInfo);
              pubsub.publish('SESSION_INFO_CHANGED', {
                sessionInfoChanged: sessionInfo,
              });
              // pubsub.publish('SESSION_INFO_CHANGED', {
              //   sessionInfoChanged: sessionInfo,
              // });
              return sessionInfo;
            }
          });
        }
      });
    },
    logout: (parent, args, { db, session }) => {
      if (session.user && session.user.isElevated) {
        session.user = Object.assign({}, guest);
        pubsub.publish('SESSION_INFO_CHANGED', {
          sessionInfoChanged: session.user,
        });
        return session.user;
      } else {
        session.user = guest;
        throw new Error('User is not authorized!');
      }
    },
  },
});

const schema = `
  scalar JSON
  
  type Query {
    # Получение информации о пользователе
    SessionInfo: SessionInfo
  }
  type SessionInfo {
    isElevated: Boolean!
    login: String!
    userName: String!
    roles: [SessionRole]
  }
  type SessionRole {
    id: Int!
    name: String!
    rules: [String]
  }
  type Subscription {
    sessionInfoChanged: SessionInfo!
  }
  type Mutation {
    login(login: String!, password: String!): SessionInfo
    logout: SessionInfo
  }
  `;
export default { schema };

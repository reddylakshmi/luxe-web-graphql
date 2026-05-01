const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');


const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }
  type Query {
    users: [User]
    user(id: ID!): User
  }
  type Mutation {
    createUser(name: String!, email: String!): User
  }
`;
let users = [];
const resolvers = {
  Query: {
    users: () => users,
    user: (_, { id }) => users.find(u => u.id === id),
  },
  Mutation: {
    createUser: (_, { name, email }) => {
      const user = { id: Date.now().toString(), name, email };
      users.push(user);
      return user;
    }
  }
};
const startServer = async () => {
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });
  app.listen(4000, () => console.log('Server ready at http://localhost:4000/graphql'));
};
startServer();
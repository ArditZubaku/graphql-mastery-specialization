import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const PORT = 4000;

/*
The workflow is: edit typeDefs in server.js,
then run yarn update:schema && yarn publish:schema.
*/

const typeDefs = `
  type Book {
    id: ID!
    title: String!
    author: String!
  }

  type Test {
    test: String
  }

  type Query {
    hello: String!
    books: [Book!]!
    test: Test
  }
`

const books = [
  { id: '1', title: 'Title 1', author: 'Author 1' },
  { id: '2', title: 'Title 2', author: 'Author 2' }
]

const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL",
    books: () => books,
    test: () => ({ test: "Test" }),
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

startStandaloneServer(server, { listen: { port: PORT } },)
  .then(() => { console.log(`Server ready at <http://localhost:${PORT}>`) })
  .catch(console.error)


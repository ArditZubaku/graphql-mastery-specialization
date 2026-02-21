import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const PORT = 4000;

const typeDefs = `
  type Book {
    id: ID!
    title: String!
    author: String!
  }

  type Query {
    hello: String!
    books: [Book!]!
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
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

startStandaloneServer(server, { listen: { port: PORT } },)
  .then(() => { console.log(`Server ready at <http://localhost:${PORT}>`) })
  .catch(console.error)


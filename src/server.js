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
    author: Author!
    publishedYear: Int
    price: Float
    inStock: Boolean
  }

  type Author {
    name: String!
  }

  type Test {
    test: String
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    hello: String!
    books: [Book!]!
    test: Test
    user: User
    book: Book
  }
`

const books = [
  {
    id: '1',
    title: 'Title 1',
    // author: 'Author 1',
    authorID: 'a1',
    price: 400,
    publishedYear: 1925,
    inStock: true,
  },
  {
    id: '2',
    title: 'Title 2',
    // author: 'Author 2',
    authorID: 'a2',
    publishedYear: 1954,
    price: 800,
    inStock: false,
  }
]

const user = { id: 1, name: "User", email: "user@email.con" }

const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL",
    books: () => books,
    test: () => ({ test: "Test" }),
    user: () => user,
    book: () => books.at(0)
  },
  Book: {
    // parent is of typeof book resolver
    author: (parent) => {
      const authors = {
        a1: { name: "Author 1" },
        a2: { name: "Author 2" }
      }

      return authors[parent.authorID]
    }
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

startStandaloneServer(server, { listen: { port: PORT } },)
  .then(() => { console.log(`Server ready at <http://localhost:${PORT}>`) })
  .catch(console.error)


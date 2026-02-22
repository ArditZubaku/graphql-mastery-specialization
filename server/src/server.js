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
    id: ID!
    name: String!
    country: Country
  }

  type Country {
    code: ID!
    name: String
  }

  type Test {
    test: String
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
  }

  type Query {
    hello: String!
    books: [Book!]!
    test: Test
    # user: User
    # book: Book
    book(id: ID!): Book
    user(id: ID!): User
    users: [User!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
  }
`

/*
 * Params
  query ExampleQuery {
    book(id: 1) {
      author {
        name
      }
    }
  }
 */
/*
 * Aliases:
 query ExampleQuery {
  book1: book(id: 1) {
    author {
      country {
        name
      }
    }
  }
  book2: book(id: 2) {
    title
    author {
      id
    }
  }
}
 */
/*
 * Fragments:
query ExampleQuery {
  book1: book(id: 1) {
    ...BookFields
  }
  book2: book(id: 2) {
    ...BookFields
  }
}

fragment BookFields on Book {
  title
  author {
    name
  }
}
*/
/*
 * Variables
query ExampleQuery($id: ID!) {
  book(id: $id) {
    author {
      name
    }
  }
}
* In the Variables panel we pass:
{
  "id": "2"
}
*/

/*
 mutation {
  createUser(name: "Test", email: "test@email.com", password: "password1234") {
    id
    name
    email
  }
}
*/

/*
 * Mutation with Input Type
 mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}

* Variables:
{
  "input": {
    "email": "user3@email.com",
    "name": "User 3",
    "password": "user3Password"
  }
}
 */

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

const users = [
  { id: 1, name: "User 1", email: "user1@email.con" },
  { id: 2, name: "User 2", email: "user2@email.con" }
]

const authors = [
  { id: 'a1', name: "Author 1", countryCode: 'UK' },
  { id: 'a2', name: "Author 2", countryCode: 'US' }
]

const countries = [
  { code: 'UK', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }
]

let userIDCounter = 3;

const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL",
    books: () => books,
    test: () => ({ test: "Test" }),
    // user: () => user,
    // book: () => books.at(0)
    book: (_, args) => books.find((b) => b.id === args.id),
    user: (_, args) => users.find((u) => u.id === args.id),
    users: () => users,
  },
  Mutation: {
    createUser: (_, args) => {
      const { input } = args;
      const { name, email, password } = input;

      const newUser = {
        id: userIDCounter++,
        name,
        email,
      }

      users.push(newUser);

      return newUser;
    }
  },
  Book: {
    // parent is of typeof book resolver
    author: (parent) => {
      return authors.find((a) => a.id === parent.authorID)
    }
  },
  Author: {
    country: (parent) => {
      return countries.find((c) => c.code === parent.countryCode)
    }
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

startStandaloneServer(server, { listen: { port: PORT } },)
  .then(() => { console.log(`Server ready at <http://localhost:${PORT}>`) })
  .catch(console.error)


/*
The workflow is: edit typeDefs in server.js,
then run yarn update:schema && yarn publish:schema.
*/

import { GraphQLError } from "graphql"
import { EmailScalar } from "./email.scalar.js"
import { pubSub } from "./pubsub.js"
import { isAuthenticated, isAuthorized } from "./auth.js"
import { prisma } from "./prisma.js"

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

/*
 * Using inline-Fragments with interfaces
query InlineFragments {
  addresses {
    id
    city
    street
    zip
    ... on HomeAddress {
      landmark
    }
    ... on OfficeAddress {
      company
    }
  }
}
 */

/*
 * Using inline-Fragments with Union Types
query InlineFragmentsUnionType {
  searchAddresses {
    ... on HomeAddress {
      id
      landmark
    }
    ... on OfficeAddress {
      id
      company
    }
  }
}
*/

/*
 * Pagination
query PaginatedUsers {
  paginatedUsers(take: 5, after: "05") {
    users {
      id
      gender
    }
    pageInfo {
      endCursor
      hasNextPage
    }
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
  { id: 1, name: "User 1", email: "user1@email.con", gender: "MALE" },
  { id: 2, name: "User 2", email: "user2@email.con", gender: "FEMALE" }
]

const authors = [
  { id: 'a1', name: "Author 1", countryCode: 'UK' },
  { id: 'a2', name: "Author 2", countryCode: 'US' }
]

const countries = [
  { code: 'UK', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }
]

const addresses = [
  {
    id: "1",
    street: "Street 1",
    city: "City 1",
    zip: "0001",
    landmark: "Landmark",
    // When working with interfaces we need to specify the __typename
    __typename: "HomeAddress",
  },
  {
    id: "2",
    street: "Street 2",
    city: "City 2",
    zip: "0002",
    company: "Company",
    __typename: "OfficeAddress",
  }
]

const channels = Object.freeze({
  USER_CREATED: "USER_CREATED",
});

export const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL",
    books: () => books,
    book: (_, args) => books.find((b) => b.id === args.id),
    user: (_, args) => {
      if (args.id === "unauth") {
        throw new GraphQLError(
          "User not authenticated",
          {
            extensions: {
              code: "UNAUTHENTICATED"
            }
          },
        )
      }

      const user = users.find((u) => u.id === args.id)
      if (!user) {
        throw new GraphQLError(
          "User not found",
          {
            extensions: {
              code: "NOT_FOUND",
              status: 404,
              reason: "Invalid user ID",
            }
          }
        )
      }

      return user
    },
    users: () => {
      console.log(`'users' resolver called at ${new Date().toISOString()}`)
      return prisma.user.findMany()
    },
    addresses: () => addresses,
    searchAddresses: () => addresses,
    me: (_parent, _arg, context) => {
      isAuthenticated(context.user)
      return context.user
    },
    paginatedUsers: async (_parent, args, _context) => {
      const { take = 5, after } = args
      const users = await prisma.user.findMany({
        take,
        // Skip 1 and take X from the cursor point
        skip: after ? 1 : 0,
        ...(
          after &&
          {
            cursor: {
              id: after
            }
          }
        ),
        orderBy: {
          id: "asc"
        }
      })

      return {
        users,
        pageInfo: {
          endCursor: users.at(-1)?.id ?? null,
          hasNextPage: users.length === take,
        }
      }
    }
  },
  Mutation: {
    createUser: async (_, args, context) => {
      // isAuthenticated(context.user)

      const { input } = args;
      let { name, email, password, gender } = input;

      if (!email || !password) {
        throw new GraphQLError(
          "Email and password are required",
          {
            extensions: {
              code: "BAD_USER_INPUT",
              field: "email",
            }
          }
        )
      }

      email = email.trim().toLowerCase()
      password = password.trim()
      gender = gender?.toUpperCase()

      if (password.length < 8) {
        throw new GraphQLError(
          "Password must be at least 8 characters long",
          {
            extensions: {
              code: "BAD_USER_INPUT",
              field: "email",
              minLength: 8,
            }
          }
        )
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          gender,
        }
      })

      // The payload must match the key of the Subscription field
      pubSub.publish(channels.USER_CREATED, { userCreated: newUser })

      return newUser;
    },
    updateUser: (_, args) => {
      const { input } = args;
      const { id, name, email, gender } = input;

      const user = users.find((u) => u.id === id);
      if (!user) throw new Error('User not found');

      if (name) user.name = name;
      if (email) user.email = email;
      if (gender) user.gender = gender;

      return user;
    },
    deleteUser: (_, args, context) => {
      isAuthorized(context.user, ['admin'])

      const { id } = args;
      const idx = users.findIndex((u) => u.id === id)

      if (idx === -1) throw new Error('User not found');

      users.splice(idx, 1);

      return true;
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
  },
  Email: EmailScalar,
  Subscription: {
    userCreated: {
      subscribe: () => pubSub.asyncIterableIterator(channels.USER_CREATED)
    }
  }
}


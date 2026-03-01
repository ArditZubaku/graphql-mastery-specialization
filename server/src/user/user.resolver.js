import { GraphQLError } from "graphql"
import { isAuthenticated, isAuthorized } from "../auth.js";
import { EmailScalar } from "../email.scalar.js";
import { prisma } from "../prisma.js";
import { pubSub } from "../pubsub.js";

const users = [
  { id: 1, name: "User 1", email: "user1@email.con", gender: "MALE" },
  { id: 2, name: "User 2", email: "user2@email.con", gender: "FEMALE" }
]

const channels = Object.freeze({
  USER_CREATED: "USER_CREATED",
});

export const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL",
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
  Email: EmailScalar,
  Subscription: {
    userCreated: {
      subscribe: () => pubSub.asyncIterableIterator(channels.USER_CREATED)
    }
  }
}


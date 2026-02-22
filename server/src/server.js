import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { resolvers } from "./resolvers.js";
import { typeDefs } from "./schema/main.js";

const PORT = 4000;

const server = new ApolloServer({ typeDefs, resolvers })

startStandaloneServer(server, { listen: { port: PORT } },)
  .then(() => { console.log(`Server ready at <http://localhost:${PORT}>`) })
  .catch(console.error)


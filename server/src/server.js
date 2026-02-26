import express from "express"
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { schema } from "./local.schema.js"
import { createServer } from "http"
import { WebSocketServer } from "ws"
import { useServer } from 'graphql-ws/use/ws';
import { getUserFromJWTToken } from "./auth.js";
import cors from 'cors';

const PORT = 4000
const GQL_PATH = "/graphql"

async function startServer() {
  const app = express()

  const httpServer = createServer(app)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: GQL_PATH,
  })

  // Bind graphql-ws
  const serverCleanup = useServer({ schema, }, wsServer)

  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });
  await apolloServer.start()

  app.use(
    GQL_PATH,
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const token = req.headers.authorization || ""
        const user = getUserFromJWTToken(token.replace("Bearer ", ""))
        return { user }
      }
    }),
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
    }),
  );

  httpServer.listen(PORT, () => {
    console.log(`HTTP ready at http://localhost:${PORT}${GQL_PATH}`)
    console.log(`Subscriptions ready at ws://localhost:${PORT}${GQL_PATH}`)
  })
}

startServer().catch(console.error)

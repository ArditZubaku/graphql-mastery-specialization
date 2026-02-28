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
import { performance } from "node:perf_hooks";
import responseCachePlugin from "@apollo/server-plugin-response-cache"
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";

const PORT = 4000
const GQL_PATH = "/graphql"

async function startServer() {
  let rateLimitStore
  try {
    const redisClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" })
    await redisClient.connect()
    rateLimitStore = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    })
    console.log("Rate limiter using Redis store")
  } catch (err) {
    console.warn("Redis unavailable, falling back to in-memory rate limit store:", err.message)
  }

  const rateLimiter = rateLimit({
    windowMs: 10 * 1_000, // 10s
    max: 5, // 5 reqs per IP
    keyGenerator: (req, _res) => req.header("x-user-id") || ipKeyGenerator(req.ip),
    ...(rateLimitStore && { store: rateLimitStore }),
  })

  const app = express()
  app.use(rateLimiter)

  const httpServer = createServer(app)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: GQL_PATH,
  })

  // Bind graphql-ws
  const serverCleanup = useServer({ schema, }, wsServer)

  const apolloServer = new ApolloServer({
    schema,
    cache: "bounded", // This activates the safe limited in-memory cache
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      responseCachePlugin(),

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
      {
        // This runs when a new request arrives at the server
        async requestDidStart(_reqCtx) {
          console.log("---")
          return {
            // It runs right before the query executes, giving access to field level hooks
            async executionDidStart(_reqtCtxEDS) {
              return {
                // It runs for every field in the query
                willResolveField(fieldResolverParams) {
                  const fieldName = fieldResolverParams.info.fieldName
                  const start = performance.now()
                  return function () {
                    // This will tell us how long it took to resolve each field
                    const duration = (performance.now() - start).toFixed(5)
                    console.log(`${fieldName} took ${duration}ms`)
                  }
                }
              }
            }
          }
        },
      },
    ],
  });
  await apolloServer.start()

  app.use(
    cors({
      origin: ['https://studio.apollographql.com', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'OPTIONS'],
    }),
  )

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
  );

  httpServer.listen(PORT, () => {
    console.log(`HTTP ready at http://localhost:${PORT}${GQL_PATH}`)
    console.log(`Subscriptions ready at ws://localhost:${PORT}${GQL_PATH}`)
  })
}

startServer().catch(console.error)

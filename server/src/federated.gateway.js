import "dotenv/config"
import { ApolloGateway } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import express from "express"
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from "http"
import { getUserFromJWTToken } from "./auth.js";
import cors from 'cors';
import { performance } from "node:perf_hooks";
import responseCachePlugin from "@apollo/server-plugin-response-cache"
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";
import "dotenv/config";
import { logger } from "./logger.js";

const gateway = new ApolloGateway({
  debug: true,
  // It will be getting the subgraphs from the Apollo using managed federation because we have set the .env vars
  // supergraphSdl: new IntrospectAndCompose({
  //   // This will be composed at runtime, the gateway will query each subgraph and get info
  //   // The subgraphs should be already running
  //   subgraphs: [
  //     { name: "users", url: "http://localhost:4001/graphql" },
  //     { name: "address", url: "http://localhost:4002/graphql" },
  //     { name: "book", url: "http://localhost:4003/graphql" }
  //   ]
  // })
})

const PORT = 4000
const GQL_PATH = "/graphql"

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
  message: { errors: [{ message: "Too many requests, please try again later." }] },
  ...(rateLimitStore && { store: rateLimitStore }),
})

const app = express()
app.use(rateLimiter)

const httpServer = createServer(app)

const apolloServer = new ApolloServer({
  introspection: process.env.NODE_ENV !== 'production',
  gateway,
  cache: "bounded", // This activates the safe limited in-memory cache

  // Hook that allows customizing errors before they are sent to the client
  formatError: (gqlFormattedErr, err) => {
    logger.error({
      message: gqlFormattedErr.message,
      code: gqlFormattedErr.extensions?.code || "INTERNAL_SERVER_ERROR",
      path: gqlFormattedErr.path,
      timestamp: new Date().toISOString(),
      service: gqlFormattedErr.extensions?.serviceName || "unknown"
    })

    return {
      message: gqlFormattedErr.message,
      code: gqlFormattedErr.extensions?.code || "INTERNAL_SERVER_ERROR",
    }
  },
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    responseCachePlugin(),

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
  console.log(`Gateway ready at: http://localhost:${PORT}${GQL_PATH}`)
})

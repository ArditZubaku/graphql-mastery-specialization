import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { logger } from "./logger.js";

const gateway = new ApolloGateway({
  debug: true,
  supergraphSdl: new IntrospectAndCompose({
    // This will be composed at runtime, the gateway will query each subgraph and get info
    // The subgraphs should be already running
    subgraphs: [
      { name: "users", url: "http://localhost:4001/graphql" },
      { name: "address", url: "http://localhost:4002/graphql" },
      { name: "book", url: "http://localhost:4003/graphql" }
    ]
  })
})

const server = new ApolloServer({
  gateway,
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
})

startStandaloneServer(
  server,
  {
    listen: {
      port: 4000
    }
  }
).then(({ url }) => {
  console.log(`Gateway ready at: ${url}`)
}).catch(console.error)

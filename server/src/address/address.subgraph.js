import { loadFilesSync } from "@graphql-tools/load-files";
import { resolvers } from "./address.resolver.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ApolloServer } from "@apollo/server";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { startStandaloneServer } from "@apollo/server/standalone";
import {
  ApolloServerPluginUsageReportingDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginSchemaReportingDisabled,
} from "@apollo/server/plugin/disabled";

const currentDir = dirname(fileURLToPath(import.meta.url))

const typeDefs = loadFilesSync(join(currentDir, "./address.graphql"))

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  plugins: [
    // Disabling because in Federation only the Gateway should report data to Apollo Studio
    ApolloServerPluginUsageReportingDisabled(),
    ApolloServerPluginInlineTraceDisabled(),
    ApolloServerPluginSchemaReportingDisabled(),
  ]
})

startStandaloneServer(
  server,
  {
    listen: {
      port: 4002
    }
  }
).then(({ url }) => {
  console.log(`Address subgraph ready at: ${url}`)
}).catch(console.error)

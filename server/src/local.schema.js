import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvers } from "./resolvers.js";
import { makeExecutableSchema } from "@graphql-tools/schema";

const dir = dirname(fileURLToPath(import.meta.url))

const typesArr = loadFilesSync(join(dir, "./schema/"), { extensions: ["graphql"] })
const typeDefs = mergeTypeDefs(typesArr)

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  // resolverValidationOptions: { requireResolversToMatchSchema: true }
})

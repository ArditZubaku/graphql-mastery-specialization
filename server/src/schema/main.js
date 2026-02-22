import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url))

const typesArr = loadFilesSync(dir, { extensions: ["graphql"] })

export const typeDefs = mergeTypeDefs(typesArr)



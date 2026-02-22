import { stitchSchemas } from "@graphql-tools/stitch";
import { createRemoteSchema } from "./remote.schema.js";
import { schema as localSchema } from "./local.schema.js";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

/*
 * Fetching fields from Local + Remote schemas
query Test {
  users {
    email
    gender
  }
  episodes {
    results {
      characters {
        location {
          name
        }
      }
    }
  }
}
*/

async function startGateway() {
  const remoteSchema = await createRemoteSchema();

  const gatewaySchema = stitchSchemas({
    subschemas: [
      { schema: localSchema },
      { schema: remoteSchema }
    ]
  })

  const server = new ApolloServer({
    schema: gatewaySchema,
  })

  const { url } = await startStandaloneServer(server, { listen: { port: 4000 } })

  console.log(`Server ready at ${url}`)
}

try {
  await startGateway();
} catch (err) {
  console.error(err)
}

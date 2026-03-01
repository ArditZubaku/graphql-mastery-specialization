import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const gateway = new ApolloGateway({
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

const server = new ApolloServer({ gateway })

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

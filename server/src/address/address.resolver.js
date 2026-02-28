const addresses = [
  {
    id: "1",
    street: "Street 1",
    city: "City 1",
    zip: "0001",
    landmark: "Landmark",
    // When working with interfaces we need to specify the __typename
    __typename: "HomeAddress",
  },
  {
    id: "2",
    street: "Street 2",
    city: "City 2",
    zip: "0002",
    company: "Company",
    __typename: "OfficeAddress",
  }
]

export const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL",
    addresses: () => addresses,
    searchAddresses: () => addresses,
  },
  Mutation: {},
}


const books = [
  {
    id: '1',
    title: 'Title 1',
    // author: 'Author 1',
    authorID: 'a1',
    price: 400,
    publishedYear: 1925,
    inStock: true,
  },
  {
    id: '2',
    title: 'Title 2',
    // author: 'Author 2',
    authorID: 'a2',
    publishedYear: 1954,
    price: 800,
    inStock: false,
  }
]

const authors = [
  { id: 'a1', name: "Author 1", countryCode: 'UK' },
  { id: 'a2', name: "Author 2", countryCode: 'US' }
]

const countries = [
  { code: 'UK', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }
]

export const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL",
    books: () => books,
    book: (_, args) => books.find((b) => b.id === args.id),
  },
  Mutation: {},
  Book: {
    // parent is of typeof book resolver
    author: (parent) => {
      return authors.find((a) => a.id === parent.authorID)
    }
  },
  Author: {
    country: (parent) => {
      return countries.find((c) => c.code === parent.countryCode)
    }
  },
}


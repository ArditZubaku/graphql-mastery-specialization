import { GraphQLScalarType, Kind } from "graphql"

function validateEmail(value) {
  const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
  if (!isValid) {
    throw new TypeError("Invalid email: " + value)
  }

  return value
}

const EmailScalar = new GraphQLScalarType({
  name: "Email",
  description: "Custom scalar for validating email addresses",
  serialize: validateEmail,
  parseValue: validateEmail,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return validateEmail(ast.value)
    }

    throw new TypeError("Email must be a string")
  }
})

const EmailTypeDef = "scalar Email";

export {
  EmailScalar,
  EmailTypeDef
}


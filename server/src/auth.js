import { GraphQLError } from "graphql"
import { verify } from "jsonwebtoken"

export function getUserFromJWTToken(token) {
  try {
    return verify(token, "my-secret")
  } catch (error) {
    return null
  }
}

export function isAuthorized(user, allowedRoles) {
  if (!user || !allowedRoles.includes(user.role)) {
    throw new GraphQLError(
      'Unauthorized access',
      {
        extensions: {
          code: 'FORBIDDEN'
        }
      }
    )
  }
}

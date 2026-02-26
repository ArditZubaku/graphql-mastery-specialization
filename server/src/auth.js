import { GraphQLError } from "graphql"
import jsonwebtoken from "jsonwebtoken"

export function getUserFromJWTToken(token) {
  try {
    return jsonwebtoken.verify(token, "my-secret")
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

export function isAuthenticated(user) {
  if (!user) {
    throw new GraphQLError(
      'Authentication required',
      {
        extensions: {
          code: 'UNAUTHENTICATED'
        }
      }
    )
  }
}

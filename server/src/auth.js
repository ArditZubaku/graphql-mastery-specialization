import { verify } from "jsonwebtoken"

export function getUserFromJWTToken(token) {
  try {
    return verify(token, "my-secret")
  } catch (error) {
    return null
  }
}

export const config = {
  PORT: process.env.PORT || 4000,
  SECRET_KEY: process.env.SECRET_KEY || "my-secret",
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
}

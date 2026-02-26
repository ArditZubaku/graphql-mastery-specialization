import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" })
const prisma = new PrismaClient({
  adapter,
  errorFormat: "pretty",
  log: ["info", "query", "error"],
  omit: {
    user: {
      gender: true
    }
  }
});

async function main() {
  await prisma.user.createMany({
    data: [
      { id: "11", name: "User 11", email: "user11@email.com", gender: "MALE" },
      { id: "12", name: "User 12", email: "user12@email.com", gender: "FEMALE" },
    ]
  })

  const allUsers = await prisma.user.findMany()
  console.log(allUsers)
}

main().catch(console.error).finally(() => prisma.$disconnect())

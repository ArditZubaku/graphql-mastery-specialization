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
  await prisma.user.deleteMany()

  const users = Array.from({ length: 50 }).map((val, idx, arr) => {
    return {
      id: String(idx + 1).padStart(2, '0'),
      name: `user${idx + 1}`,
      email: `user${idx + 1}@email.com`,
      gender: idx % 2 === 0 ? "MALE" : "FEMALE"
    }
  })

  const inserted = await prisma.user.createMany({ data: users })

  const allUsers = await prisma.user.findMany()
  console.log(allUsers)
  console.log(allUsers.length === inserted.count)
}

main().catch(console.error).finally(() => prisma.$disconnect())

import { createLogger, format, transports } from "winston";

const { combine, timestamp, json, prettyPrint, } = format

// TODO: Replace with pino
export const logger = createLogger({
  level: "error",
  format: combine(timestamp(), prettyPrint(), json(),),
  transports: [
    new transports.File({ filename: "/tmp/gql.log" }),
    new transports.Console(),
    // new transports.Stream({ stream: process.stdout })
  ]
})

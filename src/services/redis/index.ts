
import Redis, { RedisOptions } from "ioredis"

const KEYDB_INSTANCE = process.env.PROD_KEYDB_URL as string
const KEYDB_PASSWORD = process.env.PROD_KEYDB_PASSWORD as string

console.log(KEYDB_INSTANCE, KEYDB_PASSWORD)


export const redisOptions: RedisOptions = {
    port: 6379,
    host: KEYDB_INSTANCE,
    password: KEYDB_PASSWORD,
    // tls: {},
    // db: 0,
    maxRetriesPerRequest: null
};

let redisClient: Redis

try {
    redisClient = new Redis(redisOptions)

} catch (e) {
    throw new Error(`Redis Connection Error :  ${(e as Error).message}`)
}

export default redisClient


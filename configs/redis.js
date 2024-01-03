import { createClient } from "redis";

const HOST = process.env.REDISHOST || 'db'
const PORT = process.env.REDISPORT || '6379'

const client = createClient({
    url: `redis://${HOST}:${PORT}`
});
client.on("error", (err) => console.log("Redis Client Error", err));
await client.connect();

console.log("REDIS ping ->", await client.ping());

export default client;

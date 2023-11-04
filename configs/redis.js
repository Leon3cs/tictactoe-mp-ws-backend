import { createClient } from "redis";

const client = createClient({
    url: 'redis://db:6379'
});
client.on("error", (err) => console.log("Redis Client Error", err));
await client.connect();

console.log("REDIS ping ->", await client.ping());

export default client;

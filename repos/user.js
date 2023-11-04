import { Schema, Repository } from "redis-om";
import client from "../configs/redis.js";

const userSchema = new Schema('user', {
  name: { type: "string" },
  socketId: { type: "string" },
});

export const userRepository = new Repository(userSchema, client);

await userRepository.createIndex();

import { Schema, Repository } from "redis-om";
import client from "../configs/redis.js";

const matchSchema = new Schema("match", {
  players: { type: "string[]" },
  turn: { type: "boolean" },
  first: { type: "string" },
  round: { type: "string" },
  gridId: { type: "string" },
  endgame: { type: "boolean" },
  circleWin: { type: "boolean" },
  crossWin: { type: "boolean" },
  draw: { type: "boolean" },
  circleScore: { type: "number" },
  crossScore: { type: "number" },
},{
  dataStructure: "JSON"
});

export const matchRepository = new Repository(matchSchema, client);

await matchRepository.createIndex();

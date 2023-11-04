import { Router } from "express";
import { matchRepository } from "../repos/match.js";
import { EntityId } from "redis-om";
import client from "../configs/redis.js";
import matchService from "../service/match.js";
import { HTTP_STATUS } from "../util/http.js";

export const router = new Router();

router.post("/", async (req, res) => {
  const { players } = req.body;

  const data = matchService.createMatch(players);

  let match = await matchRepository.save(data);

  const grid = matchService.initGrid();

  await client.json.set(match[EntityId], "$", grid);

  match.gridId = match[EntityId];

  match = await matchRepository.save(match);

  res.status(HTTP_STATUS.CREATED).json({ match, grid });
});

router.patch("/:id/move/cross", async (req, res) => {
  const { id } = req.params;
  const { row, col, playerId } = req.body;

  let match = await matchRepository.fetch(id);

  if (match) {
    let grid = await client.json.get(id);

    if (matchService.checkPosition(row, col, grid)) {
      grid = matchService.crossMove(row, col, grid);

      await client.json.set(id, "$", grid);

      match.turn = !match.turn;

      const [newRound] = match.players.filter((item) => item !== playerId);

      match.round = newRound;

      const gameDetails = matchService.checkForWinners(grid);
      match.endgame = gameDetails.endgame;
      match.circleWin = gameDetails.circleWin;
      match.crossWin = gameDetails.crossWin;
      match.draw = gameDetails.draw;

      if (gameDetails.crossWin) {
        match.crossScore += 1;
      }

      if (gameDetails.circlWin) {
        match.circleScore += 1;
      }

      match = await matchRepository.save(match);
    }

    res.status(HTTP_STATUS.OK).json({ match, grid });
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.patch("/:id/move/circle", async (req, res) => {
  const { id } = req.params;
  const { row, col, playerId } = req.body;

  let match = await matchRepository.fetch(id);
  
  if (match) {
    let grid = await client.json.get(id);

    if (matchService.checkPosition(row, col, grid)) {
      grid = matchService.circleMove(row, col, grid);

      await client.json.set(id, "$", grid);

      match.turn = !match.turn;

      const [newRound] = match.players.filter((item) => item !== playerId);

      match.round = newRound;

      const gameDetails = matchService.checkForWinners(grid);
      match.endgame = gameDetails.endgame;
      match.circleWin = gameDetails.circleWin;
      match.crossWin = gameDetails.crossWin;
      match.draw = gameDetails.draw;

      if (gameDetails.crossWin) {
        match.crossScore += 1;
      }

      if (gameDetails.circlWin) {
        match.circleScore += 1;
      }

      match = await matchRepository.save(match);
    }

    res.status(HTTP_STATUS.OK).json({ match, grid });
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (id) {
    await matchRepository.remove(id);

    res.status(HTTP_STATUS.OK).json("OK");
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

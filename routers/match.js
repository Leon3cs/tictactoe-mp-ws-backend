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

router.put("/:id/add/player", async (req, res) => {
  const { id } = req.params;
  const { socketId } = req.body;

  let match = await matchRepository.fetch(id);

  if(match[EntityId]){
    let players = [...match.players, socketId];

    match.players = players;

    match = await matchRepository.save(match);

    const grid = await client.json.get(id);

    res.status(HTTP_STATUS.OK).json({ match, grid });
  }else{
    res.status(HTTP_STATUS.NOT_FOUND).send()
  }
});

router.put("/:id/remove/player", async (req, res) => {
  const { id } = req.params;
  const { socketId } = req.body;

  let match = await matchRepository.fetch(id);

  if(match[EntityId]){
    let players = match.players;

    const filteredPlayers = players.filter((player) => player != socketId);
    match.players = filteredPlayers

    if (match.players.length) {
      match.first = filteredPlayers[0]
      match.round = filteredPlayers[0]

      const matchReset = matchService.resetMatch(match)

      match.turn = matchReset.turn
      match.endgame = matchReset.endgame
      match.circleWin = matchReset.circleWin
      match.crossWin = matchReset.crossWin
      match.draw = matchReset.draw

      await matchRepository.save(match);

      const newGrid = matchService.initGrid()

      await client.json.set(id, '$', newGrid)

      const grid = await client.json.get(id);

      res.status(HTTP_STATUS.OK).json({ match, grid });
    } else {
      await matchRepository.remove(id);

      await client.json.del(id);

      res.status(HTTP_STATUS.OK).send();
    }
  }
});

router.get("/player/:socketId", async (req, res) => {
  const { socketId } = req.params;

  let matchId = await matchRepository
    .search()
    .where("players")
    .contain(socketId)
    .firstId();

  if (matchId) {
    res.status(HTTP_STATUS.OK).json({ matchId });
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.patch("/:id/move/cross", async (req, res) => {
  const { id } = req.params;
  const { row, col, playerId } = req.body;

  let match = await matchRepository.fetch(id);

  if (match[EntityId]) {
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

      let crossScore = match.crossScore;
      let circleScore = match.circleScore;

      if (gameDetails.crossWin) {
        crossScore = crossScore + 1;
      }

      if (gameDetails.circlWin) {
        circleScore = circleScore + 1;
      }

      match.crossScore = crossScore;
      match.circleScore = circleScore;

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

  if (match[EntityId]) {
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

      let crossScore = match.crossScore;
      let circleScore = match.circleScore;

      if (gameDetails.crossWin) {
        crossScore = crossScore + 1;
      }

      if (gameDetails.circleWin) {
        circleScore = circleScore + 1;
      }

      match.crossScore = crossScore;
      match.circleScore = circleScore;

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

    await client.json.del(id);

    res.status(HTTP_STATUS.OK).json("OK");
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.put('/:id/reset', async (req, res) => {
  const { id } = req.params

  if(id){
    let match = await matchRepository.fetch(id)

    const matchReset = matchService.resetMatch(match)

    match.turn = matchReset.turn
    match.round = matchReset.round
    match.endgame = matchReset.endgame
    match.circleWin = matchReset.circleWin
    match.crossWin = matchReset.crossWin
    match.draw = matchReset.draw

    await matchRepository.save(match)

    const grid = matchService.initGrid()

    await client.json.set(id, '$', grid)

    res.status(HTTP_STATUS.OK).json({ match, grid })
  }else{
    res.status(HTTP_STATUS.NOT_FOUND).send()
  }
})

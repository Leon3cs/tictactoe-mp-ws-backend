import { Router } from "express";
import client from "../configs/redis.js";
import matchService from "../service/match.js";
import { HTTP_STATUS } from "../util/http.js";

export const router = new Router();

router.post("/", async (req, res) => {
  const { players } = req.body;

  const id = matchService.createMatchId()

  const data = matchService.createMatch(players);

  const grid = matchService.initGrid();

  await client.json.set(`grid-${id}`, "$", grid);

  let match = {...data, gridId: id}
  
  await client.json.set(id, "$", match)

  await client.json.set(`player-${players[0]}`, "$", id)

  res.status(HTTP_STATUS.CREATED).json({ match, grid });
});

router.put("/:id/add/player", async (req, res) => {
  const { id } = req.params;
  const { socketId } = req.body;

  let match = await client.json.get(id)

  if(match){
    let players = [...match.players, socketId];

    match.players = players;

    await client.json.set(id, "$", match)

    const grid = await client.json.get(`grid-${id}`);

    await client.json.set(`player-${socketId}`, "$", id)

    res.status(HTTP_STATUS.OK).json({ match, grid });
  }else{
    res.status(HTTP_STATUS.NOT_FOUND).send()
  }
});

router.put("/:id/remove/player", async (req, res) => {
  const { id } = req.params;
  const { socketId } = req.body;

  let match = await client.json.get(id);

  await client.json.del(`player-${socketId}`)

  if(match){
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
      match.crossScore = matchReset.crossScore
      match.circleScore = matchReset.circleScore

      await client.json.set(id, "$", match)

      const newGrid = matchService.initGrid()

      await client.json.set(`grid-${id}`, '$', newGrid)

      const grid = await client.json.get(`grid-${id}`);

      res.status(HTTP_STATUS.OK).json({ match, grid });
    } else {
      await client.json.del(id);

      await client.json.del(`grid-${id}`);

      res.status(HTTP_STATUS.OK).send();
    }
  }
});

router.get("/player/:socketId", async (req, res) => {
  const { socketId } = req.params;

  const matchId = await client.json.get(`player-${socketId}`) 

  if (matchId) {
    res.status(HTTP_STATUS.OK).json({ matchId });
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.patch("/:id/move/cross", async (req, res) => {
  const { id } = req.params;
  const { row, col, playerId } = req.body;

  let match = await client.json.get(id);

  if (match) {
    let grid = await client.json.get(`grid-${id}`);

    if (matchService.checkPosition(row, col, grid)) {
      grid = matchService.crossMove(row, col, grid);

      await client.json.set(`grid-${id}`, "$", grid);

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

      await client.json.set(id, "$", match);
    }

    res.status(HTTP_STATUS.OK).json({ match, grid });
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.patch("/:id/move/circle", async (req, res) => {
  const { id } = req.params;
  const { row, col, playerId } = req.body;

  let match = await client.json.get(id);

  if (match) {
    let grid = await client.json.get(`grid-${id}`);

    if (matchService.checkPosition(row, col, grid)) {
      grid = matchService.circleMove(row, col, grid);

      await client.json.set(`grid-${id}`, "$", grid);

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

      await client.json.set(id, "$", match);
    }

    res.status(HTTP_STATUS.OK).json({ match, grid });
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (id) {
    await client.json.del(id);

    await client.json.del(`grid-${id}`);

    res.status(HTTP_STATUS.OK).json("OK");
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send();
  }
});

router.put('/:id/reset', async (req, res) => {
  const { id } = req.params

  if(id){
    let match = await client.json.get(id)

    const matchReset = matchService.resetMatch(match)

    match.turn = matchReset.turn
    match.round = matchReset.round
    match.endgame = matchReset.endgame
    match.circleWin = matchReset.circleWin
    match.crossWin = matchReset.crossWin
    match.draw = matchReset.draw

    await client.json.set(id, "$", match)

    const grid = matchService.initGrid()

    await client.json.set(`grid-${id}`, '$', grid)

    res.status(HTTP_STATUS.OK).json({ match, grid })
  }else{
    res.status(HTTP_STATUS.NOT_FOUND).send()
  }
})

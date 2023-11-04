export const CROSS = 1;
export const CIRCLE = 2;

const createMatch = (players) => {
  return {
    players: players,
    turn: false,
    first: players[0],
    round: players[0],
    gridId: "",
    endgame: false,
    circleWin: false,
    crossWin: false,
    draw: false,
    circleScore: 0,
    crossScore: 0,
  };
};

const initGrid = () => {
  return [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
};

const checkPosition = (row, col, grid) => {
  return grid[row][col] === 0;
};

const crossMove = (row, col, grid) => {
  let newGrid = grid;

  if (checkPosition(row, col, grid)) {
    newGrid[row][col] = CROSS;
  }

  return newGrid;
};

const circleMove = (row, col, grid) => {
  let newGrid = grid;

  if (checkPosition(row, col, grid)) {
    newGrid[row][col] = CIRCLE;
  }

  return newGrid;
};

const isCrossWinCheck = (grid) => {
  let cross = false;

  grid.forEach((row) => {
    if (row.filter((item) => item === CROSS).length === 3) cross = true;
  });

  let colsAsRows = [];

  for (let i = 0; i < grid.length; i++) {
    colsAsRows.push([grid[0][i], grid[1][i], grid[2][i]]);
  }

  colsAsRows.forEach((row) => {
    if (row.filter((item) => item === CROSS).length === 3) cross = true;
  });

  let positions = [];

  grid.forEach((row, index) => {
    positions.push(row[index]);
  });

  if (positions.filter((item) => item === CROSS).length === 3) cross = true;

  return cross;
};

const isCircleWinCheck = (grid) => {
  let circle = false;

  grid.forEach((row) => {
    if (row.filter((item) => item === CIRCLE).length === 3) circle = true;
  });

  let colsAsRows = [];

  for (let i = 0; i < grid.length; i++) {
    colsAsRows.push([grid[0][i], grid[1][i], grid[2][i]]);
  }

  colsAsRows.forEach((row) => {
    if (row.filter((item) => item === CIRCLE).length === 3) circle = true;
  });

  let positions = [];

  grid.forEach((row, index) => {
    positions.push(row[index]);
  });

  if (positions.filter((item) => item === CIRCLE).length === 3) circle = true;

  return circle;
};

const checkForWinners = (grid) => {
  let gameDetails = {
    endgame: false,
    circleWin: false,
    crossWin: false,
    draw: false,
  };

  const remainingTiles = grid.reduce(
    (total, row) => (total += row.filter((col) => col == 0).length),
    0
  );

  const crossWin = isCrossWinCheck(grid);
  const circleWin = isCircleWinCheck(grid);
  
  if (remainingTiles === 0 || (crossWin || circleWin)) gameDetails.endgame = true;

  gameDetails.crossWin = crossWin;
  gameDetails.circleWin = circleWin;

  if (gameDetails.endgame && !crossWin && !circleWin) gameDetails.draw = true;

  return gameDetails;
};

export default {
  createMatch,
  initGrid,
  crossMove,
  circleMove,
  checkForWinners,
  checkPosition
};

# Game state management API for the TicTacToe Multiplayer game

This service will store and control game states of the matches running on the TicTacToe Multiplayer game previously developed. If you want to know more about the game itself, feel free to chek out it's repository **[here](https://github.com/Leon3cs/tic-tac-toe-multiplayer-websocket)**.

## Introduction

This application will manage all game states from each started game that happens on the [TicTacToe Multiplayer game](https://github.com/Leon3cs/tic-tac-toe-multiplayer-websocket). When the websocket server prepares a new match, instead of sending the structure from itself to the clients, it will make a request to this application, which will create the necessary structures of the match, and save it on a Redis database.

When any player of a match send a socket event to make a move on the game grid, the websocket server will also make a request to this application, to update the game grid and check for winners, calculate player scores and change the turn for the other player to make his move.

So the websocket server will be responsible to control the game events, player connection and disconnection, broadcasting the updates on the game state for players in a match. While this application will handle all game rules logics, and making sure the match data is consistent for both players.

## Application components

This is a multi-container Docker application with two services:

- *db*: A redis instance running the oficial redis image
- *app*: An express API

## API documentation

This application has an OpenAPI spec in the `/docs` folder. Swagger is also available at the `/swagger` route when the application is running.

## The game grid

The game is represented by a 3x3 matrix, initially with all its elements value as 0 like in the example below

```javascript
const grid = [
    [0,0,0],
    [0,0,0],
    [0,0,0]
]
```

When a player moves, this application computes if the position chosen by the player is available, and then changes the element value according to the constants that representing each player.

```javascript
const CROSS = 1
const CIRCLE = 2
```

## The Match object

This application has a database for store a list of matches. This Match object represents the state of the game, and is used to organize all sockets that connects to it in groups of 2, so the matches are always 1v1 players.

```javascript
const match = {
    id: 0, // Identifies the match 
    players: [], // List of players in this match, each player is represented by the socket id
    turn: false, // Identify which player can make a move, either 'O' or 'X'
    first: '', // The socket id of the first player to enter in this match
    round: '', // The socket id of the player that can make a move
    gridId: '', // The id of the 3x3 Matrix of the game, this id is identical to the 'id' property, the actual grid is stored in a separate JSON in redis
    endgame: false, // Becomes 'true' if either a player won, or all tiles of the grid have been filled by a player move
    circleWin: false, // Becomes 'true' if the player as 'O' won a game
    crossWin: false, // Becomes 'true' if the player as 'X' won a game
    draw: false, // Becomes 'true' in none of the players won after all tiles have been filled by a player move
    circleScore: 0, // Counts how many games the player as 'O' won 
    crossScore: 0, // Counts how many games the player as 'X' won 
}
```

## Grid object

In this application, the matches don`t hold the actual grid itself, since it is a Redis OM object map Entity, it doesn't support JSON values as properties yet, storing the grid in the entity would require serialization and deserialization in both this application and the clients for making the necessary updates and using it as reference to build the UI. 
So the actual grid is stored as an JSON key/value pair in Redis and the key is the EntityId of the Match.
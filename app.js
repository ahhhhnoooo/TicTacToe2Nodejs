import { createServer } from 'http';
import * as fs from 'node:fs/promises';
import { WebSocketServer } from 'ws';

//TODO Put this in a db
let game = {
  //Available roles in the game 
  //In reverse order because of pop...
  available: ['o', 'x'],
  //Whose turn it currently is
  turn: 'x',
  //Who won the game
  winner: null,
  //The game board state
  board: []
}

//Manually checking for the winner
const checkWinner = () => {
  if (
    (game.turn === game.board[0] && game.turn === game.board[1] && game.turn === game.board[2]) ||
    (game.turn === game.board[3] && game.turn === game.board[4] && game.turn === game.board[5]) ||
    (game.turn === game.board[6] && game.turn === game.board[7] && game.turn === game.board[8]) ||
    (game.turn === game.board[0] && game.turn === game.board[3] && game.turn === game.board[6]) ||
    (game.turn === game.board[1] && game.turn === game.board[4] && game.turn === game.board[7]) ||
    (game.turn === game.board[2] && game.turn === game.board[5] && game.turn === game.board[8]) ||
    (game.turn === game.board[0] && game.turn === game.board[4] && game.turn === game.board[8]) ||
    (game.turn === game.board[2] && game.turn === game.board[4] && game.turn === game.board[6])) {
    game.winner = game.turn;
    return true;
  } else { return false; }
}

//Change to the other player's turn
const nextTurn = () => {
  game.turn = (game.turn === 'x') ? 'o' : 'x';
}

const server = createServer(function (req, res) {
  fs.readFile('./public/index.html')
    .then((result) => {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      res.write(result);
      res.end();
    })
    .catch((err) => {
      res.writeHead(404);
      res.end();
      console.log(err)
    })
});

let sockets = [];
const wss = new WebSocketServer({ server: server });
wss.on('connection', function connection(socket) {

  sockets.push(socket);
  //TODO Does this have any concurrency issues accessing "game"?
  //Assign a role to this connection
  //Roles are 'x', 'o', and 's' (spectator)
  let role = game.available.pop();
  if (role === undefined) {
    role = 's';
  }

  socket.send(JSON.stringify({ role: role }));

  socket.send(JSON.stringify(game));

  socket.on('message', function message(data) {
    let clickData = JSON.parse(data);
    if (clickData.role === 's') {
      //TODO What do to when a spectator clicks?
      return;
    }
    //TODO What do to if a player clicks on a space already taken?
    if (game.board[clickData.index]) {
      return;
    }
    //TODO What do to if a player clicks out of turn?
    if (game.turn !== clickData.role) {
      return;
    }
    if (game.winner) {
      return;
    }
    game.board[clickData.index] = clickData.role;
    checkWinner();
    nextTurn();

    //Send update to all connected clients
    for (let socket of sockets) {
      socket.send(JSON.stringify(game));
    }
  });

});

server.listen(8080);
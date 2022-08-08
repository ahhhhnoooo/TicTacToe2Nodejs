import { createServer } from 'http';
import * as fs from 'node:fs/promises';
import { WebSocketServer } from 'ws';

//TODO Put this in a db
let game = {
  //Available roles in the game
  available:['x','o'],
  //Whose turn it currently is
  turn:'x',
  //Who won the game
  winner:null,
  //The game board state
  board:[]
}
let sockets = [];

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
      console.log(err)
      res.end();
    })
});

const wss = new WebSocketServer({ server:server });

wss.on('connection', function connection(socket) {
  sockets.push(socket);
  
  socket.on('message', function message(data) {
    console.log('received: %s', data);
  });

  socket.send('something');
});

server.listen(8080);
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const TicTacToe = require("./tic-tac-toe");

const app = express();
const clientPath = `${__dirname}/../client`

// server the static client files.
app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

let sessions = [];
// Connection is made by a player.
io.on("connection", (sock) => {
	sock.on("Create Session", (newSession) => {
		console.log("New session " + newSession.id + " created!");

		newSession.player1 = sock.id;
		newSession.player2 = null;
		sessions.push(newSession);
		io.emit("All Sessions", sessions)
	});
	sock.on("Join Session", (sessionID) => {
		console.log("Joining Session " + sessionID);

		var filtered = sessions.filter(session => session.id === sessionID);
		if (filtered.length == 1) {
			var i = sessions.indexOf(filtered[0]);
			if (sessions[i].player2 == null && sessions[i].player1 != sessions[i].player2) {
				sessions[i].player2 = sock.id;
				new TicTacToe(io.sockets.sockets.get(sessions[i].player1), sock);
				io.emit("All Sessions", sessions);
			}
		}
	});
	sock.on("Get All Session", () => {
		io.emit("All Sessions", sessions);
	})
	sock.on("disconnect", function() {
		console.log("Socket " + sock.id + "got disconnect!");

		var session = null;
		for (var i = 0; i < sessions.length; i++) {
			if (sessions[i].player1 === sock.id) {
				session = sessions[i];
			} else if (sessions[i].player2 === sock.id) {
				session = sessions[i];
			}
		}
		if (session != null && session.player1 == sock.id && io.sockets.sockets.get(session.player2)) {
			io.sockets.sockets.get(session.player2).emit("refresh");
			io.sockets.sockets.get(session.player2).disconnect();
		} else if (session != null && session.player2 == sock.id && io.sockets.sockets.get(session.player1)) {
			io.sockets.sockets.get(session.player1).emit("refresh");
			io.sockets.sockets.get(session.player1).disconnect();
		}

		var i = sessions.indexOf(session);
		sessions.splice(i, 1);
		io.emit("All Sessions", sessions);
		
	});
});

server.on("error", (err) => {
	console.error("Server error", err);
});

server.listen(process.env.PORT || 8080, () => {
	console.log('Tic-Tac-Toe started on 8080');
});
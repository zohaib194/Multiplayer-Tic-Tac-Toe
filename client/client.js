	
var canvas = document.querySelector('#canvas');

if(!canvas) {
	console.error("ERROR: Canvas is undefined!");
}

const NR_OF_TILES = 9;
const TILE_SIZE = canvas.width / 3 - 5;
const OFFSET = 2.5;
const CELL_X = canvas.width / 3;
const CELL_Y = canvas.height / 3;

const message = document.querySelector("#message");
const restartButton = document.querySelector("#RestartButton");
const serverMessage = document.querySelector("#serverMessage");
const matchMaking = document.querySelector("#MatchMaking");
const createSession = document.querySelector("#CreateSession");
const sessionButtons = document.querySelector("#SessionButtons");
const joinSession = document.querySelector("#JoinSession");
const game = document.querySelector("#Game");
const score = document.querySelector("#Score");
const playAgain = document.querySelector("#PlayAgain");

var images = [];
images.push(document.createElement("img"));
images.push(document.createElement("img"));
images[0].src = "https://www.pngkit.com/png/detail/205-2056266_player-o-into-tic-tac-toe-img-tic.png";
images[1].src = "https://www.pngkey.com/png/detail/205-2056274_tic-tac-toe-img-letter-o.png";

var rects = [];

var turn = 0;

///
/// server connection.
///
const sock = io();
console.log(sock);
matchMakingView();
createGrid();
drawGrid();


function createGrid(){
	var nextRow = 0;
	var nextColumn = 0;
	for (var i = 0; i < NR_OF_TILES; i++) {
		if(i !== 0 && i % 3 === 0) {
			nextRow += 1;
			nextColumn = 0;
		}

		if(i % 3 !== 0) {
			nextColumn += 1;
		}

		rects.push({
			row: nextRow,
			column: nextColumn,
			x: nextRow * CELL_X + OFFSET,
			y: nextColumn * CELL_Y + OFFSET,
			w: TILE_SIZE,
			h: TILE_SIZE
		});
	}
}

function drawGrid() {
	var context;

	if(!canvas) {
		console.error("ERROR: Canvas is undefined!");
		return
	}

	context = canvas.getContext('2d');

	if(!context) {
		console.error("ERROR: Context is undefined!");
		return;
	}

	for (var i = 0; i < rects.length; i++) {
		context.fillRect(rects[i].x, rects[i].y, rects[i].w, rects[i].h);
	}

	// On 2nd player move!
	sock.on("Draw", (Obj) => {
		context.drawImage(images[Obj.ID], Obj.tile.x, Obj.tile.y, Obj.tile.w, Obj.tile.h);
	});

	sock.on("changeTurn", (t) => {
		turn = t;
	});

	canvas.onclick = evt => {

		var clickedRect = getClickedRect(evt.offsetX, evt.offsetY);

		if(clickedRect != null) {			

			if(turn == 0) {
				return;
			}

			// Sending turn to be stored as used tile in history.
			sock.emit("usedTile", clickedRect);
		}
	}
}

function getClickedRect(xOffset, yOffset) {
	for (var i = 0; i < rects.length; i++) {
		if(xOffset <= rects[i].x + rects[i].w
			&& xOffset >= rects[i].x
			&& yOffset <= rects[i].y + rects[i].h
			&& yOffset >= rects[i].y) {
			console.log("LOG: Rectangle " + i + " is clicked!");
			return rects[i];
		}
	}

	return null;
}

function matchMakingView() {
	createSession.style.display = "none";
	joinSession.style.display = "none";
}

function resetOnClick() {
	sock.emit("restartRequest", true);
	message.innerText = "Request sent!";
}

function onYesClick() {
	sock.emit("restartAccepted", true);
}

function onNoClick() {
	sock.emit("restartDenied", true);
}

function onJoinButtonClicked() {
	sessionButtons.style.display = "none";
	createSession.style.display = "none";
	joinSession.style.display = "block";
	sock.emit("Get All Session");
}

function onCreateButtonClicked() {
	sessionButtons.style.display = "none";
	createSession.style.display = "block";
	sock.emit("Create Session", {
		id: "coolGuy|"+sock.id
	});

}

function onBackButtonClicked() {
	sessionButtons.style.display = "block";
	createSession.style.display = "none";
	joinSession.style.display = "none";
}

function displaySessions(sessionList) {
	var tableBody = document.getElementById("SessionTableBody");
	tableBody.innerHTML = "";
	for (var i = 0; i < sessionList.length; i++) {
		var rowNode = document.createElement("tr");

		if (sessionList[i].player1 != null && sessionList[i].player2 == null) {
			rowNode.onclick = function (event) {
				var cell = rowNode.getElementsByTagName("td")[0];
				var sessionID = cell.innerHTML;
				sock.emit("Join Session", sessionID);
			}
			rowNode.style.cursor = "pointer";
		}

		var nameCellNode = document.createElement("td");
		var player1CellNode = document.createElement("td");
		var player2CellNode = document.createElement("td");

		nameCellNode.innerHTML = sessionList[i].id;
		player1CellNode.innerHTML = sessionList[i].player1;
		player2CellNode.innerHTML = (sessionList[i].player2 == null) ? "waiting..." : sessionList[i].player2
	
		nameCellNode.style.overflow = "hidden";
		player1CellNode.style.overflow = "hidden";
		player2CellNode.style.overflow = "hidden";

		rowNode.appendChild(nameCellNode);
		rowNode.appendChild(player1CellNode);
		rowNode.appendChild(player2CellNode);
		tableBody.appendChild(rowNode);	
	}
}
/*
*
* Server Connection
* 
*/
// On connection we receive "message" event from the server.
sock.on("message", (text) => {
	serverMessage.innerText = text;
	setTimeout(() => {
		if(text == "The Game Starts!"){
			game.style.display = "block";
			score.style.display = "block";

			matchMaking.style.display = "none";
		}
	}, 2000);
});

sock.on("gameMessage", (msg) => {
	message.innerHTML = msg;

	if(msg.includes("won") || msg.includes("lost") || msg.includes("tie")) {
		restartButton.style.display = "block";
	}
});

sock.on("score", (scoreObj) => {
	const yourScore = document.querySelector("#you");
	const opponentScore = document.querySelector("#opponent");

	yourScore.innerText = parseInt(yourScore.innerText) + scoreObj.you;
	opponentScore.innerText = parseInt(opponentScore.innerText) + scoreObj.opponent;
})

sock.on("restartRequest", (b) => {
	playAgain.style.display = "block";
	restartButton.style.display = "none";
})

sock.on("restartGame", (b) => {
	playAgain.style.display = "none";

	rects = [];
	createGrid();
	context = canvas.getContext('2d');
	context.clearRect(0, 0, canvas.width, canvas.height);
	drawGrid();

	restartButton.style.display = "none";
})

sock.on("restartDenied", (b) => {
	location.reload();
})

sock.on("All Sessions", (sessionList) => {
	console.log(sessionList);
	displaySessions(sessionList);
})

sock.on("refresh", () => {
	location.reload();
})
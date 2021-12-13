let clientId = null;
let clientName = null;
let gameId = null;
let gameName = null;
let ws = new WebSocket("wss://hyperspeed-backend.herokuapp.com");
// let ws = new WebSocket("ws://localhost:8080");


const createGameBtn1 = document.getElementById("create-game-button1");
const joinGameBtn1 = document.getElementById("join-game-button1");
const optionsBtnContainer = document.getElementById("options-btn-container");
const instruction = document.getElementById("instruction");

const createGameForm = document.getElementById("create-game-form");
const joinGameForm = document.getElementById("join-game-form");

const createGameBtn2 = document.getElementById("create-game-button2");
const joinGameBtn2 = document.getElementById("join-game-button2");

const gameNameDom = document.getElementById("game-name");
const gameIdDom = document.getElementById("game-id");

const playerName = document.getElementById("player-name");
const playerName2 = document.getElementById("player-name2");

const createdGameInfo = document.getElementById("create-game-info");
const gameIdDisplay = document.getElementById("game-id-display");
const gameNameDisplay = document.getElementById("game-name-display");
const playersJoined = document.getElementById("players-joined");

createGameBtn1.addEventListener("click", () => {
  optionsBtnContainer.style.display = "none";
  instruction.style.display = "none";
  createGameForm.style.display = "flex";
});

joinGameBtn1.addEventListener("click", () => {
  optionsBtnContainer.style.display = "none";
  instruction.style.display = "none"
  joinGameForm.style.display = "flex";
});

createGameBtn2.addEventListener("click", () => {
  const payload1 = {
    method: "name",
    clientId: clientId,
    clientName: playerName.value,
  };

  ws.send(JSON.stringify(payload1));

  const payload2 = {
    method: "create",
    gameName: gameNameDom.value,
  };
  ws.send(JSON.stringify(payload2));

});

joinGameBtn2.addEventListener("click", () => {
     const payload1 = {
       method: "name",
       clientId: clientId,
       clientName: playerName2.value,
     };

     ws.send(JSON.stringify(payload1));

    const payload2 = {
      method: "join",
      "clientId": clientId,
      "clientName": playerName2.value,
      "gameId": gameIdDom.value,
    };

    ws.send(JSON.stringify(payload2));
})

ws.onmessage = (message) => {
  // message data
  const response = JSON.parse(message.data);

  // connect
  if (response.method === "connect") {
    clientId = response.clientId;
    console.log("Client connected", response.clientId);
  }

  // create-game
  if (response.method === "create") {
    gameId = response.game.id;
    gameName = response.game.gameName;
    
    const payload = {
        "method": "join",
        "clientId": clientId,
        "clientName": clientName,
        "gameId": gameId
    }

    ws.send(JSON.stringify(payload));

    console.log({gameId})

    console.log("Game created", response.game.id, response.game.gameName);
  }

  // name
  if (response.method === "name") {
    clientName = response.clientName;
    console.log({ clientName })
    console.log("name updated", response.clientName);
  }

  // join-game
  if (response.method === "join") {
      createGameForm.style.display = "none";
      joinGameForm.style.display = "none";
    createdGameInfo.style.display = "flex";
    gameId = response.game.id;
    gameIdDisplay.innerText = gameIdDisplay.innerText + " " + response.game.id;
    gameNameDisplay.innerText = gameNameDisplay.innerText + " " + response.game.gameName;

    playersJoined.innerHTML = response.game.clients.map(c => {
        return `<div class="player-card">
                    <p class="player-name">${c.clientName} joined</p>
                </div>`;
    })
  }

  if(response.method === "scoreSubmit"){
      console.log(response.game)
      document.getElementById("scorespanel").style.display = "flex";
     document.getElementById("scorespanel").innerHTML =
       response.game.scores.map((score) => {
         return ` <div class="score-box">
        <h2>${score.clientName}</h2>
        <p id="score-row" class="info-row">Score: <span id="score">${score.score}</span></p>
        <p id="distance-row" class="info-row">Distance: <span id="distance">${score.distance}</span></p>
    </div>`;
       });
  }
};

function submitScore(scoreMade, distanceCovered){
    const payload = {
      method: "scoreSubmit",
      clientId: clientId,
      clientName: clientName,
      score: scoreMade,
      distance: distanceCovered,
      gameId: gameId
    };

    ws.send(JSON.stringify(payload));
}

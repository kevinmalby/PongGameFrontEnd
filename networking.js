var server;
var updatePaddleIntervalID;

function receiveMessage(payload) {
  serverData = JSON.parse(payload);

  recvTimestamp = serverData.time_stamp;
  timeDelaySum += (getTimeStamp() - recvTimestamp);;
  packetCount++;

  $("#time-delay").text("Average Packet Delay: " + (timeDelaySum/packetCount).toFixed(1) + "ms");

  var json;
  switch (serverData.phase) {
    case "initialization":
      initialize(serverData.player_number);
      $("#header-submit").addClass('disabled');
      break;
    case "initial_ball_position":
      initializeBall(serverData.ball_position, serverData.ball_size);
      json = {
        "phase": "ready_to_start",
        "time_stamp": getTimeStamp(),
        "name": playerName,
        "ball_position": [ball.x, ball.y]
      };
      server.send('message', JSON.stringify(json));
      break;
    case "send_info":
      json = {
        "phase": "exchange_info",
        "time_stamp": getTimeStamp(),
        "name": playerName
      };
      server.send('message', JSON.stringify(json));
      break;
    case "wait":
      $('#loading-container').show();
      break;
    case "set_opponent":
      setOpponent(serverData.name);
      $('#loading-container').hide();
      break;
    case "start":
      // Show start animation
      // don't know if keeping this, but good for now
      canvas.style.visibility = "visible";
      $('#stats-header').show();
      $('#stats-container').show();
      $('#stats-container2').show();
      $('#time-delay').show();
      subBtn.removeClass("disabled");
      subBtn.text("Disconnect");

      updatePaddleIntervalID = setInterval("updatePaddle();", 100);
      break;
    case "disconnected":
      var ipAddress = $("#ip-address-input").val();
      var port = $("#port-number-input").val();

      disconnect(ipAddress, port, playerName);
      break;
    case "score_update":
      setScore(serverData.new_score, serverData.num_tries);
      setOpponentScore(serverData.opp_new_score, serverData.opp_num_tries);
      break;
    case "opponent_paddle_update":
      var opponentPaddlePos = JSON.parse(serverData.opponent_paddle);
      setOpponentPaddle(opponentPaddlePos[0], opponentPaddlePos[1]);

      break;
    case "ball_update":
      var pos = serverData.ball_position;
      pos[1] = pos[1] + (topWallRect.y + topWallRect.height);
      setBallPosition(pos);
      break;
  }
}


function initialize(playerNumber) {
  playerNum = playerNumber;
  initialData = {
    "phase": "initial_dimensions",
    "time_stamp": getTimeStamp(),
    "name": playerName,
    "map_dimensions": [offsetX,
      offsetY + (topWallRect.y + topWallRect.height),
      1024, bottomWallRect.y - (topWallRect.y + topWallRect.height)
    ],
    "paddle_dimensions": [paddle.x, paddle.y,
      paddle.height, paddle.width
    ]
  };
  send(JSON.stringify(initialData));

}

function send(text) {
  server.send('message', text);
}

function connect(ipAddress, port, playerName) {
  server = new FancyWebSocket('ws://' + ipAddress + ':' + port);

  //Let the user know we're connected
  // Server.bind('open', function() {
  //           document.getElementById("cntBtn").disabled = true;
  //   log( "Connected." );
  // });

  // //OH NOES! Disconnection occurred.
  // Server.bind('close', function( data ) {
  //           document.getElementById("cntBtn").disabled = false;
  //   log( "Disconnected." );
  // });

  // //Log any messages sent from server
  server.bind('message', receiveMessage);

  server.connect();
}

function disconnect(ipAddress, port, playerName) {
  var json = {
    "phase": "disconnect",
    "time_stamp": getTimeStamp(),
    "name": playerName
  };
  clearInterval(updatePaddleIntervalID);
  server.send("message", JSON.stringify(json));
  server.disconnect();

  packetCount = 0;
  timeDelaySum = 0;

}
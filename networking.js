var server;

function receiveMessage(payload) {
  serverData = JSON.parse(payload);

  switch (serverData.phase) {
  case "initialization":
      initialize();
      break;
  case "initial_ball_position":
      initializeBall(serverData.ball_position,serverData.ball_size);
      var json = {
          "phase":"ready_to_start",
          "ball_position":[ball.x, ball.y]
      }
      server.send('message', JSON.stringify(json));
      break;
  case "start":
      // Show start animation
      // don't know if keeping this, but good for now
      canvas.style.visibility="visible";
      break;
  case "score_update":
      setScore(serverData.new_score, serverData.num_tries);
      break;
    case "ball_update":
      var pos = serverData.ball_position;
      pos[1] = pos[1] + (topWallRect.y + topWallRect.height);
      setBallPosition(pos);
      break;
  }
}

function initialize() {
  pongApp.showPleaseWait();
  var initialData = {
    "phase":"initial_dimensions",
    "map_dimensions": [offsetX,
      offsetY + (topWallRect.y + topWallRect.height),
      farWallRect.x, bottomWallRect.y - (topWallRect.y + topWallRect.height)
    ],
    "paddle_dimensions": [paddle.x, paddle.y,
      paddle.height, paddle.width
    ],
  }
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
  /* This send message needs to be somehwere else too, server
  is still in connecting state at this point*/
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var canvasOffset = $("#canvas").offset();
var offsetX = canvasOffset.left;
var offsetY = canvasOffset.top;
var topWallRect;
var farWallRect;
var bottomWallRect;
var paddle;
var paddleRight; // player one gets to be on Left, player two is on right
var playerName;
var otherPlayerName;
var playerNum;
var ball;
var ballPosition;
var score;
var attempts;
var updateIncrement = 1;
var updatePaddleCount = 0;
var previousY;
var paddleDirection;
var recvTimestamp;
var timeDelaySum = 0;
var packetCount = 0;
var ballUpdateQueue = [];
var updateLoopTimer = null;
var firstUpdate = true;
var pastPosition;
var interpolateCount = 1;
var predictDistance;
$('#stats-container').hide();
$('#stats-header').hide();
$('#loading-container').hide();
$('#time-delay').hide()

var debug = false; // make it so I can see things without dealin with server :)

function playerDataToJSON() {

  var data = {
    "phase": "paddle_update",
    "time_stamp": getTimeStamp(),
    "name": playerName,
    "paddle_direction": paddleDirection,
    "paddle_position": [paddle.x, paddle.y - (topWallRect.x + topWallRect.height)]
  };
  return JSON.stringify(data);
}

function draw() {

  topWallRect = new rect("top-wall-rectangle", 10, 10, 1004, 40, "rgba(0,112,124,0.95)", "black", 0);
  topWallRect.draw();

  //farWallRect = new rect("far-wall-rectangle", 974, 10, 40, 736, "rgba(0,112,124,0.95)", "black", 0);
  //farWallRect.draw();

  bottomWallRect = new rect("bottom-wall-rectangle", 10, 706, 1004, 40, "rgba(0,112,124,0.95)", "black", 0);
  bottomWallRect.draw();

  paddle = new rect("paddle", 10, 400, 30, 120, "rgba(0,112,124,0.95)", "rgba(0,0,0,0)", 0);
  paddleRight = new rect("paddleRight", 984, 400, 30, 120, "rgba(0,112,124,0.95)", "rgba(0,0,0,0)", 0);
  //paddle.draw();
}

function initializeBall(position, ballSize) {
  ball = new circle("ball", position[0], position[1], ballSize, 0, Math.PI * 2, "rgba(0,112,124,0.95)", "black", 5);
}

function setBallPosition(position) {
  // todo, need to change this so that it works
  ctx.clearRect(ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
  ballPosition = position;
  //console.log("Ball x: " + ballPosition[0] + ", Ball y: " + ballPosition[1]);
  //console.log("Setting new point - x: " + position[0] + ", y: " + position[1]);
  ball.redraw(ballPosition[0], ballPosition[1]);
}

function setScore(newScore, totalTries) {
  if (score != newScore || attempts != totalTries) {
    score = newScore;
    attempts = totalTries;
    $('#player-name-display').text(playerName + "'s Stats");
    if (score > 0 && attempts == 0) {
      $('#success-rate').text("100%");
    } else if (score == 0 && attempts == 0) {
      $('#success-rate').text("0%");
    } else {
      $('#success-rate').text("" + Math.round(score / attempts * 100) + "%");
    }
    $('#total-hits').html(score);
    $('#total-misses').text(attempts);

  }

}

function setOpponentScore(newScore, totalTries) {
  if (score != newScore || attempts != totalTries) {
    score = newScore;
    attempts = totalTries;
    $('#player2-name-display').text(otherPlayerName + "'s Stats");
    if (score > 0 && attempts == 0) {
      $('#player2-success-rate').text("100%");
    } else if (score == 0 && attempts == 0) {
      $('#player2-success-rate').text("0%");
    } else {
      $('#player2-success-rate').text("" + Math.round(score / attempts * 100) + "%");
    }
    $('#player2-total-hits').html(score);
    $('#player2-total-misses').text(attempts);

  }

}

function setOpponent(opponentName) {
  otherPlayerName = opponentName;
  $('#player2-name-display').text(opponentName);
  $('#player2-success-rate').text("0%");
  $('#player2-total-hits').text("0");
  $('#player2-total-misses').text("0");
}

function updateLoop() {
  if (firstUpdate) {
    updateLoopTimer = setInterval("updateLoop();", 10);
    firstUpdate = false;
  } else {
    if (pastPosition == ballUpdateQueue[ballUpdateQueue.length - 2]) {
      interpolateCount++;
    } else {
      interpolateCount = 1;
    }

    distanceVector = getDistanceVector(ballUpdateQueue[ballUpdateQueue.length - 1], ballUpdateQueue[ballUpdateQueue.length - 2]);
    yAdjust = distanceVector.y / ((timeDelaySum / packetCount) / 10);
    xAdjust = distanceVector.x / ((timeDelaySum / packetCount) / 10);

    curPos = ballUpdateQueue[ballUpdateQueue.length - 2];

    if (Math.abs(curPos[0] + xAdjust * interpolateCount) > Math.abs(ballUpdateQueue[ballUpdateQueue.length - 1][0]) ||
      Math.abs(curPos[1] + yAdjust * interpolateCount) > Math.abs(ballUpdateQueue[ballUpdateQueue.length - 1][1])) {
      curPos = ballUpdateQueue[ballUpdateQueue.length - 1];
    } else {

      updatePos = [curPos[0] + xAdjust * interpolateCount, curPos[1] + yAdjust * interpolateCount];
    }
    setBallPosition(updatePos);

    pastPosition = curPos;
  }

}

function predictLoop() {

  if (firstUpdate) {
    if (ballUpdateQueue.length > 0)
      firstUpdate = false;
      pastPosition = ballUpdateQueue[0];
  } else {
    if (ballUpdateQueue.length > 0) {
      updatePos = ballUpdateQueue.shift();
      setBallPosition(updatePos);
      predictDistance = getDistanceVector(updatePos, pastPosition);
      pastPosition = updatePos;
      console.log("Set new authoritative point: " + updatePos);
      interpolateCount = 1;
    } else {
      
      delay = timeDelaySum/packetCount;

      // console.log("ball x: " + ball.x);
      // console.log("ball y: " + ball.y);
      // console.log("predicted ball x: " + (ball.x + (predictDistance.x / (delay/10))));
      // console.log("predicted ball y: " + (ball.y + (predictDistance.y / (delay/10))));


      setBallPosition([Math.round(ball.x + (predictDistance.x / (delay/10))), Math.round(ball.y + (predictDistance.y / (delay/10)))]);

    }

  }

}

function getDistanceVector(recentPoint, pastPoint) {
  var distVect = [];
  distVect.x = recentPoint[0] - pastPoint[0];
  distVect.y = recentPoint[1] - pastPoint[1];
  return distVect;
}

function processForm(e) {
  if (e.preventDefault) e.preventDefault();
  if (debug) {
    // for showing things without receiving input from server
    $('#stats-container').show();
    $('#stats-header').show();
    canvas.style.visibility = "visible";
    draw();
    return false;
  }
  subBtn = $("#header-submit");

  btnText = subBtn.text();

  if (btnText != "Disconnect") {

    var ipAddress = $("#ip-address-input").val();
    var port = $("#port-number-input").val();
    playerName = $("#player-name-input").val();

    draw(); // Move this elsewhere to when the document is loaded, disable when not playing

    previousY = 400;
    connect(ipAddress, port, playerName);
  } else {

    subBtn.text("Play!");
    $("#ip-address-input").val("");
    $("#port-number-input").val("");
    $("#player-name-input").val("");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.visibility = "hidden";
    $("#stats-header").hide();
    $("#stats-container").hide();
    $("#stats-container2").hide();
    $("#time-delay").hide();

    disconnect(ipAddress, port, playerName);
  }


  // You must return false to prevent the default form behavior
  return false;
}

function updatePaddle() {

  // if (paddle.y - previousY < 0) {
  //   paddleDirection = -1;
  // } else if (paddle.y - previousY > 0) {
  //   paddleDirection = 1;
  // } else {
  //   paddleDirection = 0;
  // }


  if (ballPosition[0] < (1024 * 0.3)) {
    send(playerDataToJSON());
    updatePaddleCount = 0;
  } else if (updatePaddleCount == 8) {
    send(playerDataToJSON());
    updatePaddleCount = 0;
  } else {
    updatePaddleCount++;
  }

  previousY = paddle.y;

  // if (paddleDirection != 0) {
  //   send(playerDataToJSON());
  // }
}

function setOpponentPaddle(newPaddleX, newPaddleY) {
  ctx.clearRect(paddleRight.x, paddleRight.y, paddleRight.width, paddleRight.height);

  paddleRight.x = newPaddleX;
  paddleRight.y = newPaddleY + topWallRect.y + topWallRect.height;

  paddleRight.redraw(paddleRight.x, paddleRight.y);

}

function getTimeStamp() {
    var d = new Date();
    var n = 0;
    console.log(offset);
    if(playerNum == 0){
	n = d.getTime();
	n -= offset;
    }
    else {
	n = d.getTime() + 123456789;
	n -= offset;
    }
    return n;
}

function handleMouseMove(e) {
  mouseX = parseInt(e.clientX - offsetX);
  mouseY = parseInt(e.clientY - offsetY);

  ctx.clearRect(paddle.x, paddle.y, paddle.width, paddle.height);

  var newPaddleY;
  if (mouseY <= (topWallRect.y + topWallRect.height + paddle.height / 2 + 5)) {
    newPaddleY = topWallRect.y + topWallRect.height + 5;
  } else if (mouseY >= (bottomWallRect.y - paddle.height / 2 - 5)) {
    newPaddleY = bottomWallRect.y - paddle.height - 5;
  } else {
    newPaddleY = mouseY - paddle.height / 2;
  }

  paddle.redraw(paddle.x, newPaddleY);

  //// DELETE ME ////
  if (debug)
    setOpponentPaddle(paddleRight.x, newPaddleY);

}

$(document).keydown(function(e) {

  var newPaddleY;

  try {
    ctx.clearRect(paddle.x, paddle.y, paddle.width, paddle.height);
  } catch (err) {
    return;
  }


  switch (e.which) {

    // Handle up case
    case 38:
    case 87:
      e.preventDefault();
      if (paddle.y >= (topWallRect.y + topWallRect.height)) {
        if (paddle.y - 10 < (topWallRect.y + topWallRect.height)) {
          newPaddleY = topWallRect.y + topWallRect.height + 5;
        } else {
          newPaddleY = paddle.y - 10;
        }
      }
      break;
      // Handle down case
    case 40:
    case 83:
      e.preventDefault();
      if ((paddle.y + paddle.height) <= bottomWallRect.y) {
        if (paddle.y + paddle.height + 10 > bottomWallRect.y) {
          newPaddleY = bottomWallRect.y - paddle.height - 5;
        } else {
          newPaddleY = paddle.y + 10;
        }
      }
      break;
  }
  paddle.redraw(paddle.x, newPaddleY);
});

var form = document.getElementById("play-info-form");
if (form.attachEvent) {
  form.attachEvent("submit", processForm);
} else {
  form.addEventListener("submit", processForm);
}

if (canvas.attachEvent) {
  canvas.attachEvent("mousemove", handleMouseMove);
} else {
  canvas.addEventListener("mousemove", handleMouseMove);
}

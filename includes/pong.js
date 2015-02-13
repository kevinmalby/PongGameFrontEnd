var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var canvasOffset = $("#canvas").offset();
var offsetX = canvasOffset.left;
var offsetY = canvasOffset.top;
var topWallRect;
var farWallRect;
var bottomWallRect;
var paddle;
var playerName;
var ball;
var score;
var attempts;
var updateIncrement = 1;
var previousY;
var paddleDirection;

setInterval(updatePaddle, 100);

function playerDataToJSON() {
  var data = {
    "phase" : "paddle_update",
    "paddle_direction" : paddleDirection,
    "paddle_position" : [paddle.x, paddle.y - (topWallRect.x + topWallRect.height)]
  };
  return JSON.stringify(data);
}

function draw() {

  topWallRect = new rect("top-wall-rectangle", 10, 10, 1004, 40, "rgba(0,112,124,0.95)", "black", 0);
  topWallRect.draw();

  farWallRect = new rect("far-wall-rectangle", 974, 10, 40, 736, "rgba(0,112,124,0.95)", "black", 0);
  farWallRect.draw();

  bottomWallRect = new rect("bottom-wall-rectangle", 10, 706, 1004, 40, "rgba(0,112,124,0.95)", "black", 0);
  bottomWallRect.draw();

  paddle = new rect("paddle", 10, 400, 30, 120, "rgba(0,112,124,0.95)", "rgba(0,0,0,0)", 0);
  //paddle.draw();
}

function initializeBall(position, ballSize) {
  ball = new circle("ball", position[0], position[1], ballSize, 0, Math.PI*2, "rgba(0,112,124,0.95)", "black", 5);
}

function setBallPosition(position) {
  // todo, need to change this so that it works
  ctx.clearRect(ball.x - ball.radius, ball.y - ball.radius, ball.radius*2, ball.radius*2);
  newBallPos = serverData.ball_position;
  ball.redraw(newBallPos[0], newBallPos[1]);
}

function setScore(newScore, totalTries) {
    // TODO:: is this right?
    if(score != newScore){
	score = newScore;
	attempts = totalTries;
  $('#player-name-display').text(playerName + "'s Stats");
	$('#success-rate').text( "" + Math.round(score/attempts * 100) + "%" ); 
	$('#total-hits').html( score  ); 
	$('#total-misses').text( attempts ); 
	
    }
	
}

function processForm(e) {
  if (e.preventDefault) e.preventDefault();

  var ipAddress = $("#ip-address-input").val();
  var port = $("#port-number-input").val();
  playerName = $("#player-name-input").val();

  draw(); // Move this elsewhere to when the document is loaded, disable when not playing

  previousY = 400;
  connect(ipAddress, port, playerName);

  // You must return false to prevent the default form behavior
  return false;
}

function updatePaddle() {
  if (paddle.y - previousY < 0) {
    paddleDirection = -1;
  } else if (paddle.y - previousY > 0) {
    paddleDirection = 1;
  } else {
    paddleDirection = 0;
  }
  previousY = paddle.y;

  send(playerDataToJSON());
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
  
}

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

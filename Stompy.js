var canvas;
var ctx;
var player;
var airborn;
var score;
var highScore;
var sliding;
var jetPack = 100;
var jumpTimer = 0;
var DROP_FACTOR = 3;
var SCORE_DIGITS = 8;

var inputs = {
	left: false,
	up: false,
	right: false,
	down: false
};
var spritesheet = new Image();

var sprites = {     // drawing the sprites from a single image
	left: new sprite(30, 38, 30, 38),
	right: new sprite(0, 0, 30, 38),
	leftJump: new sprite(0, 38, 30, 38),
	rightJump: new sprite(30, 0 , 30, 38),
	brick: new sprite(60, 0, 50, 50),
	coin: new sprite(60, 50, 25, 27),
	jet: new sprite(85, 50, 3, 7)
};

var facingRight = true;
var platforms = [];
var target;
var jet;
var timestamp = Date.now();
var enemy;
var enemyPlay;
var SLIDE_FACTOR = 5;
var JUMP_VELOCITY = 300;
var JUMP_TIME = .2;
var ACCEL = 200;
var MAX_VELOCITY = 150;
var MIN_VELOCITY = .5;
var FRICTION_FACTOR = 3;
var GRAVITY = 400;
var SPLATTER_VELOCITY = 399;
var MAX_DELTA = .03;
var EDGE_CREEP = 7;
var JET_DECAY = 50;
var JET_RECOVER = 10;
var ENEMY_VELOCITY = 50;


function init() {  			// how the entire game looks (still)
	spritesheet.src = 'StompySpritesUpdate.png';
	
	highScore = localStorage.getItem('high');
	if(!highScore) highScore = 0;
	
	
	canvas = document.getElementById('canvas');
	canvas.width = 600;
	canvas.height = 600;
	ctx = canvas.getContext('2d');

	
	// var player = {
		// x: 0,
		// y: 0,
		// width: 50,
		// height: 50
	// };
	

	

	platforms.push(new entity(550, 550, 50, 50));
	platforms.push(new entity(250, 300, 50, 50));
	platforms.push(new entity(350, 500, 50, 50));
	platforms.push(new entity(400, 400, 50, 50));
	platforms.push(new entity(100, 200, 50, 50));
	platforms.push(new entity(325, 150, 50, 50));
	platforms.push(new entity(0, 454, 50, 50));
	
	enemy = new entity(0, 0 , 30, 30);
	enemy.vx = ENEMY_VELOCITY;
	enemyPlat = pick(platforms);
	enemy.setBottom(enemyPlat.getTop());
	enemy.setMidX(enemyPlat.getMidX());
	
	target = new entity(0, 0, 27, 27);
	moveTarget();
		
	player = new entity(0, 0, 30, 38);
	reset();
	
	jet = new entity(-100, -100, 3, 7)
	 
	
	document.addEventListener('keydown', keyDown, false);
	document.addEventListener('keyup', keyUp, false);
	
	gameLoop();
}	

function moveTarget() {
	score += 5;
	if (score > highScore) 
		highScore = score;
		localStorage.setItem('high', highScore);
	
	var platform = pick(platforms);
	target.setMidX(platform.getMidX());
	target.setMidY(platform.getTop() - 40);
	}

function gameLoop() {
	updateplayerposition();
	handleCollistion();
	
	updateCanvas();
	window.requestAnimationFrame(gameLoop);
}

function updateplayerposition() {
	var now = Date.now();
	var delta = (now - timestamp) / 1000;
	if(delta > MAX_DELTA) delta = MAX_DELTA;
	timestamp = now;
	
	if(inputs.left) {
		facingRight = false
		if(!airborn && player.vx > 0) {
			player.vx -= delta * player.vx * FRICTION_FACTOR;
		}
		player.vx -= delta * ACCEL;
	} else if(inputs.right) {
		facingRight = true
		if(!airborn && player.vx < 0) {
			player.vx -= delta * player.vx * FRICTION_FACTOR;
		}
		player.vx += delta * ACCEL;
	} else if(!airborn) {
		player.vx -= delta * player.vx * FRICTION_FACTOR;
	}
	
			
	if(sliding) {
			player.vy -= delta * player.vy * SLIDE_FACTOR;
		}
	
	var jetting = false;
	if(inputs.up) {
		if(!airborn) {
		    jumpTimer = JUMP_TIME;
			player.vy = -JUMP_VELOCITY;
		} else {
		player.vy += delta * GRAVITY;
		}
	} else if(inputs.down && jetPack > 0) {
		player.vy -= delta * ACCEL;
		jetPack -= delta * JET_DECAY;
		jetting = true;
	}

	else {
		if(jumpTimer) jumpTimer = 0;
		if(player.vy < 0) player.vy -= delta * player.vy * DROP_FACTOR;
		player.vy += delta * GRAVITY;
	}
	
		if(!inputs.down && jetPack < 100) {
		jetPack += delta * JET_RECOVER;
		if(jetPack > 100) jetPack = 100;
	}
	
	if(player.vx > MAX_VELOCITY) {
		player.vx = MAX_VELOCITY;
	} else if(player.vx < -MAX_VELOCITY) {
		player.vx = -MAX_VELOCITY;
	} else if(Math.abs(player.vx) < MIN_VELOCITY) {
		player.vx = 0;
	}
	
	player.x += delta * player.vx;
	player.y += delta * player.vy;
	
		if(jetting) {
			if(facingRight == false) {
				jet.setMidX(player.getMidX() + 10);
				jet.setTop(player.getBottom() - 2);
			} else {
				jet.setMidX(player.getMidX() - 10);
				jet.setTop(player.getBottom() - 2);
			}
		} else {
			jet.x = -100;
			jet.y = -100;
	}	

	if(enemy.vx > 0) {
		if(enemy.getMidX() > enemyPlat.getRight()) {
			enemy.vx *= -1;
			}
		} else {
			if(enemy.getMidX() < enemyPlat.getLeft()) {
				enemy.vx *= -1;
			
		}
	}
	
	
	enemy.x += delta * enemy.vx;
	enemy.y += delta * enemy.vy;
	
}
function reset() {
	score = 0;

	jetPack = 100
	player.vx = 0;
	player.vy = 0;
	player.setLeft(0);
	player.setBottom(canvas.height);

	}

function handleCollistion() {
	airborn = true;
	sliding = false;
	
	var platform, dx, dy;
	for(var p=0; p<platforms.length; p++) {
		platform = platforms[p];
		if(collideRect(player, platform)) {
			
			dx = (platform.getMidX() - player.getMidX()) / platform.width;
			dy = (platform.getMidY() - player.getMidY()) / platform.height;

			if(Math.abs(dx) > Math.abs(dy)) {
				sliding = true
				if(dx < 0) {
					if(player.vx < 0) player.vx = 0; 
					player.setLeft(platform.getRight());
				} else {
					if(player.vx > 0) player.vx = 0; 
					player.setRight(platform.getLeft());
				}
			
			} else {
				if(dy < 0) {
				if(player.vy < 0) player.vy = 0; 
				player.setTop(platform.getBottom());
			} else {
				if(player.vy > SPLATTER_VELOCITY) {
								reset();
				} else {
					if(player.vy > 0) player.vy = 0;					
				player.setBottom(platform.getTop());
				if(Math.abs(player.vx) < EDGE_CREEP) {
					var x = player.getMidX();
					if(x < platform.getLeft()) {
						if(!inputs.right) player.vx = -EDGE_CREEP;
					} else  if(x > platform.getRight()) {
						if(!inputs.left) player.vx = EDGE_CREEP;
					}
				}
					airborn = false;
					}
				}
			}
		}
	}
	
	if(collideRect(player, target)) moveTarget();
	
	if(collideRect(player, enemy)) reset();

	
	if(player.getLeft() < 0) {
	player.setLeft (0);
	player.vx = 0;
	} else if (player.getRight() > canvas.width) {
	player.setRight(canvas.width);
	player.vx = 0;
	}


	if(player.getTop() < 0) {
	player.setTop(0);
	player.vy = 0;
	} else if (player.getBottom() > canvas.height) {
		if 	(player.vy > SPLATTER_VELOCITY) {
				reset();
		} else {
			player.setBottom(canvas.width);
			player.vy = 0;
			airborn = false;
		}
	}
}

function updateCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	ctx.font = 'bold 24px Impact';
	ctx.fillStyle = 'white';
	ctx.fillText('High score:  '+pad(highScore, SCORE_DIGITS), 30, 40);
	ctx.fillText('Score:  '+pad(score, SCORE_DIGITS), 30, 70);
	
	var bar = (jetPack / 100) * player.width;
	var color = 'green';
	if(jetPack < 50) {
		color = 'red';
	}else if(jetPack < 75) {
		color = 'yellow';
	}
	ctx.fillStyle = color;
	ctx.fillRect(player.getLeft(), player.getTop() - 10, bar, 4);
	
	drawSprite(sprites.jet, jet);

	
	var sprite;
	if(airborn) {
		if(facingRight) {
			sprite = sprites.rightJump;
		} else {
			sprite = sprites.leftJump;
			}
		} else {
			if(facingRight) {
				sprite = sprites.right;
			} else {
				sprite = sprites.left
			}
		}
				
				drawSprite(sprite, player);
				
				
	
	ctx.fillStyle='green';
	ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
	
	var platform;
	for(var p=0; p<platforms.length; p++) {
		platform = platforms[p];
		drawSprite(sprites.brick, platform);
		
		drawSprite(sprites.coin, target);
	}
}


function drawSprite(s, e) {
	ctx.drawImage(
		spritesheet, s.x, s.y, s.width, s.height, e.x, e.y, e.width, e.height
		);
}


function keyDown(e) {
	e.preventDefault();
	switch(e.keyCode) {
		case 37: //left
			inputs.left = true;
			break;
		case 38: //up
			inputs.up = true;
			break;
		case 39: //right
			inputs.right = true;
			break;
		case 40: //down
			inputs.down = true;
			break;
	}
}

function keyUp(e) {
	e.preventDefault();
	switch(e.keyCode) {
		case 37: //left
			inputs.left = false;
			break;
		case 38: //up
			inputs.up = false;
			break;
		case 39: //right
			inputs.right = false;
			break;
		case 40: //down
			inputs.down = false;
			break;
	}
}

function collideRect(a, b){
	if(a.getLeft() > b.getRight())  return false;
	
	if(a.getTop() > b.getBottom()) return false;
	
	if(a.getRight() < b.getLeft()) return false;
	
	if(a.getBottom() < b.getTop()) return false;
	
	return true;
}
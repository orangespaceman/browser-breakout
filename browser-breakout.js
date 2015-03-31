/*
 * Browser Breakout!
 *
 * Thanks to http://billmill.org/static/canvastutorial/
 *
 * petegoodman.com
 */
var browserBreakout = function() {

	/*
	 * The HTML body element
	 */
	var body = null,

	/*
	 * The canvas HTMl element
	 */
	canvas = null,

	/*
	 * The canvas draw context
	 */
	drawContext = null,

	/*
	 * The draw interval
	 */
	drawInterval = null,

	/*
	 * Reseting on browser resize
	 */
	reseting = false,

	/*
	 * Current Game State.  Can be:
	 * 'title' => Game initialised for the first time
	 * 'running' => Game is running!
	 * 'gameEnded' => Game has ended unsuccessfully
	 * 'victory' =>  Game has ended successfully
	 * 'noImages' => No appropriate images were found
	 */
	gameState = 'title',

	/*
	 * text blocks
	 */
	textBlocks = {},
	textAnimationTypes = ['default', 'vertical', 'horizontal', 'random', 'reverse'],

	/*
	 * Acceptable images to play with
	 */
	images = [],
	imagesAcceptable = 0,
	imagesRemaining = 0,

	/*
	 * Visible position (within page)
	 */
	visibleXStart = 0,
	visibleXEnd = 0,
	visibleYStart = 0,
	visibleYEnd = 0,
	visibleWidth = 0,
	visibleHeight = 0,

	/*
	 * Ball positions
	 */
	ballRadius = 7,
	ballColour = '#FFFFFF',
	ballXStart = ballX = 35,
	ballYStart = ballY = 35,
	ballDxStart = ballDx = 2,
	ballDyStart = ballDy = 2,
	ballVelocity = 3,

	/*
	 * Paddle positions
	 */
	paddleColour = '#FFFFFF',
	paddleX = 0,
	paddleY = 0,
	paddleHeight = 10,
	paddleWidth = 100,

	/*
	 * scores
	 */
	lastScore = 0,
	topScore = 0,

	/*
	 * Current canvas transparency
	 */
	canvasTransparency = 0,
	targetTransparency = 0.7,

	/*
	 * keys
	 */
	downDown = false,
	upDown = false,
	leftDown = false,
	rightDown = false,

	/*
	 * Display debug messages?
	 */
	debugMode = true,

	/*
	 * Debug timeout
	 */
	debugTimeout = null,


	/*
	 * Fix browser CSS to disable scrolling
	 */
	hideOverflow = function() {

		debug('hideOverflow()');

		body = document.getElementsByTagName('body')[0];
//		body.style.height = '100%';
//		body.style.width = '100%';
		body.style.overflow = 'hidden';
	},


	/*
	 * Create canvas element
	 */
	createCanvas = function() {

		debug('createCanvas()');

		// create canvas
		canvas = document.createElement('canvas');
		canvas.id = 'canvas';
		canvas.style.position = 'absolute';
		canvas.style.zIndex = 10000000; // hopefully that's high enough...

		setCanvasPosition();

		// add the canvas into the page
		body.appendChild(canvas);

		// get the draw context
		drawContext = canvas.getContext('2d');
	},


	/*
	 * position canvas within visible portion of the screen
	 */
	setCanvasPosition = function() {
		canvas.width = visibleWidth;
		canvas.height = visibleHeight;
		canvas.style.left = visibleXStart + 'px';
		canvas.style.top = visibleYStart + 'px';
	},


	/*
	 * Calculate visible area of page
	 */
	calculatePositions = function() {

		visibleXStart = window.pageXOffset;
		visibleYStart = window.pageYOffset;

		visibleWidth = window.innerWidth;
		visibleHeight = window.innerHeight;

		visibleXEnd = visibleWidth + visibleXStart;
		visibleYEnd = visibleHeight + visibleYStart;

		// set the ball to start within the visible frame
		ballX += visibleXStart;
		ballY += visibleYStart;
	},



	/*
	 * Retrieve all images of a reasonable size
 	 */
	collectImages = function() {

		debug('collectImages()');

		// find all images on the page
		var allImages = document.getElementsByTagName('img');

		debug('collectImages: visible frame -  X:' + visibleXStart + '-' + visibleXEnd + '; Y: ' + visibleYStart + '-' + visibleYEnd + ';');

		// loop through all images
		for (var counter = allImages.length - 1; counter >= 0; counter--){

			// get image details
			var imagePosition = findPos(allImages[counter]);
			var imageXStart = imagePosition[0] - visibleXStart;
			var imageYStart = imagePosition[1] - visibleYStart;
			var imageWidth = allImages[counter].width || allImages[counter].style.width;
			var imageHeight = allImages[counter].height || allImages[counter].style.height;

			// condition : test all images are large enough to be worth using
			if (imageWidth > 20 && imageHeight > 20) {


				// condition : if image is within visible (& safe) viewable area, use it
				if (
					imageXStart  > (paddleHeight*2) &&
					imageYStart  > (paddleHeight*2) &&
					(visibleXStart + imageXStart + imageWidth) < visibleXEnd - (paddleHeight*2) &&
					(visibleYStart + imageYStart + imageHeight) < visibleYEnd - (paddleHeight*2)
				) {

					images.push({
						'imageXStart' : imageXStart,
						'imageYStart' : imageYStart,
						'imageWidth' : imageWidth,
						'imageHeight' : imageHeight,
						'image' : allImages[counter],
						'state' : 1,
						'visible' : 0
					});
				}
			}
		}

		// store values for later use
		imagesAcceptable = imagesRemaining = images.length;

		debug('collectImages: - found ' + imagesAcceptable + ' out of ' + allImages.length);
	},


	/*
	 * findpos - find an element's exact co-ordinates on a page
	 * from : http://www.quirksmode.org/js/findpos.html
	 */
	findPos = function(obj) {
		var curleft = curtop = 0;
		if (obj.offsetParent) {
			while (obj.offsetParent) {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
				obj = obj.offsetParent;
			}
		}
		return [curleft,curtop];
	},


	/*
	 * keyboard navigation detection
	 */
	onKeyDown = function(evt) {

		if (!evt) { evt = window.event; }

		if (evt.keyCode == 40) {
			downDown = true;
		} else if (evt.keyCode == 38) {
			upDown = true;
		}

		if (evt.keyCode == 39) {
			rightDown = true;
		} else if (evt.keyCode == 37) {
			leftDown = true;
		}
	},


	/*
	 * keyboard navigation detection
	 */
	onKeyUp = function(evt) {

		if (!evt) { evt = window.event; }

		if (evt.keyCode == 40) {
			downDown = false;
		} else if (evt.keyCode == 38) {
			upDown = false;
		}

		if (evt.keyCode == 39) {
			rightDown = false;
		} else if (evt.keyCode == 37) {
			leftDown = false;
		}
	},


	/*
	 * mouse navigation detection
	 */
	onMouseMove = function(evt) {

		if (!evt) { evt = window.event; }

		if (evt.pageX > 0 && evt.pageX < visibleXStart + visibleWidth) {
			paddleX = Math.max(evt.pageX - visibleXStart - (paddleWidth/2), 0);
			paddleX = Math.min(canvas.width - paddleWidth, paddleX);
	  	}

		if (evt.pageY > 0 && evt.pageY < visibleYStart + visibleHeight) {
			paddleY = Math.max(evt.pageY - visibleYStart - (paddleWidth/2), 0);
			paddleY = Math.min(canvas.height - paddleWidth, paddleY);
	  	}
	},


	/*
	 * mouse clicking
	 */
	onMouseClick = function(evt) {

		if (!evt) { evt = window.event; }

		// only used to start a game, so detect if we're waiting for this
		if (gameState != 'running') {

			if (imagesAcceptable == 0) {
				updateGameState('noImages');
			} else {
				updateGameState('running');
			}
		}
	},



	/*
	 * draw bg
	 */
	drawBg = function() {
		drawContext.clearRect(0, 0, canvas.width, canvas.height);
		drawContext.fillStyle = 'rgba(0, 0, 0, '+canvasTransparency+')';
		drawContext.fillRect(0, 0, canvas.width, canvas.height);
	},


	/*
	 * create titles
	 */
	drawTitle = function() {
		if (!textBlocks.titleBlock) {
			textBlocks.titleBlock = new CanvasLetters({
				textString:'Browser',
				name: 'titleBlock',
				x: 25,
				y: 25,
				blockSize: 10,
				animate:true,
				ordering:textAnimationTypes[Math.round(Math.random()*textAnimationTypes.length-1)]
			});
		}
		if (!textBlocks.subTitleBlock) {
			textBlocks.subTitleBlock = new CanvasLetters({
				textString:'Breakout',
				name: 'subTitleBlock',
				x: 25,
				y: 125,
				blockSize: 10,
				animate:true,
				ordering:textAnimationTypes[Math.round(Math.random()*textAnimationTypes.length-1)]
			});
		}
	},


	/*
	 * create play now text
	 */
	drawPlayNow = function() {
		if (!textBlocks.playNow) {
			textBlocks.playNow = new CanvasLetters({
				textString:'Click to play',
				name:'playNow',
				x: 25,
				y: 250,
				blockSize: 5
			});
		}
	},


	/*
	 * create top scores
	 */
	drawTopScores = function() {
		if (!textBlocks.lastScore) {
			textBlocks.lastScore = new CanvasLetters({
				textString:'Last score - ' + lastScore,
				name:'lastScore',
				x: 25,
				y: -25,
				blockSize: 2,
				clearance: 2
			});
		}

		if (!textBlocks.topScore) {
			textBlocks.topScore = new CanvasLetters({
				textString:'Top score - ' + topScore,
				name:'topScore',
				x: 25,
				y: -50,
				blockSize: 2,
				clearance: 2
			});
		}
	},


	/*
	 * create creds
	 */
	drawCreds = function() {
		if (!textBlocks.creds) {
			textBlocks.creds = new CanvasLetters({
				textString:'petegoodman.com',
				name:'creds',
				x: -25,
				y: -25,
				blockSize: 2,
				clearance: 2
			});
		}
	},


	/*
	 * create in-game scores
	 */
	drawScore = function() {
		if (!textBlocks.score) {
			textBlocks.score = new CanvasLetters({
				textString:'Score - ' + (imagesAcceptable - imagesRemaining),
				name:'score',
				x: 25,
				y: -25,
				blockSize: 2,
				clearance: 2
			});
		}

		if (!textBlocks.remaining) {
			textBlocks.remaining = new CanvasLetters({
				textString:'Blocks Remaining - ' + imagesRemaining,
				name:'remaining',
				x: -25,
				y: -25,
				blockSize: 2,
				clearance: 2
			});
		}
	},


	/*
	 * create game end message
	 */
	drawLoseMessage = function() {
		if (!textBlocks.loseMessage) {
			textBlocks.loseMessage = new CanvasLetters({
				textString:'You Lose',
				name:'loseMessage',
				x: -25,
				y: 25,
				blockSize: 5,
				clearance: 5
			});
		}
	},


	/*
	 * create game end message
	 */
	drawWinMessage = function() {
		if (!textBlocks.winMessage) {
			textBlocks.winMessage = new CanvasLetters({
				textString:'You Win!',
				name:'winMessage',
				x: -25,
				y: 25,
				blockSize: 5,
				clearance: 5
			});
		}
	},


	/*
	 * create no images message
	 */
	drawNoImagesMessage = function() {
		if (!textBlocks.noImages) {
			textBlocks.noImages = new CanvasLetters({
				textString:'No suitable images found',
				name:'noImages',
				x: 25,
				y: 400,
				blockSize: 5,
				clearance: 5
			});
		}
	},


	/*
	 * draw text blocks - called every time by the draw() loop
	 */
	drawBlocks = function() {
		for (textBlock in textBlocks){
			if (textBlocks[textBlock].isActive()) {
				textBlocks[textBlock].drawBlocks();
			}
		};
	},


	/*
	 * Change the game state -
	 * resets blocks and game parameters
	 */
	updateGameState = function(state) {

		// reset game state
		drawBg();
		removeAllText();
		updateHighScore();
		gameState = state;
		ballX = ballXStart;
		ballY = ballYStart;
		ballDx = ballDxStart;
		ballDy = ballDyStart;

		// reset images
		for (var i = images.length - 1; i >= 0; i--){
			images[i].state = 1;
			images[i].visible = 0;
		}

		// reset text
		if (state != 'running') {
			textBlocks.titleBlock.setActiveVal(1);
			textBlocks.subTitleBlock.setActiveVal(1);
			textBlocks.creds.setActiveVal(1);
			textBlocks.lastScore.updateString('Last score - ' + lastScore);
			textBlocks.topScore.updateString('Top score - ' + topScore);

			// condition : show optional extra message
			if (state == 'noImages') {
				if (!!textBlocks.noImages) {
					textBlocks.noImages.setActiveVal(1);
				}
			} else if (state == 'gameEnded') {
				if (!!textBlocks.loseMessage) {
					textBlocks.loseMessage.setActiveVal(1);
				}
			} else if (state == 'victory') {
				if (!!textBlocks.winMessage) {
					textBlocks.winMessage.setActiveVal(1);
				}
			}
		} else {
			if (!!textBlocks.score && !!textBlocks.remaining) {
				textBlocks.score.updateString('Score - ' + (imagesAcceptable - imagesRemaining));
				textBlocks.remaining.updateString('Blocks Remaining - ' + imagesRemaining);
			}
		}

		imagesRemaining = imagesAcceptable;
		debug('changed gameState to ' + state);
	},


	/*
	 * Remove all existing text
	 */
	removeAllText = function() {

		// reset all blocks ready to be redrawn
		for (textBlock in textBlocks){
			textBlocks[textBlock].setActiveVal(0);
		}
	},



	/*
	 * During the game, when a block has been hit, update the score
	 */
	updateScore = function() {
		imagesRemaining--;
		textBlocks.score.updateString('Score - ' + (imagesAcceptable - imagesRemaining));
		textBlocks.remaining.updateString('Blocks Remaining - ' + imagesRemaining);
	},


	/*
	 * When the game is complete, check whether this is a high score
	 */
	updateHighScore = function() {
		lastScore = imagesAcceptable - imagesRemaining;
		if (lastScore > topScore) {
			topScore = lastScore;
		}
	},


	/*
	 * draw images
	 */
	drawImages = function() {

		for (var counter = images.length - 1; counter >= 0; counter--){
			var image = images[counter];

			// condition : detect collision
			if (
				image.state == 1 &&
				ballX > image.imageXStart && ballX < image.imageXStart + image.imageWidth &&
				ballY > image.imageYStart && ballY < image.imageYStart + image.imageHeight
			) {

				// detect hit placement
				var hit = [
					{ dir: 'top', val: ballY - image.imageYStart },
					{ dir: 'bottom', val: (image.imageYStart+image.imageHeight) - ballY },
					{ dir: 'left', val: ballX - image.imageXStart },
					{ dir: 'right', val: (image.imageXStart+image.imageWidth) - ballX }
				];

				// sort to find where it hit
				function sortByLowest(a, b) {
				    var x = a.val;
				    var y = b.val;
				    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				}
				hit.sort(sortByLowest);

				if (hit[0].dir == 'top' || hit[0].dir == 'bottom') {
					ballDy = -ballDy;
				} else {
					ballDx = -ballDx;
				}


				updateScore();
				image.state = 0;
			}


			// condition : if the still image exists, display it!
			if (image.state == 1) {
				drawContext.drawImage(image.image, image.imageXStart, image.imageYStart);
			}
		};
	},


	/*
	 * draw the ball
	 */
	drawBall = function() {

		// condition : adjust velocity for slow-moving ball
		var v = ballVelocity;
		if (Math.abs(ballDx) < 1 || Math.abs(ballDy) < 1) { v +=1; }
		if (Math.abs(ballDx) < 1 && Math.abs(ballDy) < 1) { v +=1; }
		if (Math.abs(ballDx) < 0.75 && Math.abs(ballDy) < 0.75) { v +=1; }
		if (Math.abs(ballDx) < 0.5 && Math.abs(ballDy) < 0.5) { v +=1; }

		// set new ball position
		ballX += v * ballDx;
		ballY += v * ballDy;

		// draw new ball
		drawContext.fillStyle = ballColour;
		drawCircle(ballX, ballY, ballRadius);
	},


	/*
	 * draw the four paddles around the edge
	 */
	drawPaddles = function() {

		// calculate whether to move paddles
		if (rightDown) {
			paddleX += 20;
		} else if (leftDown) {
			paddleX -= 20;
		}

		if (downDown) {
			paddleY += 20;
		} else if (upDown) {
			paddleY -= 20;
		}

		if (paddleX < 0) { paddleX = 0; }	//left
		if (paddleX > visibleWidth-paddleWidth) { paddleX=visibleWidth-paddleWidth; }	// right
		if (paddleY < 0) { paddleY = 0; }	// top
		if (paddleY > visibleHeight-paddleWidth) { paddleY=visibleHeight-paddleWidth; }	// bottom


		drawContext.fillStyle = 'rgba(0, 0, 0, '+canvasTransparency+')';


		// calculate bottom paddle hit detection
		if (ballY + ballDy + ballRadius > visibleHeight - paddleHeight) {
			if (ballX > paddleX && ballX < paddleX + paddleWidth) {
				ballDx = 5 * ((ballX - (paddleX + paddleWidth / 2)) / paddleWidth);
				ballDy = -ballDy;
				debug('Bottom Paddle Hit - Dx: ' + ballDx + '; Dy: ' + ballDy);
			}
		}


		// calculate top paddle hit detection
		if (ballY + ballDy - ballRadius < paddleHeight) {
			if (ballX > paddleX && ballX < paddleX + paddleWidth) {
				ballDx = 5 * ((ballX - (paddleX + paddleWidth / 2)) / paddleWidth);
				ballDy = -ballDy;
				debug('Top Paddle Hit - Dx: ' + ballDx + '; Dy: ' + ballDy);
			}
		}


		// calculate right paddle hit detection
		if (ballX + ballDx + ballRadius > visibleWidth - paddleHeight) {
			if (ballY > paddleY && ballY < paddleY + paddleWidth) {
				ballDy = 5 * ((ballY - (paddleY + paddleWidth / 2)) / paddleWidth);
				ballDx = -ballDx;
				debug('Right Paddle Hit: ' + ballDx + '; Dy: ' + ballDy);
			}
		}


		// calculate left paddle hit detection
		if (ballX + ballDx - ballRadius < paddleHeight) {
			if (ballY > paddleY && ballY < paddleY + paddleWidth) {
				ballDy = 5 * ((ballY - (paddleY + paddleWidth / 2)) / paddleWidth);
				ballDx = -ballDx;
				debug('Left Paddle Hit: ' + ballDx + '; Dy: ' + ballDy);
			}
		}


		// draw paddles
		drawContext.fillStyle = paddleColour;
		drawRectangle(paddleX, 0, paddleWidth, paddleHeight); 				// top
		drawRectangle(paddleX, visibleHeight - paddleHeight, paddleWidth, paddleHeight); 	// bottom
		drawRectangle(0, paddleY, paddleHeight, paddleWidth); 				// left
		drawRectangle(visibleWidth - paddleHeight, paddleY, paddleHeight, paddleWidth); 	// right
	},


	/*
	 * draw a circle
	 */
	drawCircle = function(x,y,r) {
	  drawContext.beginPath();
	  drawContext.arc(x, y, r, 0, Math.PI*2, true);
	  drawContext.closePath();
	  drawContext.fill();
	},


	/*
	 * draw a rectangle
	 */
	drawRectangle = function(x,y,w,h) {
	  drawContext.beginPath();
	  drawContext.rect(x,y,w,h);
	  drawContext.closePath();
	  drawContext.fill();
	},


	/*
	 * Draw method called by the loop
	 */
	draw = function() {

		// condition : detect game state
		switch (gameState) {

			// show title screen?
			case 'title' : case 'gameEnded' : case 'victory' : case 'noImages' :

				// draw background (with initial fade in)
				if (canvasTransparency < targetTransparency) {
					canvasTransparency +=0.1;
					drawBg();

				// bg is faded in, show title screen
				} else {

					// show title
					drawTitle();

					// show play now text
					drawPlayNow();

					// display scores
					drawTopScores();

					// display creds
					drawCreds();

					// draw above text
					drawBlocks();


					// condition : if we've just lost, show message
					if (gameState == 'gameEnded') {

						drawLoseMessage();

					// show VICTORY message
					} else if (gameState == 'victory') {

						drawWinMessage();

					// show NO IMAGES message
					} else if (gameState == 'noImages') {

						drawNoImagesMessage();

					}
				}

			break;


			// game is in progress?
			case 'running' :

				drawBg();

				// draw ball
				drawBall();

				// draw score
				drawScore();

				// draw images
				drawImages();

				// draw paddles
				drawPaddles();

				// if text needs drawing, draw it
				drawBlocks();


				// calculate game state
				if (imagesRemaining == 0) {
					updateGameState('victory');
				}

				if (
					ballX + ballDx + ballRadius > visibleWidth ||	// right
					ballX + ballDx - ballRadius < 0 ||	// left
					ballY + ballDy + ballRadius > visibleHeight ||	// bottom
					ballY + ballDy - ballRadius < 0 	// top
				) {
					updateGameState('gameEnded');
				}


			break;
		}
	},


	/*
	 * Debug
	 * output debug messages
	 *
	 * @return void
	 * @private
	 */
	debug = function(content) {
		if (!!debugMode) {
			console.log(content);
			clearTimeout(debugTimeout);
			debugTimeout = setTimeout(debugSpacer, 2000);
		}
	},
	debugSpacer = function() {
		if (!!debugMode) {
			console.log('----------------------------------------------------------------------------------');
		}
	},


	 /*
	 * initialisation method
	 */
	init = function(){

		debug('init()');


		// fix browser CSS to disable scrolling
		hideOverflow();


		// calculate browser positions
		calculatePositions();


		// retrieve all images of a reasonable size
		collectImages();


		// create canvas element
		if (!canvas) {
			createCanvas();
		}


		// set up listeners for keys and mouse...
		document.onmousemove = function(e) {
			onMouseMove(e);
		};
		document.onkeydown = function(e) {
			onKeyDown(e);
		};
		document.onkeyup = function(e) {
			onKeyUp(e);
		};
		document.onclick = function(e) {
			onMouseClick(e);
		};
		document.onkeypress = function(e) {
			onMouseClick(e);

			// stop browser scrolling on click
			if (!e) { e = window.event; }
			if (e.keyCode == 40 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 37) {
				return false;
			}

			// escape or X - remove canvas
			if (e.keyCode == 27 || e.keyCode == 120) {
				canvas.parentNode.removeChild(canvas);
				//return false;
			}
		};


		// draw!
		drawInterval = setInterval(draw, 25);
	},


	/*
	 * reset game (on browser resize)
	 */
	resetGame = function() {
		if (!reseting) {
			reseting = true;
			clearInterval(drawInterval);
			debug('game reset');
			updateGameState('title');
			canvasTransparency = 0;
			images = [];
			imagesAcceptable = 0;
			calculatePositions();
			setCanvasPosition();
			init();
		}
		reseting = false;
	};


	/*
	 * restart on resize
	 */
	window.onresize = function() {
		resetGame();
	};





	/*
	 * Canvas Letters - used for in-game text
	 *
	 * petegoodman.com
	 */
	var CanvasLetters = function(initOptions) {

		/*
		 * Array of blocks to draw
		 */
		var blocks = [],
		blockCount = 0,

		/*
		 * current block drawing details
		 */
		currentX = 0,
		currentY = 0,
		currentBlock = 0,
		lineCount = 1,

		/*
		 * Character block dimensions
		 */
		characterBlockWidth = 5,
		characterBlockHeight = 7,

		/*
		 * the (potentially modified) text string we're drawing
		 */
		textString = '',

		/*
		 * Characters
		 */
		characters = {
			'a': [0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,1,1,0,0,0,1],
			'b': [1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,0],
			'c': [0,1,1,1,0,1,0,0,0,1,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,1,1,1,0],
			'd': [1,1,1,0,0,1,0,0,1,0,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,1,0,1,1,1,0,0],
			'e': [1,1,1,1,1,1,0,0,0,0,1,0,0,0,0,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,1,1,1,1],
			'f': [1,1,1,1,1,1,0,0,0,0,1,0,0,0,0,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0],
			'g': [0,1,1,1,0,1,0,0,0,1,1,0,0,0,0,1,0,1,1,1,1,0,0,0,1,1,0,0,0,1,0,1,1,1,1],
			'h': [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1],
			'i': [1,1,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1,1,1,1,1],
			'j': [1,1,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1,1,1,0,0],
			'k': [1,0,0,0,1,1,0,0,1,0,1,0,1,0,0,1,1,0,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0,0,1],
			'l': [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,1,1,1,1],
			'm': [1,0,0,0,1,1,1,0,1,1,1,0,1,0,1,1,0,1,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1],
			'n': [1,0,0,0,1,1,0,0,0,1,1,1,0,0,1,1,0,1,0,1,1,0,0,1,1,1,0,0,0,1,1,0,0,0,1],
			'o': [0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			'p': [1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0],
			'q': [0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,1,0,1,1,0,0,1,0,0,1,1,0,1],
			'r': [1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,0,1,0,1,0,0,1,0,0,1,0,1,0,0,0,1],
			's': [0,1,1,1,0,1,0,0,0,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			't': [1,1,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
			'u': [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			'v': [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,0,1,0,1,0,0,1,0,1,0,0,0,1,0,0,0,0,1,0,0],
			'w': [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,1,0,1,0],
			'x': [1,0,0,0,1,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,1,0,0,0,1],
			'y': [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
			'z': [1,1,1,1,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,1,1,1,1],
			'0': [0,1,1,1,0,1,0,0,0,1,1,0,0,1,1,1,0,1,0,1,1,1,0,0,1,1,0,0,0,1,0,1,1,1,0],
			'1': [0,0,1,0,0,0,1,1,0,0,1,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1,1,1,1,1],
			'2': [0,1,1,1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1,1,1,1],
			'3': [0,1,1,1,0,1,0,0,0,1,0,0,0,0,1,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			'4': [0,0,0,1,0,0,0,1,1,0,0,1,0,1,0,1,0,0,1,0,1,1,1,1,1,0,0,0,1,0,0,0,0,1,0],
			'5': [1,1,1,1,1,1,0,0,0,0,1,0,0,0,0,1,1,1,1,0,0,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			'6': [0,0,1,1,0,0,1,0,0,0,1,0,0,0,0,1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			'7': [1,1,1,1,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0],
			'8': [0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			'9': [0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,0,1,1,1,1,0,0,0,0,1,0,0,0,1,0,0,1,1,0,0],
			'-': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
			'?': [0,1,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0],
			'!': [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0],
			'@': [0,1,1,1,0,1,0,0,0,1,1,0,1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,0,0,1,0,1,1,1,0],
			'&': [0,1,1,0,0,1,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,1,0,0,1,0,0,1,1,0,1],
			'.': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0],
			' ': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
		},



		/*
		 * default options
		 * (the ones to copy from if an option isn't specified specifically)
		 */
		defaults = {
			blockColour : 'ff9900',
			blockSize : 10,
			textString : '...',
			clearance : 10,
			ordering : 'default',
			animate : false,
			name : null,
			active : 1,
			x : 0,
			y : 0
		},

		/*
		 * config options
		 * (the combined options, the ones to use)
		 */
		options = {},


		/*
		 * save any options sent through to the intialisation script, if set
		 */
		saveOptions = function() {
			for (var option in defaults) {
				if (!!initOptions[option]) {
					options[option] = initOptions[option];
				} else {
					options[option] = defaults[option];
				}
			}
		},


		/*
		 * condition : is this textBlock active?
		 */
		isActive = function() {
			return options.active;
		},


		/*
		 * condition : is this textBlock active?
		 */
		setActiveVal = function(val) {
			options.active = val;
			if (!!options.animate) {
				currentBlock = 0;
			}
		},


		/*
		 * condition : redraw new string
		 */
		updateString = function(str) {
			debug('updateString');
			options.textString = str;
			setActiveVal(1);
			startLetters();
		},


		/*
		 * Start letters
		 */
		startLetters = function() {

			// init values
			lineCount = 1;
			currentBlock = 0;
			blocks = [];
			blockCount = 0;

			if (options.x < 0) {
				currentX = visibleWidth - (options.blockSize*characterBlockHeight*(options.textString.length-1)) + options.x;
			} else {
				currentX = options.x + 0;
			}

			if (options.y < 0) {
				currentY = visibleHeight - options.clearance - (options.blockSize*characterBlockHeight) + options.y;
			} else {
				currentY = options.y + 0;
			}

			fixTextLength();
			calculateBlockPositions();

			// if we're not animating, show everything at once
			if (!options.animate) {
				currentBlock = blocks.length;
			}

			// add this into the queue of text to be drawn
			if (!!textBlocks['options.name']) {
				textBlocks['options.name'].setActiveVal(1);
			}
			debug('adding ' + options.name + ' to queue');
		},



		/*
		 *
		 */
		fixTextLength = function() {

			textString = options.textString.toLowerCase();

			// calculate line length
			var lineLength = Math.floor( ( canvas.width - options.clearance ) / ( ( characterBlockWidth * options.blockSize ) + options.clearance ) );

			// test each word invidivually
			textStringArray = textString.split(' ');
			for (var counter = textStringArray.length - 1; counter >= 0; counter--){

				// if any words are longer than the line-length, hyphenate
				if (textStringArray[counter].length > lineLength) {

					var originalWord = word = textStringArray[counter];
					var wordArray = [];

					// split the word every time it hits the line length
					while (word.length > lineLength) {
						wordArray.push(word.substr(0, lineLength-1));
						word = word.substr(lineLength-1);
					}
					wordArray.push(word);

					textString = textString.replace(originalWord, wordArray.join('- '));
				}
			};
		},



		/*
		 *
		 */
		calculateBlockPositions = function() {

			// draw the text string
			for (var character = 0, textStringLength = textString.length; character < textString.length; character++) {

				// if we can draw this letter, begin
				if (!!characters[textString[character]]) {

					// if this isn't the first character, work out how far along the line to put it
					if (character > 0) {
						currentX += (options.blockSize * characterBlockWidth) + options.clearance;
					}

					// find the position of the next space (to calculate the word length)
					var nextSpacePosition = textString.indexOf(' ', character);
					if (nextSpacePosition == -1) { nextSpacePosition = textStringLength; }

					// start working out where to place the new letter/word
					var newLineRequired = false;


					// condition : is this word going to fit on the current line?
					if (currentX + (options.blockSize * (characterBlockWidth*(nextSpacePosition-character))) + (options.clearance*(nextSpacePosition-character)) > canvas.width - options.clearance) {
						newLineRequired = true;
					}


					// condition : start a new line?
					if (newLineRequired && textString[character] != ' ') {
						currentX = options.clearance;
						currentY = (lineCount*(characterBlockHeight*options.blockSize)) + (options.clearance*++lineCount);
					}


					// get the blocks for this character
					var blockArray = characters[textString[character]];

					// for each block within a character
					for (var block = 0, blockArrayLength = blockArray.length; block < blockArrayLength; block++) {

						// calculate X & Y positions for each block
						var x = currentX;
						var y = currentY;
						x += (options.blockSize * (block % characterBlockWidth));
						if (block >= characterBlockWidth) {
							y += (options.blockSize*(Math.floor(block/characterBlockWidth)));
						}

						// if we're drawing a block, add it to the array
						if (blockArray[block] == 1) {
							blocks.push({x:x,y:y,opacity:0});
						}
					}
				}
			}

			// condition : change order of appearing blocks
			switch (options.ordering) {
				case 'vertical':
					function vertical(a, b) { return a.y - b.y; }
					blocks.sort(vertical);
				break;

				case 'horizontal':
					function horizontal(a, b) { return a.x - b.x; }
					blocks.sort(horizontal);
				break;

				case 'reverse':
					blocks.reverse();
				break;

				case 'random':
					function randOrd(){ return (Math.round(Math.random())-0.5); }
					blocks.sort(randOrd);
				break;
			}


			blockCount = blocks.length;
		},


		/*
		 *
		 */
		drawBlocks = function() {

			// normal direction, add blocks
			var drawColour = options.blockColour;

			// calculate which blocks to work on
			var animateLimit = (!!options.animate) ? currentBlock-10 : 0;

			// loop through blocks and draw!
			for (var counter = animateLimit; counter < currentBlock; counter++) {
				if (!!blocks[counter]) {
					if (blocks[counter].opacity < 1) { blocks[counter].opacity += 0.1; }
					drawContext.fillStyle = 'rgba('+HexToRGB(drawColour)+', '+blocks[counter].opacity+')';
					drawRectangle(blocks[counter].x, blocks[counter].y, options.blockSize, options.blockSize);
				}
			};

			// add one to loop
			currentBlock++;

			// calculate whether to end the drawing
			if (currentBlock == blockCount+10) {

				// remove this from the queue of to be drawn
				debug('finished drawing ' + options.textString);
			}
		},


		/*
		 * Turn Hex into RGB, for block colour
		 */
		HexToRGB = function(h) {return HexToR(h) +','+HexToG(h)+','+HexToB(h);},
		HexToR = function(h) {return parseInt((cutHex(h)).substring(0,2),16);},
		HexToG = function(h) {return parseInt((cutHex(h)).substring(2,4),16);},
		HexToB = function(h) {return parseInt((cutHex(h)).substring(4,6),16);},
		cutHex = function(h) {return (h.charAt(0)=='#') ? h.substring(1,7):h;},



		/*
		 * initialisation method
		 */
		__init = function(){

			// save the init options
			saveOptions();

			debug('drawing ' + options.textString);

			// init canvas set-up
			startLetters();

		}();


		/*
		 * expose public methods
		 */
		return {
			init: init,
			isActive : isActive,
			setActiveVal : setActiveVal,
			drawBlocks: drawBlocks,
			updateString: updateString
		};
	};


	// start the game!
	init();

}();
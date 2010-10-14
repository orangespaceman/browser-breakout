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
	textBlocksToAnimate = [],
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
	ballColour = "#FFFFFF",
	ballXStart = ballX = 35,
	ballYStart = ballY = 35,
	ballDxStart = ballDx = 6,
	ballDyStart = ballDy = 4,
	
	/*
	 * Paddle positions
	 */
	paddleColour = "#FFFFFF",
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
		
		debug("hideOverflow()");
		
		body = document.getElementsByTagName('body')[0];
		//body.style.height = "100%";
		body.style.overflow = "hidden";
	},
	
	
	/*
	 * Create canvas element
	 */
	createCanvas = function() {
		
		debug("createCanvas()");
		
		// create canvas
		canvas = document.createElement('canvas');
		canvas.id = "canvas";
		canvas.width = document.body.offsetWidth;
		canvas.height = document.body.offsetHeight;
		canvas.style.position = "absolute";
		canvas.style.zIndex = 10000000; // hopefully that's high enough...
		canvas.style.left = 0;
		canvas.style.top = 0;
		
		// add the canvas into the page
		body.appendChild(canvas);
		
		// get the draw context
		drawContext = canvas.getContext("2d");
	},
	
	
	/*
	 * Calculate visible area of page
	 */
	calculatePositions = function() {

		visibleXStart = window.pageXOffset;
		visibleXEnd = document.documentElement.clientWidth + visibleXStart;
		visibleYStart = window.pageYOffset;
		visibleYEnd = document.documentElement.clientHeight + visibleYStart;
		visibleWidth = visibleXEnd - visibleXStart;
		visibleHeight = visibleYEnd - visibleYStart;
		
		// set the ball to start within the visible frame
		ballX += visibleXStart;
		ballY += visibleYStart;
	},
	
	
	
	/*
	 * Retrieve all images of a reasonable size 
 	 */
	collectImages = function() {
		
		debug("collectImages()");
	
		// find all images on the page
		var allImages = document.getElementsByTagName('img');
		
		debug("collectImages: visible frame -  X:" + visibleXStart + "-" + visibleXEnd + "; Y: " + visibleYStart + "-" + visibleYEnd + ";");

		// loop through all images
		for (var counter = allImages.length - 1; counter >= 0; counter--){
						
			// get image details
			var imagePosition = findPos(allImages[counter]);
			var imageXStart = imagePosition[0];
			var imageYStart = imagePosition[1];
			var imageWidth = allImages[counter].style.width || allImages[counter].width;
			var imageHeight = allImages[counter].style.height || allImages[counter].height;

			// condition : test all images are large enough to be worth using
			if (imageWidth > 20 && imageHeight > 20) {

				//debug(images[counter]);
				//debug("comparing " + imageXStart + " > " + (visibleXStart + (paddleHeight*2)));
				//debug("comparing " + imageYStart +" > " + (visibleYStart + (paddleHeight*2)));
				//debug("comparing " + (imageXStart + imageWidth) + " < " + (visibleXEnd - (paddleHeight*2)));
				//debug("comparing " + (imageYStart + imageHeight) + " < " + (visibleYEnd - (paddleHeight*2)));
				//debugSpacer();

				// condition : if image is within visible (& safe) viewable area, use it
				if (
					imageXStart  > visibleXStart + (paddleHeight*2) &&
					imageYStart  > visibleYStart + (paddleHeight*2) &&
					(imageXStart + imageWidth) < visibleXEnd - (paddleHeight*2) &&
					(imageYStart + imageHeight) < visibleYEnd - (paddleHeight*2)
				) {
					images.push({
						'imageXStart' : imageXStart,
						'imageYStart' : imageYStart,
						'imageWidth' : imageWidth,
						'imageHeight' : imageHeight,
						'image' : allImages[counter],
						'state' : 1,
						'opacity' : 0
					});
				}
			}
		}
		
		// store values for later use
		imagesAcceptable = imagesRemaining = images.length;
		
		debug("collectImages: - found " + imagesAcceptable + " out of " + allImages.length);
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
		
		if (evt.pageX > visibleXStart && evt.pageX < visibleXEnd) {
			paddleX = Math.max(evt.pageX - visibleXStart - (paddleWidth/2), 0);
			paddleX = Math.min(canvas.width - paddleWidth, paddleX);
	  	}
	
		if (evt.pageY > visibleYStart && evt.pageY < visibleYEnd) {
			paddleY = Math.max(evt.pageY - visibleYStart - (paddleWidth), 0);
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
		drawContext.fillStyle = "rgba(0, 0, 0, "+canvasTransparency+")";
		drawContext.fillRect(0, 0, canvas.width, canvas.height);
	},
	
		
	/*
	 * draw title
	 */
	drawTitle = function() {
		if (!textBlocks.titleBlock) {
			textBlocks.titleBlock = new CanvasLetters({
				textString:"Browser",
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
				textString:"Breakout",
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
	 * draw play now button
	 */
	drawPlayNow = function() {
		if (!textBlocks.playNow) {
			textBlocks.playNow = new CanvasLetters({
				textString:"Click to play",
				name:'playNow',
				x: 25,
				y: 250,
				blockSize: 5
			});
		}
	},
	
	
	/*
	 * draw top scores
	 */
	drawTopScores = function() {
		if (!textBlocks.lastScore) {
			textBlocks.lastScore = new CanvasLetters({
				textString:"Last score - " + lastScore,
				name:'lastScore',
				x: 25,
				y: -25,
				blockSize: 2,
				clearance: 2
			});
		}
		
		if (!textBlocks.topScore) {
			textBlocks.topScore = new CanvasLetters({
				textString:"Top score - " + topScore,
				name:'topScore',
				x: -25,
				y: -25,
				blockSize: 2,
				clearance: 2
			});
		}
	},
	
	
	/*
	 * draw top scores
	 */
	drawScore = function() {
		if (!textBlocks.score) {
			textBlocks.score = new CanvasLetters({
				textString:"Score - " + (imagesAcceptable - imagesRemaining),
				name:'score',
				x: 25,
				y: -25,
				blockSize: 2,
				clearance: 2
			});
		}
		
		if (!textBlocks.remaining) {
			textBlocks.remaining = new CanvasLetters({
				textString:"blocks remaining - " + imagesRemaining,
				name:'remaining',
				x: -25,
				y: -25,
				blockSize: 2,
				clearance: 2
			});
		}
	},
	
	
	/*
	 * draw end message
	 */
	drawEndMessage = function() {
		if (!textBlocks.youLost) {
			textBlocks.youLost = new CanvasLetters({
				textString:"You Lost",
				name:'youLost',
				x: -25,
				y: 25,
				blockSize: 5,
				clearance: 5
			});
		}
	},


	/*
	 * draw victory message
	 */
	drawVictoryMessage = function() {
		if (!textBlocks.youWon) {
			textBlocks.youWon = new CanvasLetters({
				textString:"You Won!",
				name:'youWon',
				x: -25,
				y: 25,
				blockSize: 5,
				clearance: 5
			});
		}
	},
	
	
	/*
	 * draw no images message
	 */
	drawNoImagesMessage = function() {
		if (!textBlocks.noImages) {
			textBlocks.noImages = new CanvasLetters({
				textString:"No suitable images found",
				name:'noImages',
				x: 25,
				y: 400,
				blockSize: 5,
				clearance: 5
			});
		}
	},
	
	
	/*
	 *
	 */
	drawBlocks = function() {
		for (var i = textBlocksToAnimate.length - 1; i >= 0; i--){
			textBlocks[textBlocksToAnimate[i]].drawBlocks();
		};
	},
	
	
	/*
	 *
	 */
	resetBlocks = function() {
		
		// reset all blocks ready to be redrawn
		for (var i = textBlocksToAnimate.length - 1; i >= 0; i--){
			//textBlocks[textBlocksToAnimate[i]].resetBlocks();
			//textBlocks[textBlocksToAnimate[i]] = null;
			delete textBlocks[textBlocksToAnimate[i]];
		};
		
		// remove text blocks that needed animating
		textBlocksToAnimate = [];
	},
	
	
	/*
	 *
	 */
	updateGameState = function(state) {
		drawBg();
		resetBlocks();
		updateHighScore();
		gameState = state;
		ballX = ballXStart + visibleXStart;
		ballY = ballYStart + visibleYStart;
		ballDx = ballDxStart;
		ballDy = ballDyStart;
		for (var i = images.length - 1; i >= 0; i--){
			images[i].state = 1;
		}
		imagesRemaining = imagesAcceptable;
		debug('changed gameState to ' + state);
	},
	
	
	/*
	 * 
	 */
	updateScore = function() {
		
		// clear last score
		drawContext.clearRect(0, visibleYEnd-60, visibleWidth, 60-paddleHeight);
		drawContext.fillStyle = "rgba(0, 0, 0, "+canvasTransparency+")";
		drawContext.fillRect(0, visibleYEnd-60, visibleWidth, 60-paddleHeight);

		imagesRemaining--;
		delete textBlocks.score;
		delete textBlocks.remaining;
		drawScore();
	},
	
	
	/*
	 *
	 */
	updateHighScore = function() {
		// set scores
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
					{ dir: "top", val: ballY - image.imageYStart },
					{ dir: "bottom", val: (image.imageYStart+image.imageHeight) - ballY },
					{ dir: "left", val: ballX - image.imageXStart },
					{ dir: "right", val: (image.imageXStart+image.imageWidth) - ballX }
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
			

			// condition : fade images in to start
			if (image.state == 1 && image.opacity < 1) {
				image.opacity += 0.1;
			}
			
			// condition : fade images out when hit
			if (image.state == 0 && image.opacity > 0) {
				image.opacity -= 0.1;
			}
			
			// condition : if the still image exists, display it!
			if (image.state == 1) {				
				drawContext.drawImage(image.image, image.imageXStart, image.imageYStart);
			} else {
				drawContext.clearRect(image.imageXStart, image.imageYStart, image.imageWidth, image.imageHeight);
				drawContext.fillStyle = "rgba(0, 0, 0, "+canvasTransparency+")";
				drawRectangle(image.imageXStart, image.imageYStart, image.imageWidth, image.imageHeight);
			}
		};
	},
	
	
	/*
	 *
	 */
	drawBall = function() {

		// clear last ball
		drawContext.clearRect(ballX-ballRadius, ballY-ballRadius, ballRadius*3, ballRadius*3);
		drawContext.fillStyle = "rgba(0, 0, 0, "+canvasTransparency+")";
		drawContext.fillRect(ballX-ballRadius, ballY-ballRadius, ballRadius*3, ballRadius*3);


		// set new ball position
		ballX += ballDx;
		ballY += ballDy;
		
		
		// draw new ball
		drawContext.fillStyle = ballColour;
		drawCircle(ballX, ballY, ballRadius);
	},
	
	
	/*
	 * 
	 */
	drawPaddles = function() {
		
		// calculate whether to move paddles
		if (rightDown) {
			paddleX += 5;	
		} else if (leftDown) {
			paddleX -= 5;
		}
		
		if (downDown) {
			paddleY += 5;	
		} else if (upDown) {
			paddleY -= 5;
		}
		

		drawContext.fillStyle = "rgba(0, 0, 0, "+canvasTransparency+")";

		// hide top paddle
		drawContext.clearRect(visibleXStart, visibleYStart, visibleWidth, paddleHeight);
		drawContext.fillRect(visibleXStart, visibleYStart, visibleWidth, paddleHeight);
		
		// hide bottom paddle
		drawContext.clearRect(visibleXStart, visibleYEnd-paddleHeight, visibleWidth, paddleHeight);
		drawContext.fillRect(visibleXStart, visibleYEnd-paddleHeight, visibleWidth, paddleHeight);
			
		// hide left paddle
		drawContext.clearRect(visibleXStart, visibleYStart, paddleHeight, visibleHeight);
		drawContext.fillRect(visibleXStart, visibleYStart, paddleHeight, visibleHeight);
		
		// hide right paddle
		drawContext.clearRect(visibleXEnd-paddleHeight, visibleYStart, paddleHeight, visibleHeight);
		drawContext.fillRect(visibleXEnd-paddleHeight, visibleYStart, paddleHeight, visibleHeight);
		
		
		// calculate bottom paddle hit detection
		if (ballY + ballDy + ballRadius > visibleYEnd - paddleHeight) {
			if (ballX > visibleXStart + paddleX && ballX < visibleXStart + paddleX + paddleWidth) {
				debug("Bottom Paddle Hit");
				//ballDx = 8 * ((ballX - (paddleX + paddleWidth / 2)) / paddleWidth);
				//ballDx = -ballDx;
				ballDy = -ballDy;
			}
		}
		
		
		// calculate top paddle hit detection
		if (ballY - ballRadius < visibleYStart + paddleHeight) {
			if (ballX > visibleXStart + paddleX && ballX < visibleXStart + paddleX + paddleWidth) {
				debug("Top Paddle Hit");
				//ballDx = 8 * ((ballX - (paddleX + paddleWidth / 2)) / paddleWidth);
				//ballDx = -ballDx;
				ballDy = -ballDy;
			}
		}
		
		
		// calculate right paddle hit detection
		if (ballX + ballDx + ballRadius > visibleXEnd - paddleHeight) {
			if (ballY > visibleYStart + paddleY && ballY < visibleYStart + paddleY + paddleWidth) {
				debug("Right Paddle Hit");
				//ballDy = 8 * ((ballY - (paddleY + paddleWidth / 2)) / paddleWidth);
				//ballDy = -ballDy;
				ballDx = -ballDx;
			}
		}
		
		
		// calculate left paddle hit detection
		if (ballX - ballRadius < visibleXStart + paddleHeight) {
			if (ballY > visibleYStart + paddleY && ballY < visibleYStart + paddleY + paddleWidth) {
				debug("Left Paddle Hit");
				//ballDy = 8 * ((ballY - (paddleY + paddleWidth / 2)) / paddleWidth);
				//ballDy = -ballDy;
				ballDx = -ballDx;
			}
		}
		
		
		// draw paddles
		drawContext.fillStyle = paddleColour;
		drawRectangle(visibleXStart + paddleX, visibleYStart, paddleWidth, paddleHeight); 				// top
		drawRectangle(visibleXStart + paddleX, visibleYEnd - paddleHeight, paddleWidth, paddleHeight); 	// bottom
		drawRectangle(visibleXStart, visibleYStart + paddleY, paddleHeight, paddleWidth); 				// left
		drawRectangle(visibleXEnd - paddleHeight, visibleYStart + paddleY, paddleHeight, paddleWidth); 	// right
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
					
					// draw above text
					drawBlocks();
			
			
					// condition : if we've just lost, show message
					if (gameState == 'gameEnded') {
					
						drawEndMessage();
				
					// show VICTORY message	
					} else if (gameState == 'victory') {
					
						drawVictoryMessage();
					
					// show NO IMAGES message	
					} else if (gameState == 'noImages') {
					
						drawNoImagesMessage();
					
					}
				}
			
			break;
			
			
			// game is in progress?
			case 'running' : 
				
				// draw score
				drawScore();

				// draw images
				drawImages();

				// draw ball
				drawBall();
								
				// draw paddles
				drawPaddles();
				
				// if text needs drawing, draw it
				drawBlocks();
				
				
				// calculate game state
				if (imagesRemaining == 0) {
					updateGameState('victory');
				}
				
				if (
					ballX + ballDx + ballRadius > visibleXEnd ||	// right
					ballX + ballDx - ballRadius < visibleXStart ||	// left
					ballY + ballDy + ballRadius > visibleYEnd ||	// bottom
					ballY + ballDy - ballRadius < visibleYStart 	// top
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
			console.log("----------------------------------------------------------------------------------");
		}
	},
	
	
	 /*
	 * initialisation method
	 */
	init = function(){
		
		debug("init()");


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
			canvas.width = document.body.offsetWidth;
			canvas.height = document.body.offsetHeight;
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
		textString = "",

		/*
		 * Characters
		 */
		characters = {
			"a": [0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,1,1,0,0,0,1],
			"b": [1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,0],
			"c": [0,1,1,1,0,1,0,0,0,1,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,1,1,1,0],
			"d": [1,1,1,0,0,1,0,0,1,0,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,1,0,1,1,1,0,0],
			"e": [1,1,1,1,1,1,0,0,0,0,1,0,0,0,0,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,1,1,1,1],
			"f": [1,1,1,1,1,1,0,0,0,0,1,0,0,0,0,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0],
			"g": [0,1,1,1,0,1,0,0,0,1,1,0,0,0,0,1,0,1,1,1,1,0,0,0,1,1,0,0,0,1,0,1,1,1,1],
			"h": [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1],
			"i": [1,1,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1,1,1,1,1],
			"j": [1,1,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1,1,1,0,0],
			"k": [1,0,0,0,1,1,0,0,1,0,1,0,1,0,0,1,1,0,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0,0,1],
			"l": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,1,1,1,1],
			"m": [1,0,0,0,1,1,1,0,1,1,1,0,1,0,1,1,0,1,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1],
			"n": [1,0,0,0,1,1,0,0,0,1,1,1,0,0,1,1,0,1,0,1,1,0,0,1,1,1,0,0,0,1,1,0,0,0,1],
			"o": [0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			"p": [1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0],
			"q": [0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,1,0,1,1,0,0,1,0,0,1,1,0,1],
			"r": [1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,1,1,1,1,0,1,0,1,0,0,1,0,0,1,0,1,0,0,0,1],
			"s": [0,1,1,1,0,1,0,0,0,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			"t": [1,1,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
			"u": [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			"v": [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,0,1,0,1,0,0,1,0,1,0,0,0,1,0,0,0,0,1,0,0],
			"w": [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,1,0,1,0],
			"x": [1,0,0,0,1,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,1,0,0,0,1],
			"y": [1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
			"z": [1,1,1,1,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,1,1,1,1],
			"0": [0,1,1,1,0,1,0,0,0,1,1,0,0,1,1,1,0,1,0,1,1,1,0,0,1,1,0,0,0,1,0,1,1,1,0],
			"1": [0,0,1,0,0,0,1,1,0,0,1,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1,1,1,1,1],
			"2": [0,1,1,1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1,1,1,1],
			"3": [0,1,1,1,0,1,0,0,0,1,0,0,0,0,1,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			"4": [0,0,0,1,0,0,0,1,1,0,0,1,0,1,0,1,0,0,1,0,1,1,1,1,1,0,0,0,1,0,0,0,0,1,0],
			"5": [1,1,1,1,1,1,0,0,0,0,1,0,0,0,0,1,1,1,1,0,0,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			"6": [0,0,1,1,0,0,1,0,0,0,1,0,0,0,0,1,1,1,1,0,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			"7": [1,1,1,1,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0],
			"8": [0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,0,1,1,1,0],
			"9": [0,1,1,1,0,1,0,0,0,1,1,0,0,0,1,0,1,1,1,1,0,0,0,0,1,0,0,0,1,0,0,1,1,0,0],
			"-": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
			"?": [0,1,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0],
			"!": [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0],
			"@": [0,1,1,1,0,1,0,0,0,1,1,0,1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,0,0,1,0,1,1,1,0],
			"&": [0,1,1,0,0,1,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,1,0,0,1,0,0,1,1,0,1],
			".": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0], 
			" ": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] 
		},



		/*
		 * default options
		 * (the ones to copy from if an option isn't specified specifically)
		 */
		defaults = {
			blockColour : "ff9900",
			blockSize : 10,
			textString : "...",
			clearance : 10,
			ordering : 'default',
			animate : false,
			name : null,
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
		 * Start letters
		 */
		startLetters = function() {

			// init values
			lineCount = 1;
			currentBlock = 0;
			blocks = [];
			blockCount = 0;
			
			if (options.x < 0) {
				currentX = visibleXEnd - (options.blockSize*characterBlockHeight*(options.textString.length-1)) + options.x;
			} else {
				currentX = options.x + visibleXStart;
			}
			
			if (options.y < 0) {
				currentY = visibleYEnd - options.clearance - (options.blockSize*characterBlockHeight) + options.y;
			} else {
				currentY = options.y + visibleYStart;
			}

			fixTextLength();
			calculateBlockPositions();

			// if we're not animating, show everything at once
			if (!options.animate) {
				currentBlock = blocks.length;
			}

			// add this into the queue of text to be drawn
			textBlocksToAnimate.push(options.name);
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
			textStringArray = textString.split(" ");
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

					textString = textString.replace(originalWord, wordArray.join("- "));
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
					var nextSpacePosition = textString.indexOf(" ", character);
					if (nextSpacePosition == -1) { nextSpacePosition = textStringLength; }

					// start working out where to place the new letter/word
					var newLineRequired = false;


					// condition : is this word going to fit on the current line?
					if (currentX + (options.blockSize * (characterBlockWidth*(nextSpacePosition-character))) + (options.clearance*(nextSpacePosition-character)) > canvas.width - options.clearance) {
						newLineRequired = true;
					} 


					// condition : start a new line?
					if (newLineRequired && textString[character] != " ") {
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
				case "vertical":
					function vertical(a, b) { return a.y - b.y; }
					blocks.sort(vertical);
				break;

				case "horizontal":
					function horizontal(a, b) { return a.x - b.x; }
					blocks.sort(horizontal);
				break;

				case "reverse":
					blocks.reverse();
				break;

				case "random":
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
					drawContext.fillStyle = "rgba("+HexToRGB(drawColour)+", "+blocks[counter].opacity+")";
					drawRectangle(blocks[counter].x, blocks[counter].y, options.blockSize, options.blockSize);
				}
			};

			// add one to loop
			currentBlock++;			

			// calculate whether to end the drawing
			if (currentBlock == blockCount+10) {
				
				// remove this from the queue of to be drawn
				var id = textBlocksToAnimate.indexOf(options.name);
				if(id != -1 ) {
					debug('finished drawing ' + options.textString);
					//textBlocksToAnimate.splice(id, 1);
					//resetBlocks();
				} 
			}
		},
		
		
		/*
		 *
		 */
		resetBlocks = function(){
			currentBlock = 0;
		},
		
		
		/*
		 * Turn Hex into RGB, for block colour
		 */
		HexToRGB = function(h) {return HexToR(h) +","+HexToG(h)+","+HexToB(h);},
		HexToR = function(h) {return parseInt((cutHex(h)).substring(0,2),16);},
		HexToG = function(h) {return parseInt((cutHex(h)).substring(2,4),16);},
		HexToB = function(h) {return parseInt((cutHex(h)).substring(4,6),16);},
		cutHex = function(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h;},
		
		
		
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
			drawBlocks: drawBlocks,
			resetBlocks: resetBlocks
		};	
	};
	
	
	// start the game!
	init();
	
}();
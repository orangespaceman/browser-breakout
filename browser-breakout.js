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
	 * Acceptable images to play with
	 */
	images = [],
	
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
	ballX = 35,
	ballY = 35,
	ballDx = 6,
	ballDy = 6,
	
	/*
	 * Paddle positions
	 */
	paddleColour = "#FFFFFF",
	paddleX = 0,
	paddleY = 0,
	paddleHeight = 10,
	paddleWidth = 100,
	
	/*
	 * Current canvas transparency
	 */
	canvasTransparency = 0,
	
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
		canvas.style.zIndex = 1000;
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
						'state' : 1
					});
				}
			}
		}
		
		debug("collectImages: - found " + images.length + " out of " + allImages.length);
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
		
		// clear canvas
		drawContext.clearRect(0,0,canvas.width, canvas.height);
		
		// condition : fade in transparent background at the start
		if (canvasTransparency < 0.7) {
			canvasTransparency += 0.1;
		}
		
		// draw background
		drawContext.fillStyle = "rgba(0, 0, 0, "+canvasTransparency+")";
		drawContext.fillRect(0, 0, canvas.width, canvas.height);
		
		
		// draw images
		for (var counter = images.length - 1; counter >= 0; counter--){
			var image = images[counter];
			
			// condition : detect collision
			if (
				image.state == 1 &&
				ballX > image.imageXStart && ballX < image.imageXStart + image.imageWidth &&
				ballY > image.imageYStart && ballY < image.imageYStart + image.imageHeight
			) {
				debug('image hit!');
				image.state = 0;
				ballDy = -ballDy;
				ballDx = -ballDx;
			}

			// condition : if the still image exists, display it!
			if (image.state == 1) {
				drawContext.drawImage(image.image, image.imageXStart, image.imageYStart);
			}
		};
		
		
		// draw ball
		drawContext.fillStyle = ballColour;
		drawCircle(ballX, ballY, ballRadius);
		
		
		// assess current keys to move paddles
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
		

		// draw paddles
		drawContext.fillStyle = paddleColour;
		drawRectangle(visibleXStart + paddleX, visibleYStart, paddleWidth, paddleHeight); 				// top
		drawRectangle(visibleXStart + paddleX, visibleYEnd - paddleHeight, paddleWidth, paddleHeight); 	// bottom
		drawRectangle(visibleXStart, visibleYStart + paddleY, paddleHeight, paddleWidth); 				// left
		drawRectangle(visibleXEnd - paddleHeight, visibleYStart + paddleY, paddleHeight, paddleWidth); 	// right
		
		
		// calculate bottom paddle hit detection
		if (ballY + ballDy + ballRadius > visibleYEnd - paddleHeight) {
			if (ballX > visibleXStart + paddleX && ballX < visibleXStart + paddleX + paddleWidth) {
				debug("Bottom Panel Hit");
				//ballDx = 8 * ((ballX - (paddleX + paddleWidth / 2)) / paddleWidth);
				ballDx = -ballDx;
				ballDy = -ballDy;
			}
		}
		
		
		// calculate top paddle hit detection
		if (ballY - ballRadius < visibleYStart + paddleHeight) {
			if (ballX > visibleXStart + paddleX && ballX < visibleXStart + paddleX + paddleWidth) {
				debug("Top Panel Hit");
				//ballDx = 8 * ((ballX - (paddleX + paddleWidth / 2)) / paddleWidth);
				ballDx = -ballDx;
				ballDy = -ballDy;
			}
		}
		
		
		// calculate right paddle hit detection
		if (ballX + ballDx + ballRadius > visibleXEnd - paddleHeight) {
			if (ballY > visibleYStart + paddleY && ballY < visibleYStart + paddleY + paddleWidth) {
				debug("Right Panel Hit");
				//ballDy = 8 * ((ballY - (paddleY + paddleWidth / 2)) / paddleWidth);
				ballDy = -ballDy;
				ballDx = -ballDx;
			}
		}
		
		
		// calculate left paddle hit detection
		if (ballX - ballRadius < visibleXStart + paddleHeight) {
			if (ballY > visibleYStart + paddleY && ballY < visibleYStart + paddleY + paddleWidth) {
				debug("Left Panel Hit");
				//ballDy = 8 * ((ballY - (paddleY + paddleWidth / 2)) / paddleWidth);
				ballDy = -ballDy;
				ballDx = -ballDx;
			}
		}
		

		// calculate whether to end the game
		if (
			ballX + ballDx + ballRadius > visibleXEnd || 
			ballX + ballDx - ballRadius < visibleXStart ||
			ballY + ballDy + ballRadius > visibleYEnd || 
		    ballY + ballDy - ballRadius < visibleYStart
		) {
			debug("GAME OVER");
			clearInterval(drawInterval);
		}
		
		
		// no interactions detected, carry on!
		ballX += ballDx;
		ballY += ballDy;		
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
		createCanvas();
		
		
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
		
		
		// draw!
		drawInterval = setInterval(draw, 25);		
	}();
	
	
	/*
	 * expose public methods
	 */
	return {
//		init: init
	};	
}();
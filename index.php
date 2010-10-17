<!DOCTYPE html>
<html lang='en-gb' xmlns='http://www.w3.org/1999/xhtml'>
<head>
	<meta charset='utf-8'>
	<title>Browser Breakout</title>
	<style>
		* { margin:0;padding:0; }
	
		#wrapper {
			position:relative;
			min-height:2000px;
		}
		
		img {
			position:absolute;
		}
		
		span#bb-go {
			position:fixed; 
			z-index:10000; 
			display:block; 
			top:10px; 
			right:10px; 
			padding:50px; 
			background:#036; 
			opacity:0.7;
		}
		span#bb-go:hover {
			opacity:0.9;
		}
	</style>

	<script>
		window.onload = function() {
			var inited = false;
			var go = document.getElementById("bb-go");
			go.onclick = function() {
				var head = document.getElementsByTagName("head")[0];
				script = document.createElement('script');
				script.id = 'browser-breakout';
				script.src = "browser-breakout.js";
				script.type = "text/javascript";
				head.appendChild(script);
				go.style.display = "none";
			}
		}
	</script>
</head>
<body>
	<div id="wrapper">
		<h1>Browser Breakout!</h1>
		<p><span id="bb-go">Go!</span></p>
		<?php
			for ($counter=0; $counter < 50; $counter++) { 
				echo '
					<img src="./placeholder/'.rand(1, 200).'-'.rand(1, 200).'-ff9900-cccccc/" alt="{...}" style="left:'.rand(1, 900).'px;top:'.rand(1, 1500).'px;" />
				';
			}
		?>
	</div>
</body>
</html>
<?php

	if(isset($_GET)){
	    $imagedata = explode('-',$_GET['data']); 
	    if (!is_array($imagedata) || count($imagedata) != 4){
	      die("Something wrong there!! It should be like -
	           placeholder/350-150-CCCCCC-969696/");
	    }
	    create_image($imagedata[0],
	                 $imagedata[1], 
	                 $imagedata[2],  
	                 $imagedata[3]);
	    exit;
	}


	function create_image($width, $height, $bg_color, $txt_color )

	{

	    $text = "$width X $height";

	    //Create the image resource 
	    $image = ImageCreate($width, $height);
	    //Making of colors, we are changing HEX to RGB
	    $bg_color = ImageColorAllocate($image, 
	                base_convert(substr($bg_color, 0, 2), 16, 10), 
	                base_convert(substr($bg_color, 2, 2), 16, 10), 
	                base_convert(substr($bg_color, 4, 2), 16, 10));


	    $txt_color = ImageColorAllocate($image, 
	                base_convert(substr($txt_color, 0, 2), 16, 10), 
	                base_convert(substr($txt_color, 2, 2), 16, 10), 
	                base_convert(substr($txt_color, 4, 2), 16, 10));

	    //Fill the background color 
	    ImageFill($image, 0, 0, $bg_color); 
	    //Calculating font size   
	    $fontsize = ($width>$height)? ($height / 10) : ($width / 10) ;

	    //Inserting Text    
	   	//imagettftext($image,$fontsize, 0, ($width/2) - ($fontsize * 2.75), ($height/2) + ($fontsize* 0.2),  $txt_color, 'Crysta.ttf', $text);
	
		//(destination image, font, left, top, text, text colour)    
		imagestring($image, $fontsize,10, 10, $text, $txt_color);


	    //Tell the browser what kind of file is come in 
	    header("Content-Type: image/png"); 
	    //Output the newly created image in png format 
	    imagepng($image);   
	    //Free up resources
	    ImageDestroy($image);
	}
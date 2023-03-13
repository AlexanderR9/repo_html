<!DOCTYPE html>
<html>
<head>
	<?php include('php/includes.php');?>
	<title>FX statistic</title>	
	 <meta name="viewport" content="width=device-width, initial-scale=1.0">

	<?php include('php/leftbar.php');?>
	<?php include('php/canvas.php');?>
	
	<!--
	<script src="./js/three.min.js"></script>
	<script type="module" src="./js/three.module.js"></script>
	<script type="module" src="./js/controls/TrackballControls.js"></script>	
	<script type="module" src="./js/script.js"></script>
	<script type="importmap">{"imports": {"three": "./js/three.module.js"}}</script>		
	<script src="./js/threebsp.js"></script>
	<script src="./js/three.js"></script>
	
	<script type="module">		
		console.log("test module 1");
		import {test3d} from './js/script.js';
		test3d();	
	</script>
	
	-->


	<script type="module" src="./js/project.js"></script>	
	
	<style>
		* {margin: 0; padding: 0;}
		body {background: Cornsilk;}
	</style>
	
</head>
<body>

    <?php 	
		$main_div = new HDiv('main_div');
		$header_div = new HDiv('header_div');
		$header_div->setHeight(60, -1, -1, 'px');
		$header_div->setBackground('YellowGreen');
		$main_div->addChild($header_div);
		
		$text = new HText("House project");
		$text->setFont(22, 'BlanchedAlmond');
		$text->setMargin(20, -1, -1, -1, '%');
		$text->setFontBoldItalic(false, true);
		$text->setPosition(HPositionType::hpRelative, -1, -1, 30, -1, '%');
		$header_div->addChild($text);
		
		$fdiv = new HFlexDiv();
		$fdiv->setTransparent(true);
		$fdiv->addChild(new Leftbar(15));
		$fdiv->addChild(new CanvasDiv(80));		
		$main_div->addChild($fdiv);
				
		$main_div->place();			
	?>
				
</body>
</html>
<!DOCTYPE html>
<html>
<head>
	<?php include('php/includes.php');?>
	<title>FX statistic</title>	
	 <meta name="viewport" content="width=device-width, initial-scale=1.0">

	<?php include('php/leftbar.php');?>
	<?php include('php/header.php');?>
	<?php include('php/canvas.php');?>

<!--
	<script type="module" src="./js/project.js"></script>	
	-->
	
	<style>
		* {margin: 0; padding: 0;}
		body {background: Cornsilk;}
	</style>
	
</head>
<body>

    <?php 	
		$main_div = new HDiv('main_div');
		$main_div->addChild(new HeaderDiv());
				
		$fdiv = new HFlexDiv();
		$fdiv->setTransparent(true);
		$fdiv->addChild(new Leftbar(15));
		$fdiv->addChild(new CanvasDiv(80));		
		$main_div->addChild($fdiv);
				
		$main_div->place();			
	?>
	
	<script src="./js/modescript.js"></script>	
		
				
</body>
</html>
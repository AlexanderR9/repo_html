<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="utf-8" />
	<meta http-equiv="Cache-Control" content="no-cache">
	<meta http-equiv="Cache-Control" content="private">
	<meta http-equiv="Cache-Control" content="max-age=10800, must-revalidate">
	<meta http-equiv="Cache-Control" content="max-age=10800, proxy-revalidate">

	<title>Page title</title>
	
	
	<?php
    include('../phplib/common.php');
    include('../phplib/fileworker.php');
	include('../php/includes.php');
    include('../phplib/db.php');

    include('../phplib/h_object.php');
    include('../php/app_settings.php');
	include('../php/index_content.php');

    ?>


	
</head>
<body>

	<?php
    include('../html/header.html');	
	
	$sidebar_div = new HDiv();
	$sidebar_div->setBackGround('LightCyan');
	$sidebar_div->setBorder(1, 'red', 10);
	$sidebar_div->setID('sidebar_div');
	$sidebar_div->setWidth(20);
	//$sidebar_div->setHeight(500, -1, -1, 'px');
	
	$instruments_header = new HText('Instruments');
	$instruments_header->setFontTextColor('SeaGreen');
	$instruments_header->setFontSize(16);
	$instruments_header->setFontAlign(HAlign::haCenter);
	$instruments_header->setFontBoldItalic(false, true);
	
	//$t_link = new HLink('couple_data.php');
	//$t_link->setColors('DeepPink', 'Gold');
	//$instruments_header->setLink($t_link);		
	$sidebar_div->addChild($instruments_header);
	
	include('../php/loadstocks.php');

	
	$div2 = new HMatrixDiv(4, 3);
	//$div2->setBorder(1, 'blue', 20);
	$div2->setMarginItems(2);
	$div2->setWidth(75);
				
	$hdiv = new HFlexDiv();
	$hdiv->addClass('main_params_size');
	$hdiv->setBackGround('white');
	//$hdiv->setBorder(3, 'gray');
	$hdiv->setMargin(-1, -1, 10, 10);
	$hdiv->setTransparent(true);

	
	$hdiv->addChild($sidebar_div);
	$hdiv->addChild($div2);	
	$hdiv->place();
	
    ?>
	


	<!-- content block 
	<div id="center_div" class="main_params_size flex_parent_div">
		<div id="sidebar_div">
		    <em style="color:Maroon; text-align:center; font-size:18px;">Instruments</em>
			<hr/>
			<div id="instrument_list"></div>
		</div>
		<div id="content_div">content 1</div>		
	</div>
	
	-->
		
	<!-- footer block -->
	
	<?php
    include('../html/footer.html');		
    ?>
	
	
	
</body>
</html>


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
    ?>


	
</head>
<body>

	<?php
    include('../html/header.html');	
    ?>
	


	<!-- content block -->
	<div id="center_div" class="main_params_size flex_parent_div">
		<div id="sidebar_div">
		    <em style="color:Maroon; text-align:center; font-size:18px;">Instruments</em>
			<hr/>
			<div id="instrument_list"></div>
		</div>
		<div id="content_div">content 1</div>		
	</div>
		
	<!-- footer block -->
	
	<?php
    include('../html/footer.html');	
	
	include('../php/loadstocks.php');
    ?>
	
	
	
</body>
</html>


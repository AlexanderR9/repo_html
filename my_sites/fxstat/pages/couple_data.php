<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="utf-8" />
	<title>Couple data</title>
		<?php
    include('../phplib/common.php');
    include('../phplib/fileworker.php');
	include('../php/includes.php');
	
    include('../phplib/h_object.php');
	include('../php/index_content.php');

    ?>

	
	
	
</head>
<body>
	Контент <br/>
	
	
	<?php
	
	$url = ((!empty($_SERVER['HTTPS'])) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
	echo_br("full url:  $url");
	
	$url = $_SERVER['REQUEST_URI'];
	echo_br("base url:  $url");
	
	
	$url = $_SERVER['REQUEST_URI'];
	$url = explode('?', $url);
	$url = $url[0];
	echo_br("only base url:  $url");
	
	$params = null;
	parse_str($_SERVER['QUERY_STRING'], $params);
	echo_br("only params:");
	print_r($params);
	
	
	?>
	
</body>
</html>
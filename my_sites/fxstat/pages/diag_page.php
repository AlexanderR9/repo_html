<!DOCTYPE html>
<html lang="ru">
<head>

	<?php
		include('../php/includes.php');
    ?>

	<title>Diagnostic page</title>
			
</head>
<body>

	<?php 
		include('../html/header.html'); 
		
		$main_div = new HDiv();
		$main_div->setMargin(-1, -1, 20, -1);
		$main_div->addClass('main_params_size');
		$main_div->setTransparent(true);
		

		$t = new HTable(15, 3);
		$t->setCaption("Path commands");
		$t->setBorder(3, 'gray');
		$h_arr = array("Command", "Result", "Description");
		$t->setHeaderLabels($h_arr);		
		$w_cols = array(7, 8, 25, 30, 30);
		//$t->setColsWidth($w_cols);
		
		$row = 0;
		//1 row
		$t->setCellData($row, 0, "\$_SERVER['DOCUMENT_ROOT']");
		$t->setCellData($row, 1, $_SERVER['DOCUMENT_ROOT']);
		$t->setCellData($row, 2, "Корневая папка сервера APACHE");
		$row++;
		
		$t->setCellData($row, 0, "\$_SERVER['PHP_SELF']");
		$t->setCellData($row, 1, $_SERVER['PHP_SELF']);
		$t->setCellData($row, 2, "Возвращает относительный путь к файлу-скрипту, чей код выолняется в данный момент");
		$row++;
		
		
		//2 row
		$t->setCellData($row, 0, "__FILE__");
		$t->setCellData($row, 1, __FILE__);
		$t->setCellData($row, 2, "Возвращает полный путь к файлу-скрипту, чей код выолняется в данный момент");
		$row++;
		//3 row
		$t->setCellData($row, 0, "__DIR__");
		$t->setCellData($row, 1, __DIR__);
		$t->setCellData($row, 2, "Возвращает полный путь к каталогу, где лежит скрипт, код которого выполняется");
		$row++;
		//4 row
		$t->setCellData($row, 0, "getcwd()");
		$t->setCellData($row, 1, getcwd());
		$t->setCellData($row, 2, "Возвращает путь к текущей отображаемой странице");
		$row++;
		//5 row
		$t->setCellData($row, 0, "dirname(getcwd())");
		$t->setCellData($row, 1, dirname(getcwd()));
		$t->setCellData($row, 2, "Возвращает путь на 1 уровень выше от указанной папки");
		$row++;
		//6 row
		$t->setCellData($row, 0, "dirname(__FILE__)");
		$t->setCellData($row, 1, dirname(__FILE__));
		$t->setCellData($row, 2, "Возвращает путь каталога в котором лежит указанный файл");
		$row++;
		//7 row
		$t->setCellData($row, 0, "basename(__FILE__)");
		$t->setCellData($row, 1, basename(__FILE__));
		$t->setCellData($row, 2, "Возвращает имя указанного файла без полного пути");
		$row++;
		//8 row
		$t->setCellData($row, 0, "basename(__FILE__ , '.php')");
		$t->setCellData($row, 1, basename(__FILE__ , '.php'));
		$t->setCellData($row, 2, "Возвращает имя указанного файла без полного пути и без расширения(при условии что расширение указано правильно) ");
		$row++;
		//8 row
		$t->setCellData($row, 0, "basename(__DIR__)");
		$t->setCellData($row, 1, basename(__DIR__));
		$t->setCellData($row, 2, "Возвращает имя указанного каталога без полного пути");
		$row++;
		
		//8 row
		$t->setCellData($row, 0, "\$_SERVER['SERVER_ADDR']");
		$t->setCellData($row, 1, $_SERVER['SERVER_ADDR']);
		$t->setCellData($row, 2, "IP адрес сервера, на котором выполняется текущий скрипт. ");
		$row++;
		$t->setCellData($row, 0, "\$_SERVER['SERVER_NAME']");
		$t->setCellData($row, 1, $_SERVER['SERVER_NAME']);
		$t->setCellData($row, 2, "Имя сервера, на котором выполняется текущий скрипт. ");
		$row++;
		
		$t->setCellData($row, 0, "\$_SERVER['REQUEST_URI']");
		$t->setCellData($row, 1, $_SERVER['REQUEST_URI']);
		$t->setCellData($row, 2, "URI, который был передан для того, чтобы получить доступ к этой странице. ");
		$row++;
		
		
		
		$t->setBackGround('lightgray');
		$main_div->addChild($t);
			
		$main_div->place();

		
	?>
	
	
	
	
</body>
</html>
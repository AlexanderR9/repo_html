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
		
		$next_row = 0;
		function addTable($caption, $rows, $cols)
		{
			global $next_row;
			$next_row = 0;
			$t = new HTable($rows, $cols);
			$t->setBackGround('lightgray');
			$t->setCaption($caption);
			$t->setBorder(3, 'gray');
			$t->setMargin(-1, -1, 20, 'px');
			$caption_font = new HFont();
			$caption_font->text_color = 'blue';
			$caption_font->size = 20;
			$caption_font->is_italic = true;
			$caption_font->align = HAlign::haLeft;
			$t->setCaptionFont($caption_font);
			return $t;			
		}
		function setTableHeader($t, $labels, $w_cols = null)
		{
			if (is_array($labels))
				$t->setHeaderLabels($labels);
			
			if (is_array($w_cols))
				$t->setColsWidth($w_cols);
		}
		function setNextRow($t, $row_data)
		{
			global $next_row;
			$t->setRowData($next_row,  $row_data);
			$next_row++;
		}
		
		
		///////////////TABLE 1  (PATH info)//////////////////	
		$t = addTable("PATH (php)", 15, 3);
		setTableHeader($t, array("Command", "Result", "Description"), array(30, 30, 40));
		setNextRow($t, array("\$_SERVER['DOCUMENT_ROOT']", $_SERVER['DOCUMENT_ROOT'], "Корневая папка сервера APACHE"));
		setNextRow($t, array("\$_SERVER['PHP_SELF']", $_SERVER['PHP_SELF'], "Возвращает относительный путь к файлу-скрипту, чей код выолняется в данный момент"));		
		setNextRow($t, array("__FILE__", __FILE__, "Возвращает полный путь к файлу-скрипту, чей код выолняется в данный момент"));
		setNextRow($t, array("__DIR__", __DIR__, "Возвращает полный путь к каталогу, где лежит скрипт, код которого выполняется"));
		setNextRow($t, array("getcwd()", getcwd(), "Возвращает путь к текущей отображаемой странице"));
		setNextRow($t, array("dirname(getcwd())", dirname(getcwd()), "Возвращает путь на 1 уровень выше от указанной папки"));
		setNextRow($t, array("dirname(__FILE__)", dirname(__FILE__), "Возвращает путь каталога в котором лежит указанный файл"));
		setNextRow($t, array("basename(__FILE__)", basename(__FILE__), "Возвращает имя указанного файла без полного пути"));
		setNextRow($t, array("basename(__FILE__ , '.php')", basename(__FILE__ , '.php'), "Возвращает имя указанного файла без полного пути и без расширения(при условии что расширение указано правильно)"));
		setNextRow($t, array("basename(__DIR__)", basename(__DIR__), "Возвращает имя указанного каталога без полного пути"));
		setNextRow($t, array("\$_SERVER['SERVER_ADDR']", $_SERVER['SERVER_ADDR'], "IP адрес сервера, на котором выполняется текущий скрипт."));
		setNextRow($t, array("\$_SERVER['SERVER_NAME']", $_SERVER['SERVER_NAME'], "Имя сервера, на котором выполняется текущий скрипт."));
		
		
		
		///////////////TABLE 2 (REQUEST to php script)//////////////////	
		$t2 = addTable("REQUEST DATA (php)", 10, 3);
		setTableHeader($t2, array("Command", "Result", "Description"), array(30, 30, 40));
		setNextRow($t2, array("\$_SERVER['REQUEST_URI']", $_SERVER['REQUEST_URI'], "URI, который был передан для того, чтобы получить доступ к этой странице."));
		setNextRow($t2, array("\$_SERVER['REQUEST_METHOD']", $_SERVER['REQUEST_METHOD'], "тип запроса, который был отправлен к этому скрипту."));
		setNextRow($t2, array("count(\$_POST)", count($_POST), "количетсво параметров переданных в POST запросе."));
		setNextRow($t2, array("count(\$_GET)", count($_GET), "количетсво параметров переданных в GET запросе."));
		setNextRow($t2, array("count(\$_REQUEST)", count($_REQUEST), "общее количетсво параметров переданных в запросе."));
		setNextRow($t2, array("\$_POST['param_name']", "undefined", "получить значение конкретного параметра (если такого параметра нет, то сервер выдаст ошибку)."));
		
		
		///////////////TABLE 3//////////////////			
		$t_js = addTable("JS help", 25, 4);
		setTableHeader($t_js, array("Subject", "Code", "Example", "Description"), array(10, 20, 30, 40));
		setNextRow($t_js, array("DOM", "document.body", "let node = document.body;" ,"Получить элемент body."));
		setNextRow($t_js, array("DOM", "document.createElement", "let node = document.createElement('div');" ,"Создать новый элемент."));
		setNextRow($t_js, array("DOM", "appendChild", "document.body.appendChild(node);" ,"Добавить елемент в конец дочерних детей родителя."));
		setNextRow($t_js, array("DOM", "innerHTML", "node.innerHTML = \"text value\";" ,"Присвоить текстовое значение елементу. (в основном для текстовых узлов)"));
		setNextRow($t_js, array("DOM", "insertAdjacentHTML", "let html_code = \"&lt;em> try AJAX request&lt;/em>\"; <br>element.insertAdjacentHTML('beforeend', html_code);)" ,
		
																	"Добавить эемент(или целую структуру элементов) к родителю, 
																	но элемент(2-параметр) задан в виде обычного куска HTML кода, 1-параметр указывает куда вставить: <br>
																									- beforebegin - до самого element <br>
																									- afterbegin - сразу после открывающего тега element <br>
																									- beforeend - перед закрывающим тегом element <br>
																									- afterend - после самого element"));
		setNextRow($t_js, array("DOM CHILDS", "childElementCount", "let div_node = document.getElementById(\"div_id\");	<br>let n = div_node.childElementCount;" ,
																									"Получить количетсво дочерних элементов(детей) родителя"));
		setNextRow($t_js, array("TIMER", "setTimeout", "setTimeout(() => this.removeAttribute('disabled'), 3000);" ,
													"изменение атрибута объекта-sender с задержкой, действие выполнится только 1 раз"));
		setNextRow($t_js, array("TIMER", "setTimeout", "function t_func() {...}; <br>setTimeout(t_func, 3000);" ,
													"Выполнение функции с задержкой, функциия выполнится только 1 раз"));
		setNextRow($t_js, array("TIMER", "setTimeout", "function t_func(p1, p2) {...}; <br>setTimeout(t_func, 3000, p1, p2);" ,
													"Выполнение функции(c с параметрами) с задержкой"));
		setNextRow($t_js, array("TIMER", "setTimeout", "function t_func() <br>{<br>.....<br>if (a > b) return; <br>setTimeout(t_func, 3000); <br>} <br>t_func();" ,
													"Зацикливание выполнения функции с заданным периодом до тех пор пока не выполнится некоторое условие."));
													
													
		setNextRow($t_js, array("STRING", "", "" ,""));
		setNextRow($t_js, array("STRING", "", "" ,""));
		setNextRow($t_js, array("STRING", "", "" ,""));
		setNextRow($t_js, array("STRING", "", "" ,""));
		setNextRow($t_js, array("DOM", "", "" ,""));
		setNextRow($t_js, array("DOM", "", "" ,""));


		///////////////TABLE 4//////////////////			
		$t_php = addTable("PHP help", 10, 3);
		setTableHeader($t_php, array("Subject", "Example", "Description"), array(10, 40, 50));
		setNextRow($t_php, array("var", "\$i = 0; <br> function fname() {global \$i; \$i++;}", "Видимость внешней переменной внутри функции"));
		setNextRow($t_php, array("var", "", ""));

		

			
		$main_div->addChild($t);
		$main_div->addChild($t2);
		$main_div->addChild($t_js);
		$main_div->addChild($t_php);
		$main_div->place();

		
	?>
	
	
	
	
</body>
</html>
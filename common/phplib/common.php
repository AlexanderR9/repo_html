<?php
    function br() {print "<br>";}
    function echo_br($str_line, $color = '') 
	{
		if (empty($color)) echo $str_line; 
		else echo "<font color=\"$color\">$str_line</font>";
		br();
	}
    function root_path() {return $_SERVER['DOCUMENT_ROOT'];} //корневой путь сервера где он ищет все проекты (не путать с корнем сайта)
	function pwd() {return getcwd();} //возвращает путь к текущему файлу, где вызывается скрипт
	//function fpwd() {return __FILE__;}
	
    function str_date() {return date('d.m.Y');}
    function str_time() {return date('H:i:s');}
    function str_datetime() {return date('d.m.Y / H:i:s');}
	function to_debug($str) {echo_br("<script>console.log('{$str}' );</script>");}
	function boolToStr($b) {if (!is_bool($b)) return "no_bool"; return ($b ? "true" : "false");}
?>



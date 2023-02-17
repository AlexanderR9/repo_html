<?php	
	$root_path = "";	
	if (str_contains(getcwd(), 'pages')) $root_path = "..";
		
	//include phplib
	$phplib_path = "phplib";
	if ($root_path != "") $phplib_path = $root_path."/".$phplib_path;
	include("$phplib_path/common.php");
    include("$phplib_path/fileworker.php");
    include("$phplib_path/h_object.php");
    include("$phplib_path/h_content.php");
    include("$phplib_path/h_table.php");
    include("$phplib_path/h_input.php");
    include("$phplib_path/db.php");
	
	//include php modules of this project
	$php_path = "php";
	if ($root_path != "") $php_path = $root_path."/".$php_path;
	include("$php_path/app_settings.php");


	//include meta
	echo "<meta charset=\"UTF-8\">"; print("\n");
	echo "<meta http-equiv=\"Cache-Control\" content=\"no-cache\">"; print("\n");
	echo "<meta http-equiv=\"Cache-Control\" content=\"private\">"; print("\n");
	echo "<meta http-equiv=\"Cache-Control\" content=\"max-age=10800, must-revalidate\">"; print("\n");
	echo "<meta http-equiv=\"Cache-Control\" content=\"max-age=10800, proxy-revalidate\">"; print("\n");
	print("\n");
	
	//include icon
	$fname = "calc.ico";
	$ico_path = "images";
	if ($root_path != "") $ico_path = $root_path."/".$ico_path;
	echo "<link rel=\"shortcut icon\" href=\"$ico_path/$fname\" type=\"image/x-icon\"/>"; 
	print("\n");

	//include css
	$css_path = "css";	
	if ($root_path != "") $css_path = $root_path."/".$css_path;
	$f_arr = array();
	array_push($f_arr, "tag.css", "main.css");	
	foreach ($f_arr as $fname) 
	{
		echo "<link rel=\"stylesheet\" href=\"$css_path/$fname\" type=\"text/css\"/>"; 
		print("\n");
	}
	

	/////////////////////GLOBAL PROJECT FUNCTIONS///////////////////////////////////	
	function project_path()
	{
		return "/".AppSettings::projectName();
	}
	
	
?>

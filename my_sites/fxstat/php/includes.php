<?php	
	$root_path = "";	
	if (!isIndexPath(getcwd())) $root_path = "..";

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
	array_push($f_arr, "tag.css", "flex.css", "main.css");	
	foreach ($f_arr as $fname) 
	{
		print("\t"); 
		echo "<link rel=\"stylesheet\" href=\"$css_path/$fname\" type=\"text/css\"/>"; 
		print("\n");
	}
		
?>

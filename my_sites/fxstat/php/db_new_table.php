<?php	
	//include('../phplib/common.php');


//align enum
enum TAction
{
    case tShowForm = 105;
    case tCheckName;
    case tNextField;
    case tCreate;
}


	$main_div = new HDiv();
	$main_div->setID("db_newtable_div");
	$main_div->setBorder(2, 'green');
	$main_div->setMargin(5, 5, 5, 5, '%');

	$main_div->place();

/*
	$s = "REQ_TYPE: ".$_SERVER["REQUEST_METHOD"]."   GET number: ".count($_GET)."   POST number: ".count($_POST);
	echo $s, "\n";
    $s = "first param: ".$_POST['tname']; 	
	echo $s, "\n";
	print_r($_POST);
	print_r($_REQUEST);
	
	*/
	
	//to_debug("GET: ".count($_GET));	

		//create main_div
		//$main_div = new HDiv();
		//$main_div->setBorder(4, 'GreenYellow');
		//$main_div->setMargin(-1, -1, 10, -1);
		//$main_div->addClass('main_params_size');
		//$main_div->setTransparent(true);

		//$main_div->place();

?>

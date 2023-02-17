<?php	
	//include('../phplib/h_object.php');
	//include('../phplib/h_content.php');
	//include('../phplib/h_input.php');


//align enum
/*
enum TAction
{
    case tShowForm;
    case tCheckName;
    case tNextField;
    case tCreate;
}
*/


	$main_div = new HDiv();
	$main_div->setID("db_new_table_div");
	$main_div->setBorder(2, 'green');
	$main_div->setWidth(78);
	//$main_div->setHeight(98, -1, -1, '%');
	//$main_div->setMargin(5, 5, 5, 5, '%');
	
	$cb_type = new HComboBox();
	$main_div->addChild($cb_type);		
	$t_req = $_SERVER['REQUEST_METHOD'];
	$cb_type->addItem('req_type', $t_req);
	
	$cb_params = new HComboBox();
	$main_div->addChild($cb_params);		
	if ($t_req == 'GET') $cb_params->addItem(0, 'empty');
	else
	{
		$edit = new HLineEdit("params: ".count($_POST));
		$main_div->addChild($edit);		
		foreach($_POST as $key => $value)
		{
			$s = ($cb_params->itemsCount()+1).".  $key => $value";
			$cb_params->addItem($key, $s);
		}
	}
	//$cb_params->addItem('req_type', $_SERVER['REQUEST_METHOD']);

	
	$main_div->place();

/*
	$s = "REQ_TYPE: ".$_SERVER["REQUEST_METHOD"]."   GET number: ".count($_GET)."   POST number: ".count($_POST);
	echo $s, "\n";
    $s = "first param: ".$_POST['tname']; 	
	echo $s, "\n";
	print_r($_POST);
	print_r($_REQUEST);
	
	*/
	

?>

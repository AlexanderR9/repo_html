<?php	
	include_once('../phplib/h_object.php');
	include_once('../phplib/h_content.php');
	include_once('../phplib/h_input.php');
	include_once('../phplib/h_table.php');



class DB_NewTableDiv extends HDiv 
{
	public function __construct($width_percent) //constructor
	{
		parent::__construct();
		$this->setID("db_new_table_div");
		$this->setWidth($width_percent);
		//$this->setBorder(3, 'brown', 20);
		$this->initContent();
	}	

/////////////////protected section//////////////////	
	protected function initContent()
	{
		$this->addCaption();
		
		//center div
		$tab_div = new HFlexDiv();
		$tab_div->setJustifyType(HFlexJustifyType::fjtLeft);
		$this->addChild($tab_div);				
		//$tab_div->setBorder(1, 'green');
		$tab_div->setHeight(70, -1, -1, '%');
		$tab_div->setMargin(-1, -1, 20, 10, 'px');
		
		//add tab-pages
		$this->addTabPage1($tab_div);
		$this->addTabPage2($tab_div);		
		$this->addTabPage3($tab_div);		
		
		//control buttons block
		$this->addControlButtons();		
	}
	protected function addCaption()
	{
		$title = new HText("Creating table for DB");
		$title->setFontSize(18);			
		$title->setPadding(-1, -1, 8, 8);
		$title->setBackGround('DarkSlateGray');
		$title->setFontTextColor('YellowGreen');
		$title->setFontAlign(HAlign::haCenter);
		$this->addChild($title);					
	}
	protected function addControlButtons()
	{
		$b_div = new HDiv();
		$this->addChild($b_div);	
		//$b_div->setBorder(1);
		$line = new HLine(2, 'green');
		$line->setWidth(100, -1, -1, '%');
		$line->setMargin(0, -1, -1, -1, 'px');	
		$b_div->addChild($line);
		$control_div = new HFlexDiv();
		$control_div->setJustifyType(HFlexJustifyType::fjtRight);
		$b_div->addChild($control_div);	
		$this->addControlButton($control_div, "Previos", "../images/back.png", "db_new_table_prev_action");
		$this->addControlButton($control_div, "Next", "../images/right-arrow.png", "db_new_table_next_action");
		$this->addControlButton($control_div, "Create", "../images/ok.png", "db_new_table_create_action");		
	}
	protected function addControlButton($parent, $text, $icon_path = '', $js = '')
	{
		$btn = new HButton($text, $icon_path);
		$btn->addClass('control_button');
		if (!empty($js)) $btn->setJSFunc($js);
		$btn->setBackGround('CadetBlue');		
		$btn->setBorder(2, 'SteelBlue', 10);
		//$btn->setFontSize(12);			
		$btn->setWidth(90, -1, -1, 'px');
		$btn->setHeight(25, -1, -1, 'px');
		$btn->setMargin(-1, 10, 5, -1, 'px');
		$btn->setPadding(7, 1, -1, -1, 'px');
		$parent->addChild($btn);			
	}
	protected function addTabPage1($parent)
	{
		$page = new HFlexDiv();
		$page->setID('db_new_table_page1');
		$page->setWidth(100, -1, -1, '%');
		$parent->addChild($page);			
		$page->setJustifyType(HFlexJustifyType::fjtLeft);
		$text = new HText("     Enter table name:  ");
		$text->setSizeAuto(true, true);
		$page->addChild($text);			
		$edit = new HLineEdit();
		$edit->setID("db_new_table_name_input");
		$page->addChild($edit);	
	}
	protected function addTabPage2($parent)
	{
		$page = new HDiv();
		$page->setID('db_new_table_page2');
		$parent->addChild($page);		
		//$page->setBorder(2, 'red');
		$page->setWidth(100, -1, -1, '%');
		
		
		//flex div
		$mid_div = new HFlexDiv();		
		$page->addChild($mid_div);	
		$mid_div->setJustifyType(HFlexJustifyType::fjtLeft);				
		$mid_div->setMargin(5, -1, -1, -1, '%');				
		$page->addChild(new HLine(2, 'DarkSlateGray'));	
		
		
		//create inputs controls
		function addAttrDiv($parent, $input1, $input2 = null)
		{
			$cell_div = new HDiv();
			$cell_div->setMargin(10, -1, -1, -1, 'px');
			$parent->addChild($cell_div);									
			//$cell_div->setBorder(2, 'black');
			$cell_div->setWidth(20, -1,-1,'%');
			$cell_div->setPosition(HPositionType::hpRelative);

			$cell_div->addChild($input1);					
			if ($input2) 
			{
				$cell_div->addChild($input2);		
				$cell_div->setFontAlign(HAlign::haCenter);
			}
			else $input1->setPosition(HPositionType::hpAbsolute, -1, -1, 25, -1, '%');
		}

		//field name	
		$text = new HText("Field name");
		$edit = new HLineEdit();
		$edit->setID("db_new_table_field_input");
		$edit->setWidth(100, -1, -1, '%');
		addAttrDiv($mid_div, $text, $edit);
		
		//field data type	
		$text = new HText("Data type");		
		$arr = array('char' => "Char", 'string' => "String (max 100)", 'text' => "Text", 'float' => "Float",
		'int8' => "Int (8 bit)", 'int16' => "Int (16 bit)", 'int32' => "Int (32 bit)", 
		'uint8' => "Unsigned int (8 bit)", 'uint16' => "Unsigned int (16 bit)", 'uint32' => "Unsigned int (32 bit)");
		$combo = new HComboBox($arr);	
		$combo->setID("db_new_table_datatype_input");
		$combo->setWidth(100, -1, -1, '%');
		addAttrDiv($mid_div, $text, $combo);

		//field primary key
		$check_box = new HCheckBlock("Primary key");
		$check_box->setID("db_new_table_primary_input");
		addAttrDiv($mid_div, $check_box);
		
		//field unique
		$check_box = new HCheckBlock("Is unique");
		$check_box->setID("db_new_table_unique_input");
		addAttrDiv($mid_div, $check_box);
		
		//add button
		$add_field_btn = new HButton('', "../images/add.png");
		$add_field_btn->setID("add_field_btn");
		$add_field_btn->setHeight(30, -1, -1, 'px');
		$add_field_btn->setWidth(35, -1, -1, 'px');
		$add_field_btn->setBorder(2, 'Aquamarine', 10);
		$add_field_btn->setBackGround('LimeGreen');
		$add_field_btn->setJSFunc("db_new_table_add_field");
		addAttrDiv($mid_div, $add_field_btn);
		
		//table fields
		$tf = new HTable(1, 4);
		$tf->setID("db_new_table_fields_table");
		$page->addChild($tf);
		$tf->setBackGround('lightgray');
		$tf->setWidth(90, -1, -1, '%');
		$tf->setMargin(5, -1, -1, -1, '%');				
		$tf->setBorder(1, 'gray');
		$tf->setSelectableCell(false);
		$tf->setCaption("New table: ");
		$tf->setHeaderLabels(array("Field name", "Data type", "Primary key", "Unique"));
		$tf->setCellData(0, 0, "*");
			$caption_font = new HFont(16, 'gray');
			$caption_font->align = HAlign::haLeft;
			$tf->setCaptionFont($caption_font);
		
	}
	protected function addTabPage3($parent)
	{
		$page = new HDiv();
		$page->setID('db_new_table_page3');
		$parent->addChild($page);		
		$page->setBorder(2, 'red');
		$page->setWidth(100, -1, -1, '%');
		
		$t_div = new HDiv();
		$page->addChild($t_div);
		$t_div->setHeight(90, -1, -1, '%');
		$t_div->setBackGround('white');
		$t_div->setWidth(90, -1, -1, '%');
		$t_div->setMargin(5, -1, -1, -1, '%');				
		
		//table fields		
		$tf = new HTable(2, 2);
		$tf->setID("db_new_table_result_table");
		$t_div->addChild($tf);
		//$tf->setHeight(90, -1, -1, '%');
		$tf->setBackGround('white');
		$tf->setWidth(100, -1, -1, '%');
		//$tf->setMargin(5, -1, -1, -1, '%');				
		$tf->setBorder(1, 'green');
		$tf->setSelectableCell(false);
		$tf->setCaption("Model of table");
		$caption_font = new HFont(16, 'blue');
		$caption_font->align = HAlign::haLeft;
		$tf->setCaptionFont($caption_font);
		$tf->setCellData(0, 0, "*");
		$tf->setCellData(1, 0, "*");
		
		$status = new HText("Operation status:");
		$page->addChild($status);
		$status->setMargin(5, -1, 2, -1, '%');				

	}	
	

}

$div = new DB_NewTableDiv(78); 
$div->place();

	

/*
	$s = "REQ_TYPE: ".$_SERVER["REQUEST_METHOD"]."   GET number: ".count($_GET)."   POST number: ".count($_POST);
	echo $s, "\n";
    $s = "first param: ".$_POST['tname']; 	
	echo $s, "\n";
	print_r($_POST);
	print_r($_REQUEST);
	
	*/
	

?>

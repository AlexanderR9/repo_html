<?php	
	include_once('../phplib/h_object.php');
	include_once('../phplib/h_div.php');
	include_once('../phplib/h_content.php');
	include_once('../phplib/h_input.php');
	include_once('../phplib/h_table.php');
	include_once('../phplib/db.php');


//HTML content for user interface for constructor new table
class DB_NewTableDiv extends HDiv 
{
	public function __construct($width_percent) //constructor
	{
		parent::__construct('db_new_table_div');
		$this->setWidth($width_percent);
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
		$tab_div->setHeight(70, -1, -1, '%');
		$tab_div->setMargin(-1, -1, 20, 10, 'px');
		
		//add tab-pages
		$this->addTabPage1($tab_div);
		$this->addTabPage2($tab_div);		
		$this->addTabPage3($tab_div);		
		
		//control buttons block
		$this->addControlButtonsBar();		
	}
	protected function addCaption()
	{
		$title = new HText("Creating table for DB");
		$title->setBackGround('DarkSlateGray');
		$title->setFont(18, 'YellowGreen', HAlign::haCenter);			
		$title->setPadding(-1, -1, 8, 8);
		$this->addChild($title);					
	}
	protected function addControlButtonsBar()
	{
		$b_div = new HDiv();
		$this->addChild($b_div);	
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
		$btn->setJSFunc($js);
		$btn->setBackGround('CadetBlue');		
		$btn->setBorder(2, 'SteelBlue', 10);
		$btn->setWidth(90, -1, -1, 'px');
		$btn->setHeight(25, -1, -1, 'px');
		$btn->setMargin(-1, 10, 5, -1, 'px');
		$btn->setPadding(7, 1, -1, -1, 'px');
		$parent->addChild($btn);			
	}
	protected function addTabPage1($parent)
	{
		$page = new HFlexDiv('db_new_table_page1');
		$page->setWidth(100, -1, -1, '%');
		$parent->addChild($page);			
		$page->setJustifyType(HFlexJustifyType::fjtLeft);
		$text = new HText("     Enter table name:  ");
		$text->setSizeAuto(true, true);
		$page->addChild($text);			
		$edit = new HLineEdit("your_table_name", 'db_new_table_name_input');
		$page->addChild($edit);	
	}
	protected function addTabPage2($parent)
	{
		$page = new HDiv('db_new_table_page2');
		$parent->addChild($page);		
		$page->setWidth(100, -1, -1, '%');
		$field_attrs_div = new HFlexDiv();		
		$page->addChild($field_attrs_div);	
		$field_attrs_div->setJustifyType(HFlexJustifyType::fjtRound);				
		
		//create inputs controls
		function addAttrDiv($parent, $input1, $input2 = null)
		{
			$cell_div = new HDiv();
			$cell_div->setMargin(10, -1, -1, -1, 'px');
			$parent->addChild($cell_div);												
			$cell_div->setPosition(HPositionType::hpRelative);
			$cell_div->addChild($input1);	
			if (!$input1->isButton())
			{
				$cell_div->setWidth(22, -1,-1,'%');
				$input1->setWidth(100, -1,-1,'%');
			}
			else $cell_div->setWidth(10, -1,-1,'%');
			
			if ($input2) 
			{
				$input2->setWidth(100, -1,-1,'%');
				$cell_div->addChild($input2);		
				$cell_div->setFontAlign(HAlign::haCenter);
			}
			else $input1->setPosition(HPositionType::hpAbsolute, -1, -1, 25, -1, '%');
		}

		//field name	
		$edit = new HLineEdit("", 'db_new_table_field_input');
		addAttrDiv($field_attrs_div, new HText("Field name"), $edit);
		
		//field data type	
		$combo = new HComboBox(DBObject::userFieldTypes(), 'db_new_table_datatype_input');	
		addAttrDiv($field_attrs_div, new HText("Data type"), $combo);

		//field primary key
		$check_box = new HCheckBlock("Primary key", 'db_new_table_primary_input');
		addAttrDiv($field_attrs_div, $check_box);
		
		//field unique
		$check_box = new HCheckBlock("Is unique", 'db_new_table_unique_input');
		addAttrDiv($field_attrs_div, $check_box);
		
		//add button
		$add_field_btn = new HButton('', "../images/add.png");
		$add_field_btn->setHeight(30, -1, -1, 'px');
		$add_field_btn->setWidth(35, -1, -1, 'px');
		$add_field_btn->setBorder(2, 'Aquamarine', 10);
		$add_field_btn->setBackGround('LimeGreen');
		$add_field_btn->setJSFunc("db_new_table_add_field");
		addAttrDiv($field_attrs_div, $add_field_btn);

		//add separate line	
		$page->addChild(new HLine(2, 'DarkSlateGray'));			
		
		//table model fields
		$tf = new HTable(1, 4, 'db_new_table_fields_table');
		$page->addChild($tf);
		$tf->setBackGround('lightgray');
		$tf->setWidth(98, -1, -1, '%');
		$tf->setMargin(1, -1, -1, -1, '%');				
		$tf->setBorder(1, 'gray');
		$tf->setSelectableCell(false);
		$tf->setCaption("New table: ");
		$tf->setHeaderLabels(array("Field name", "Data type", "Primary key", "Unique"));
		$tf->setCellData(0, 0, "*");
		$tf->setCaptionFont(new HFont(16, 'gray', HAlign::haLeft));		
	}
	protected function addTabPage3($parent)
	{
		$page = new HDiv('db_new_table_page3');
		$parent->addChild($page);		
		$page->setWidth(100, -1, -1, '%');
		
		$t_div = new HDiv();
		$page->addChild($t_div);
		$t_div->setHeight(90, -1, -1, '%');
		$t_div->setTransparent(true);
		$t_div->setWidth(90, -1, -1, '%');
		$t_div->setMargin(5, -1, -1, -1, '%');		

		$text = new HText("Model view of new table:");	
		$t_div->addChild($text);
		$text->setFont(22, 'CadetBlue');
		$t_div->addChild(new HLine(1, 'gray'));
		$space_div = new HDiv();
		$space_div->setHeight(30, -1, -1, 'px');
		$space_div->setTransparent(true);
		$t_div->addChild($space_div);
		
		//table fields		
		$tf = new HTable(4, 12, 'db_new_table_result_table');
		$t_div->addChild($tf);
		$tf->setBackGround('Beige');
		$tf->setWidth(100, -1, -1, '%');
		$tf->setBorder(2);
		$tf->setSelectableCell(false);
		$tf->setCaption("Model of table");
		$tf->setCaptionFont(new HFont(16, 'blue', HAlign::haLeft));
		$tf->setCellData(3, 0, "*");		
		$status = new HText("Operation status:", 'db_new_table_status');
		$status->setMargin(5, -1, 2, -1, '%');				
		$page->addChild($status);
	}	
	

}

//create table action class
class DB_NewTableAction
{
	public function __construct(&$post_arr) //constructor
	{
		$this->fields_info = array();
		$this->parsePostParams($post_arr);
	}	

	public function hasErr() {return ($this->m_err != "");}
	public function err() {return $this->m_err;}
	public function sendSql()
	{
		$db = new DBObject();	
		if (!$db->isConnected()) {$this->m_err = "invalid connection to DB"; return;}
		
		$db->createTable($this->t_name, $this->fields_info);
		if ($db->hasErr()) $this->m_err = $db->lastErr();
		$db->closeConnection();
	}		

/////////////////protected section//////////////////	
	protected $m_err = "";
	protected $t_name = "";
	protected $fields_info = null;
		
	protected function parsePostParams(&$post_arr)
	{
		$p_count = count($post_arr);
		if ($p_count < 3) {$this->m_err = "Invalid parameters count: $p_count"; return;}
		if (!array_key_exists('t_name', $post_arr)) {$this->m_err = "key [t_name] not found in post params"; return;}
		
		$this->t_name = $post_arr['t_name'];
		for ($i=1; $i<$p_count; $i++)
		{
			$f_key = "field".$i;
			if (array_key_exists($f_key, $post_arr))
				$this->parseFieldInfo($_POST[$f_key]);
		}
		
		if (count($this->fields_info) < 2) 
			$this->m_err = "invalid parsed fields info, count(".count($this->fields_info).") < 2";				
	}
	protected function parseFieldInfo($s)
	{
		$v_arr = explode(';', $s);
		if (count($v_arr) != 4)
		{
			$this->m_err = "invalid field info: [$s]";
		}
		else
		{
			$f_info = array();
			array_push($f_info, trim($v_arr[1]), filter_var($v_arr[2], FILTER_VALIDATE_BOOLEAN), filter_var($v_arr[3], FILTER_VALIDATE_BOOLEAN));
			$this->fields_info[trim($v_arr[0])] = $f_info;
		}							
	}	
}



////////////////SCRIPT RESULT//////////////////////////////////
if ($_SERVER["REQUEST_METHOD"] == "GET") //if was GET request 
{
	$div = new DB_NewTableDiv(78); 
	$div->place();
}
else //if was POST request 
{
	$act = new DB_NewTableAction($_POST);
	if ($act->hasErr()) echo $act->err();
	else 
	{
		$act->sendSql();
		if ($act->hasErr()) echo $act->err();
		else echo "ok";		
	}	
}

	


?>

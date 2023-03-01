<?php	
	include_once('../phplib/h_object.php');
	include_once('../phplib/h_div.php');
	include_once('../phplib/h_content.php');
	include_once('../phplib/h_input.php');
	include_once('../phplib/h_table.php');
	include_once('../phplib/db.php');


//HTML content for user interface for constructor new table
class DB_RemoveTableDiv extends HDiv 
{
	public function __construct($width_percent) //constructor
	{
		parent::__construct('db_remove_table_div');
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
		$this->addTabPage1($tab_div); //combobox
		$this->addTabPage2($tab_div); //cur table info
		
		$status = new HText("Operation status:", 'db_remove_table_status');
		$status->setFont(16, 'gray');
		$status->setMargin(5, -1, -1, -1, '%');				
		$this->addChild($status);

		
		//control buttons block
		$this->addControlButtons();		
	}
	
	protected function addCaption()
	{
		$title = new HText("Creating table for DB");
		$title->setFont(18, 'YellowGreen', HAlign::haCenter);			
		$title->setPadding(-1, -1, 8, 8);
		$title->setBackGround('DarkSlateGray');
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
		$this->addControlButton($control_div, "Destroy table", "../images/remove.png", "db_remove_table_destroy_action");
	}
	protected function addControlButton($parent, $text, $icon_path = '', $js = '')
	{
		$btn = new HButton($text, $icon_path);
		$btn->addClass('control_button');
		$btn->setWidthChilds(60, -1);
		$btn->setFontAlign(HAlign::haCenter);
		$btn->setJSFunc($js);
		$btn->setBackGround('CadetBlue');		
		$btn->setBorder(2, 'SteelBlue', 10);
		$btn->setWidth(190, -1, -1, 'px');
		$btn->setHeight(25, -1, -1, 'px');
		$btn->setMargin(-1, 10, 5, -1, 'px');
		$parent->addChild($btn);			
	}
	protected function addTabPage1($parent)
	{
		$page = new HFlexDiv('db_remove_table_page1');
		$page->setWidth(30, -1, -1, '%');
		$parent->addChild($page);			
		$page->setJustifyType(HFlexJustifyType::fjtCenter);
		$text = new HText("     Choose table:  ");
		$text->setSizeAuto(true, true);
		$text->setFont(18, 'CadetBlue', HAlign::haCenter);
		$page->addChild($text);			
		
		//add combo with table list		
		$tlist = array();
		$ok = true;
		$db = new DBObject();	
		if (!$db->isConnected()) 
		{
			array_push($tlist, "Error connect to DB");
			$ok = false;
		}
		else
		{
			$tlist = $db->tableList();
			if ($db->hasErr()) {array_push($tlist, "ERR: ".$db->lastErr()); $ok = false;}
			$db->closeConnection();				
		}
		$combo = new HComboBox($tlist);			
		if ($ok) $combo->setJSFunc('db_remove_table_combo_changed'); 
		$page->addChild($combo);	
	}
	protected function addTabPage2($parent)
	{
		$page = new HDiv('db_remove_table_page1');
		$parent->addChild($page);		
		$page->setWidth(70, -1, -1, '%');
		
		$t_div = new HDiv('db_remove_table_info_div');
		$t_div->setTransparent(true);
		$page->addChild($t_div);

				
		//table fields
		$tf = new HTable(4, 2, 'db_remove_table_info_table');
		$t_div->addChild($tf);
		$tf->setBackGround('lightgray');
		$tf->setWidth(90, -1, -1, '%');
		$tf->setMargin(5, -1, -1, -1, '%');				
		$tf->setBorder(1, 'gray');
		$tf->setSelectableCell(false);
		$tf->setCellData(0, 0, "*");
		$tf->setCaption("Info of table: ");
		$tf->setCaptionFont(new HFont(16, 'CadetBlue', HAlign::haLeft));		
	}

}

//create table action class
class DB_RemoveTableAction
{
	public function __construct(&$post_arr) //constructor
	{
		//$this->fields_info = array();
		$this->parsePostParams($post_arr);
	}	
	public function hasErr() {return ($this->m_err != "");}
	public function err() {return $this->m_err;}
	public function runAction()
	{
		if ($this->m_actionType == "get_info")
		{
			$arr = array();
			$rows = -1;
			$this->getTableInfo($arr, $rows);
			if ($this->hasErr()) echo $this->err();
			else 
			{
				$t = new HTable(count($arr), 2, 'db_remove_table_info_table');
				$t->setHeaderLabels(array("Field name", "Field info"));
				$t->setBackGround('lightgray');
				$t->setWidth(94, -1, -1, '%');
				$t->setMargin(3, -1, -1, -1, '%');				
				$t->setBorder(2, 'CadetBlue');
				$t->setSelectableCell(false);
				$t->setCaption("Info of table: ".$this->t_name." (records $rows)");
				$t->setCaptionFont(new HFont(16, 'CadetBlue', HAlign::haLeft));		
				
				$i = 0;
				foreach ($arr as $key => $value) 
				{
					$t->setCellData($i, 0, $key);
					$t->setCellData($i, 1, $value);
					$i++;
				}
				
				$t->place();
			}
		}
		else if ($this->m_actionType == "destroy")
		{
			$this->destroyTable();
			if ($this->hasErr()) echo $this->err();
			echo "ok";
		}
		else
		{
			echo "Invalid action: [$this->m_actionType]";
		}
	}
	

/////////////////protected section//////////////////	
	protected $m_err = "";
	protected $t_name = "";
	protected $m_actionType = "";
	
	
	protected function parsePostParams(&$post_arr)
	{
		$p_count = count($post_arr);
		if ($p_count != 2) {$this->m_err = "Invalid parameters count: $p_count"; return;}

		//get table name	
		if (!array_key_exists('t_name', $post_arr)) {$this->m_err = "key [t_name] not found in post params"; return;}
		else $this->t_name = $post_arr['t_name'];
		
		//get action type
		if (!array_key_exists('action', $post_arr)) {$this->m_err = "key [action] not found in post params"; return;}
		else $this->m_actionType = $post_arr['action'];
	}
	protected function getTableInfo(&$arr, &$rows)
	{
		$db = new DBObject();	
		if (!$db->isConnected()) {$this->m_err = "invalid connection to DB"; return;}
						
		$arr = $db->getTableDataTypes($this->t_name);
		if ($db->hasErr()) $this->m_err = $db->lastErr();
		else
		{
			$rows = $db->tableRowCount($this->t_name);
			if ($db->hasErr()) $this->m_err = $db->lastErr();
		}			

		if (!$this->hasErr())
		{
			foreach($arr as $field => $field_attrs)					
			{
				//field_attrs:  datatype, is_primary_key, is_unique)
				$s = $field_attrs[0];
				if ($field_attrs[1]) $s = $s." (PRIMARY)";
				else if ($field_attrs[2]) $s = $s." (UNIQUE)";
				$arr[$field] = $s;
			}
		}
		
		$db->closeConnection();		
	}	
	protected function destroyTable()
	{
		$db = new DBObject();	
		if (!$db->isConnected()) {$this->m_err = "invalid connection to DB"; return;}		
		$db->removeTable($this->t_name);
		if ($db->hasErr()) $this->m_err = $db->lastErr();
		$db->closeConnection();		
	}
	
	
}



////////////////SCRIPT RESULT//////////////////////////////////
if ($_SERVER["REQUEST_METHOD"] == "GET") //if was GET request 
{
	$div = new DB_RemoveTableDiv(78); 
	$div->place();
}
else //if was POST request 
{
	$act = new DB_RemoveTableAction($_POST);
	if ($act->hasErr()) echo $act->err();
	else $act->runAction();
}

	


?>

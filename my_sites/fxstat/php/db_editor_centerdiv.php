<?php 

class DBEditorCenterDiv extends HDiv 
{
	public function __construct($width_percent) //constructor
	{
		parent::__construct();
		$this->setID("db_center_div");
		$this->setWidth($width_percent);
		$this->setBorder(2, 'Sienna');
		$this->initContent();
	}	


/////////////////protected section//////////////////	
	protected function initContent()
	{
		$db = new DBObject(); //connect to DB	
		if (!$db->isConnected())
		{
			$db->printErr();
			return;
		}
		
		$t = null;
		$this->initTable($t, $db->tableCount());
		if (!$t) echo_br("invalid create table object", 'red');
		{
			$this->addChild($t);	
			$this->fillTable($t, $db);
		}			

		$db->closeConnection(); //close DB
	}
	protected function initTable(&$t, $n_tables)
	{
		$t = new HTable($n_tables, 4);
		$t->setBackGround('LightYellow');
		$t->setBorder(3, 'gray');
		$t->setWidth(96, -1, -1, '%');
		$t->setMargin(2, -1, -1, -1, '%');
		
		//set caption
		$t->setCaption("Tables");
		$caption_font = new HFont();
		$caption_font->text_color = 'gray';
		$caption_font->size = 18;
		$caption_font->is_italic = true;
		$caption_font->align = HAlign::haLeft;
		$t->setCaptionFont($caption_font);
		
		//set headers
		$t->setHeaderLabels(array("Name", "N fields", "Primary key", "Records count"));		
	}
	protected function fillTable(&$t, &$db)
	{
		$t_list = $db->tableList();		
		if ($db->hasErr()) {$db->printErr(); return;}
				
		foreach($t_list as $i => $t_name)
		{
			$t->setCellData($i, 0, $t_name);
			$arr = $db->getTableDataTypes($t_name);
			if ($db->hasErr()) {$db->printErr(); return;}
						
			$t->setCellData($i, 1, count($arr));
			$t->setCellData($i, 3, $db->tableRowCount($t_name));
			
			$f_primary = '';
			foreach($arr as $field => $field_attrs)
			{
				if ($field_attrs[1]) $f_primary = $field;
			}
			if (empty($f_primary)) $f_primary = 'NO';
			$t->setCellData($i, 2, $f_primary);
		}
	}	
}



?>



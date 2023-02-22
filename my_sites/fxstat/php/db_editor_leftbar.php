<?php 

class DBEditorLeftbar extends HDiv 
{
	public function __construct($width_percent) //constructor
	{
		parent::__construct();
		$this->setID("db_left_div");
		$this->setWidth($width_percent);
		$this->initContent();
	}	


/////////////////protected section//////////////////	
	protected function initContent()
	{
		$db = new DBObject(); //connect to DB	
		if (!$db->isConnected())
		{
			addLeftBarTitle($left_div, "Table list (???)");		
			$db->printErr();
			return;
		}
		
		//init table list
		$this->addBarTitle("Table list (".$db->tableCount().")");		
		$this->addTablesList($db->tableList());		
		$this->addSpace(140);

		//control buttons
		$this->addBarTitle("Control");
		$this->addBarButton("Create new table", "../images/db_new_table.png", "../js/db_new_table.js");
		$this->addBarButton("Remove table", "../images/db_remove_table.png", "../js/db_remove_table.js");
		$this->addBarButton("Modify table fields", "../images/db_settings.png");
		$this->addSpace(140);


		$db->closeConnection(); //close DB
	}
	protected function addBarTitle($text)
	{
		$title = new HText($text);
		$title->setFontSize(18);			
		$title->setPadding(-1, -1, 8, 8);
		$title->setBackGround('DarkSlateGray');
		$title->setFontTextColor('YellowGreen');
		$title->setFontAlign(HAlign::haCenter);
		$this->addChild($title);			
	}
	protected function addBarButton($text, $icon_path = '', $js = '')
	{
		$btn = new HButton($text, $icon_path);
		//$btn->setJSScript($js);
		$btn->setJSFunc(basename($js, '.js'));
		$btn->setBackGround('SteelBlue');		
		$btn->setBorder(3, 'Azure', 20);
		$btn->setFontSize(16);			
		$btn->setWidth(90, -1, -1, '%');
		$btn->setHeight(36, -1, -1, 'px');
		$btn->setMargin(5, -1, 5, 5, '%');
		$btn->setPadding(7, 7, -1, -1, '%');
		$this->setID("db_left_div");
		$this->addChild($btn);			
	}
	protected function addSpace($h_size)
	{
		$space_div = new HDiv();
		$space_div->setHeight($h_size, -1, -1, 'px');
		$space_div->addClass("hidden_child");
		$this->addChild($space_div);	
	}
	protected function addTablesList($t_list)
	{
		if (empty($t_list))
		{
			echo_br("tables list is empty", 'red');
			return;
		}
		foreach($t_list as $value)
		{
			$htext = new HText("&#9885;  ".$value);
			$htext->setMargin(20, -1, 10, 10);
			$htext->setFontTextColor('SteelBlue');
			$htext->setFontSize(16);			
			$this->addChild($htext);			
		}		
	}
	
}



?>



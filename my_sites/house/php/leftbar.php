<?php 

class Leftbar extends HDiv 
{
	public function __construct($width_percent) //constructor
	{
		parent::__construct('left_div');
		$this->setWidth($width_percent);
		$this->setBackGround('LightSalmon');
		$this->setHeight(700, -1, -1, 'px');
		$this->initContent();
	}	

/////////////////protected section//////////////////	
	protected function initContent()
	{
		//init table list
		$this->addBarTitle("Parameters");		
		/*
		$this->addTablesList($db->tableList());		
		$this->addSpace(140);
		$db->closeConnection(); //close DB

		//control buttons
		$this->addBarTitle("Control");
		$this->addBarButton("Create new table", "../images/db_new_table.png", "db_new_table");
		$this->addBarButton("Remove table", "../images/db_remove_table.png", "db_remove_table");
		$this->addBarButton("Modify table fields", "../images/db_settings.png");
		$this->addSpace(140);
		*/
	}
	protected function addBarTitle($text)
	{
		$title = new HText($text);
		$title->setFont(18, 'YellowGreen', HAlign::haCenter);			
		$title->setPadding(-1, -1, 8, 8);
		$title->setWidth(100);
		$title->setMargin(-1, -1, 0, -1, '%');
		$title->setBackGround('DarkSlateGray');
		$this->addChild($title);			
	}
	protected function addBarButton($text, $icon_path = '', $js = '')
	{
		$btn = new HButton($text, $icon_path);
		$btn->setJSFunc($js);
		$btn->setBackGround('SteelBlue');		
		$btn->setBorder(3, 'Azure', 20);
		$btn->setFont(16);			
		$btn->setWidth(90, -1, -1, '%');
		$btn->setHeight(36, -1, -1, 'px');
		$btn->setMargin(5, -1, 5, 5, '%');
		$btn->setPadding(7, 7, -1, -1, '%');
		$this->addChild($btn);			
	}
}

?>



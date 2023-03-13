<?php 

class CanvasDiv extends HDiv 
{
	public function __construct($width_percent) //constructor
	{
		parent::__construct('project_div');
		$this->setWidth($width_percent);
		$this->setMargin(2, 2, 1, -1, '%');
		$this->setTransparent(true);
		$this->setHeight(600, -1, -1, 'px');		
		$this->initContent();
	}	

/////////////////protected section//////////////////	
	protected function initContent()
	{		
		$title = new HText("Canvas");
		$title->setFont(18, 'Chocolate', HAlign::haCenter);			
		$title->setWidth(100);
		$this->addChild($title);			

		$div = new HDiv('canvas_div');
		$div->setTransparent(true);
		$div->setHeight(100);
		$div->setWidth(100);
		$div->setPadding(2, -1, 2, -1, 'px');
		$div->setBorder(2, 'Thistle', 20);		
		//$canvas = new HCanvasDiv('canvas');
		//$canvas->setBorder(1, 'white', 15);		
		//$canvas->setMargin(20, -1, 20, -1, 'px');
		//$div->addChild($canvas);
		$this->addChild($div);					
	}
}

?>



<?php 

class HeaderDiv extends HDiv 
{
	public function __construct() //constructor
	{
		parent::__construct('header_div');
		$this->setBackground('YellowGreen');		
		$this->setHeight(60, -1, -1, 'px');
		$this->initContent();
	}	
	//protected
	protected function initContent()
	{
		$text = new HText("House project");
		$text->setFont(22, 'BlanchedAlmond');
		$text->setMargin(20, -1, -1, -1, '%');
		$text->setFontBoldItalic(false, true);
		$text->setPosition(HPositionType::hpRelative, -1, -1, 30, -1, '%');
		$this->addChild($text);		
				
		$this->addDSwitcher("2D", 60, '%');
		$this->addDSwitcher("3D", 30, 'px');		
		
		
		$other_styles = "";
		$other_styles = $other_styles."\n".".D_type {color: white; font-size: 22px}";
		$other_styles = $other_styles."\n".".D_type:hover { font-weight: bold; border: 2px solid pink; cursor: pointer; }";
		//background: white;
		
		$this->setChildsStyle($other_styles);
	}
	protected function addDSwitcher($caption, $margin_size, $margin_unit)
	{
		$text = new HText($caption, strtolower($caption));
		$text->addClass('D_type');
		$text->setFont(22, 'gray');
		$text->setMargin($margin_size, -1, -1, -1, $margin_unit);
		$text->setPadding(10, 10, -1, -1, 'px');
		$text->setPosition(HPositionType::hpRelative, -1, -1, 30, -1, '%');
		$this->addChild($text);		
	}
	
	
}

?>



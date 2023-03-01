<?php	


//////////////// HText (paragraph element) ///////////////////////
class HText extends HObject 
{
	public function __construct($text_value = '', $id = '') //constructor
	{
		parent::__construct($id);
		$this->m_tagName = 'p';	
		$this->setText($text_value);
		$this->m_displayMode = HDisplayMode::hdmInlineBlock;
	}	
	
	public function setSizeAuto($w_auto, $h_auto) {$this->with_auto = $w_auto; $this->height_auto = $h_auto;}
	public function setLink($link) {$this->m_link = $link;}	
	public static function spaceSymbol() {return '&nbsp;';}
	
	//set text value of this element
	public function setText($text) 
	{
		if (empty($text)) return;
		$this->m_text = $text;
		$this->m_text = str_replace(' ', '&nbsp;', $this->m_text);
	}
	public function setSpaceElement($n_space = 20)
	{
		$this->m_text = HText::spaceSymbol();
		for ($i=0; $i<$n_space; $i++)
			$this->m_text = $this->m_text.HText::spaceSymbol();			
	}		
	
	//protected section	
	protected $with_auto = false;
	protected $height_auto = true;
	protected $m_text = 'text';
	protected $m_link = null;
		
	protected function placeContent() 
	{
		if ($this->m_link) $this->m_link->placeTextContent($this->m_text);
		else echo $this->m_text; print("\n");
	}		
	protected function styleValue() //return style values of attrs OR ""
	{
		$s = '';
		if ($this->with_auto) $s = $s."width: auto; ";
		if ($this->height_auto) $s = $s."height: auto; ";
		return trim($s.parent::styleValue());
	} 					
}


//////////////// HImage (image element) ///////////////////////
class HImage extends HObject 
{
	public function __construct($path, $id = '') //constructor
	{
		parent::__construct($id);
		$this->m_tagName = 'img';	
		$this->m_path = $path;
		$this->m_displayMode = HDisplayMode::hdmInlineBlock;
	}	
	
	public function setLink($link) {$this->m_link = $link;}	
	public function setAltText($text) {$this->m_altText = $text;}	
	public function setOverText($text) {$this->m_overText = $text;}	
	public function getOverText() {return $this->m_overText;}
	public function place() //overload func
	{
		if ($this->m_link) $this->m_link->placeBegin();
		$this->placeBegin();
		if ($this->m_link) $this->m_link->placeEnd();
	}
		
	//protected section	
	protected $m_path = '';
	protected $m_altText = '';
	protected $m_overText = '';
	protected $m_link = null;
	
	
	protected function placeContent() 
	{
		//if ($this->m_link) $this->m_link->placeTextContent($this->m_text);
		//else echo $this->m_text; 
		print("\n");
	}		
	protected function otherAttrs() 
	{
		$s = "src=\"$this->m_path\"";
		if (!empty($this->m_altText)) $s = $s." alt=\"$this->m_altText\"";		
		return $s;
	}
}



//////////////// HButton (button element) ///////////////////////
class HButton extends HFlexDiv 
{
	public function __construct($caption, $icon_path = '', $id = '') //constructor
	{
		parent::__construct($id);
		$this->m_tagName = 'button';	
		$this->m_caption = $caption;	
		$this->m_icon = $icon_path;	
		$this->setJustifyType(HFlexJustifyType::fjtCenter);
	}	
	public function setJSScript($js) 
	{
		$this->m_jsScript = trim($js);
		if (!empty($this->m_jsScript))
		{
			$js_id = basename($this->m_jsScript, '.js');
			$this->setID($js_id);
		}			
	}
	public function setJSFunc($js) //имя функции задавать без скобок
	{
		$this->m_jsFunc = trim($js);
		if (!empty($this->m_jsFunc))
			$this->setID($this->m_jsFunc);
	}
	public function setWidthChilds($wtext, $wicon)
	{
		$this->w_icon = $wicon;
		$this->w_text = $wtext;
	}
			
	//protected section	
	protected $m_caption = '';
	protected $m_icon = '';
	protected $m_jsScript = '';
	protected $m_jsFunc = '';
	protected $w_icon = -1;
	protected $w_text = -1;
	
	protected function placeContent() 
	{
		if (!empty($this->m_icon)) 
		{
			$icon = new HImage($this->m_icon);
			$icon->setHeight(90, -1, -1, '%');
			if ($this->w_icon > 0) $icon->setWidth($this->w_icon, -1, -1, '%');
			$this->addChild($icon);
		}
		if (!empty($this->m_caption)) 
		{
			$text = new HText($this->m_caption);
			if ($this->w_text > 0) $text->setWidth($this->w_text, -1, -1, '%');
			$this->addChild($text);
		}
		if (!empty($this->m_jsScript)) 
		{
			echo "<script>", "\n";	
			echo "document.getElementById(\"$this->m_id\").onclick = function() {import('$this->m_jsScript');}", "\n";	
			echo "</script>", "\n";	
		}
		else if (!empty($this->m_jsFunc)) 
		{
			echo "<script>", "\n";	
			echo "document.getElementById(\"$this->m_id\").addEventListener('click', $this->m_jsFunc);", "\n";	
			//echo "this.onclick =  function() {console.log(*****); \$this->m_jsFunc();}", "\n";	
			echo "</script>", "\n";	
		}			
		$this->setFontAlign(HAlign::haCenter);		
		parent::placeContent();		
	}		
	protected function otherAttrs() 
	{
		$s = "type=\"button\"";
		return $s;
	}
	protected function styleValue() //return style values of attrs OR ""
	{
		$s = "align-items: center; ";
		$s = $s.parent::styleValue();
		return trim($s);
	} 
	

}

////////////HLine////////////////////////
class HLine extends HObject 
{
	public function __construct($w = 1, $color = 'gray', $id = '') //constructor
	{
		parent::__construct($id);
		$this->m_tagName = 'hr';
		$this->m_displayMode = HDisplayMode::hdmInlineBlock;		
		$this->setWidth(98, -1, -1, '%');
		$this->setHeight($w, -1, -1, 'px');
		$this->setMargin(1, -1, -1, -1, '%');
		$this->setBackGround($color);
	}	
	public function place() //overload func
	{
		$this->placeBegin();
	}

		
	protected function placeContent() {}

}


?>


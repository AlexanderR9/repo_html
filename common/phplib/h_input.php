<?php	


//////////////// HComboBox  ///////////////////////
//выпадающий список с набором итемов
class HComboBox extends HObject 
{
	public function __construct($data = null, $id = '') //constructor
	{
		parent::__construct($id);
		$this->m_tagName = 'select';	
		$this->m_displayMode = HDisplayMode::hdmInline;
		$this->setFontAlign(HAlign::haCenter);
		
		if (is_array($data)) $this->m_data = $data;
		else $this->m_data = array();
		
		$this->setHeight(24, -1, -1, 'px');
		$this->setWidth(100, -1, -1, 'px');
		$this->setBorder(1, 'gray', 3);
		$this->setBackGround('White');
	}	
	
	public function itemsCount() {if (is_array($this->m_data)) return count($this->m_data); return 0;}
	public function isEmpty() {return ($this->itemsCount() == 0);}
	public function addItem($key, $item_text) {$this->m_data[$key] = $item_text;}	
	public function setJSFunc($js) //имя функции задавать без скобок
	{
		$this->m_jsFunc = trim($js);
		if (!empty($this->m_jsFunc))
			$this->setID($this->m_jsFunc);
	}
	
	
	//protected section
	
	//данные combobox, представляет из себя строковый одномерный массив каждый элемент сопровождается ключем 
	//индексация итемов с 0
	protected $m_data = null; 
	
	//имя функции которая выполняется по событию - смена итема
	protected $m_jsFunc = '';

	
	protected function placeContent() 
	{
		if ($this->isEmpty()) return;
		
		if (!empty($this->m_jsFunc)) 
		{
			echo "<script>", "\n";	
			echo "document.getElementById(\"$this->m_id\").addEventListener('change', $this->m_jsFunc);", "\n";	
			echo "</script>", "\n";	
		}			
		
		foreach($this->m_data as $key => $value)
		{
			echo "<option value=\"$key\">$value</option>", "\n"; 
		}		
	}					
}


//базовый класс тега <input>
class HInputBase extends HObject 
{
	public function __construct($id = '') //constructor
	{
		parent::__construct($id);
		$this->m_tagName = 'input';	
		$this->m_displayMode = HDisplayMode::hdmInline;		
		$this->setHeight(22, -1, -1, 'px');
		$this->setBorder(1, 'gray');
		$this->setBackGround('White');
	}	
	public function place() //overload func
	{
		$this->placeBegin();
	}

	//protected section
	protected $m_type = '';
		
	protected function otherAttrs() 
	{
		$s = "type=\"$this->m_type\" ";
		return trim($s.parent::otherAttrs());
	}
	protected function placeContent() {}
}



//////////////// HLineEdit  ///////////////////////
//поле для ввода
class HLineEdit extends HInputBase 
{
	public function __construct($text = '', $id = '') //constructor
	{
		parent::__construct($id);
		$this->m_text = $text;
		$this->m_readOnly = false;
		$this->m_type = 'text';		
		$this->setWidth(150, -1, -1, 'px');
	}	
	
	public function setText($text) {$this->m_text = $text;}
	public function setReadOnly($b) {$this->m_readOnly = $b;}

	//protected section
	protected $m_text = '';
	protected $m_readOnly = false;
	
	protected function otherAttrs() 
	{
		$s = "value=\"$this->m_text\" ";
		if ($this->m_readOnly) $s = $s." readonly ";
		return trim($s.parent::otherAttrs());
	}
}

//////////////// HCheckBox  ///////////////////////
class HCheckBox extends HInputBase
{
	public function __construct($id = '') //constructor
	{
		parent::__construct($id);
		$this->m_checked = false;
		$this->m_type = 'checkbox';		
		$this->setHeight(15, -1, -1, 'px');
		$this->setWidth('auto', -1, -1, '');
		$this->setMargin(7, 10, 3, -1, 'px');
	}	
	public function setChecked($b) {$this->m_checked = $b;}

	//protected section
	protected $m_checked = false;	
	protected function otherAttrs() 
	{
		$s = "";
		if ($this->m_checked) $s = $s." checked ";
		return trim($s.parent::otherAttrs());
	}
}

//////////////// HCheckBlock  ///////////////////////
class HCheckBlock extends HDiv
{
	public function __construct($caption, $id = '') //constructor
	{
		parent::__construct();
		$this->m_displayMode = HDisplayMode::hdmInlineBlock;
		$this->setHeight(22, -1, -1, 'px');
		$this->setTransparent(true);		
		$this->m_captionObj = new HText($caption);
		$this->m_captionObj->setDisplayMode(HDisplayMode::hdmInline);
		$this->m_checkObj = new HCheckBox($id);				
		$this->addChild($this->m_checkObj);
		$this->addChild($this->m_captionObj);
	}	
	public function setFontSize($size) 
	{
		$this->setHeight($size*1.5, -1, -1, 'px');		
		$this->m_captionObj->setFontSize($size);
		$this->m_checkObj->setHeight($size, -1, -1, 'px');		
	}
	public function setChecked($b) {$this->m_checkObj->setChecked($b);}
	public function setID($id) {$this->m_checkObj->setID($id);}

	//protected section
	protected $m_captionObj = null;
	protected $m_checkObj = null;
}


//////////////// HGroupBox /////////////////////
class HGroupBox extends HDiv
{
	public function __construct($title, $id = '') //constructor
	{
		parent::__construct($id);
		$this->m_tagName = 'fieldset';	
		$this->setBorder(1, 'green', 5);
		$this->setTransparent(true);
		$this->m_title = $title;
	}	
		
	//protected section
	protected $m_title = '';	
	protected function placeContent() 
	{
		echo "<legend style=\"margin-left: 20px; text-indent: 5px; padding-right: 5px; \">$this->m_title</legend>", "\n";	
		parent::placeContent();		

	}

}


?>


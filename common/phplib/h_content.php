<?php	


//////////////// HText (paragraph element) ///////////////////////
class HText extends HObject 
{
	public function __construct($text_value = '') //constructor
	{
		parent::__construct();
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

//////////////// HDiv (block element) ///////////////////////
class HDiv extends HObject 
{
	public function __construct() //constructor
	{
		parent::__construct();
		$this->m_tagName = 'div';
		$this->m_childs = array();
		$this->m_displayMode = HDisplayMode::hdmBlock;
	}	
	public function addChild($child_obj) {array_push($this->m_childs, $child_obj);}
	public function setScroll($b) {$this->m_scroll = $b;}
	public function setChildsStyle($styles) {$this->m_childsStyle = $styles;}
	
		
	//protected section	
	protected $m_childs = null; //array of HObject
	protected $m_scroll = false;	
	protected $m_childsStyle = ''; //дополнительные стили для описания поведения элементов находящихся внутри этого блока (example: a {width:10px; margin:auto;})
		
	protected function placeContent() 
	{
		if (!empty($this->m_childsStyle))
		{
			echo "<style>", "\n";
			echo $this->m_childsStyle, "\n";
			echo "</style>", "\n";
		}
		
		if (!$this->hasChilds()) return;		
		foreach($this->m_childs as $child)
			$child->place();			
	}	
	protected function hasChilds() {return (count($this->m_childs) > 0);}
	protected function childsCount() {return count($this->m_childs);}		
	protected function styleValue() //return style values of attrs OR ""
	{
		$s = '';
		if ($this->m_scroll) $s = $s."overflow:auto; ";
		return trim($s.parent::styleValue());
	} 			
}

//class flex block
class HFlexDiv extends HDiv
{	
	public function __construct() //constructor
	{
		parent::__construct();
		$this->m_displayMode = HDisplayMode::hdmFlex;
	}
	public function setEvenlyChilds() //сделать ширину всех детей одинаковую и разложить их равномерно по всей длине блока-parent
	{
		if (!$this->hasChilds()) return;
		
		$w = (int)(100/$this->childsCount());
		foreach ($this->m_childs as $item)
		{
			$item->setWidth($w, -1, -1, '%');
		}
	}		
	public function addChildToItem($i, $child_obj) 
	{
		if ($i < 0 || $i >= $this->childsCount()) return;		
		$this->m_childs[$i]->addChild($child_obj);
	}
	protected function styleValue() //return style values of attrs OR ""
	{
		$s = "justify-content: space-between; ";
//		$s = "justify-content: space-around; ";
//		$s = "justify-content: center; ";
		$s = $s.parent::styleValue();
		return trim($s);
	} 
	
}

//класс для создания матрицы блоков
class HMatrixDiv extends HDiv
{
	public function __construct($rows, $cols) //constructor
	{
		parent::__construct();
		$this->m_rows = $rows;
		$this->m_cols = $cols;
		
		if ($this->invalid()) echo_br("INVALID MATRIX");
		else 
		{
			$this->setTransparent(true);
			$this->initMatrix();
			$this->recalcWidthCols();
		}
	}			
	public function invalid()
	{
		if ($this->m_rows < 1 || $this->m_cols < 1) return true;
		if (($this->m_rows + $this->m_cols) < 3) return true;
		return false;		
	}
	public function setMarginItems($m) //задать отступы между итемами со всех сторон, %
	{
		if ($this->invalid()) return;
		$this->m_magrinItems = $m;
		$this->recalcWidthCols();		
	}
	public function setCellObject($i, $j, $hobj)
	{
		$item = $this->getElement($i, $j);
		if (!$item) 
		{
			echo_br("setCellObject: invalid item by (i=$i, j=$j)", 'red'); 
			return;
		}
		$item->addChild($hobj);		
	}
	public function setTransparentRows() 
	{
		for ($i=0; $i<$this->m_rows; $i++)
			$this->m_childs[$i]->setTransparent(true); 
	}
	public function setTransparentCells() 
	{
		for ($i=0; $i<$this->m_rows; $i++)
			for ($j=0; $j<$this->m_cols; $j++)
			{
				$item = $this->getElement($i, $j);
				$item->setTransparent(true); 
			}
	}

	
	
	//protected section
	protected $m_rows = -1;
	protected $m_cols = -1;
	protected $m_magrinItems = 1; //%
	
	protected function initMatrix()
	{
		for ($i=0; $i<$this->m_rows; $i++)
		{
			$row_div = new HFlexDiv();
			$row_div->setBackGround('Gray');
			//$row_div->setBorder(1, 'red');
			//$row_div->setHeight(20);
			$this->addChild($row_div);
						
			for ($j=0; $j<$this->m_cols; $j++)
			{
				$col_div = new HDiv();
				$col_div->setBackGround('LightGray');
				//$col_div->setBorder(1, 'white');
				$this->m_childs[$i]->addChild($col_div);		
			}						
		}			
	}
	protected function recalcWidthCols()
	{
		$space_margin = $this->m_cols*$this->m_magrinItems*2;
		$w_col = (int)((100-$space_margin)/$this->m_cols);
		for ($i=0; $i<$this->m_rows; $i++)
		{
			for ($j=0; $j<$this->m_cols; $j++)
			{
				$item = $this->getElement($i, $j);
				if ($item) 
				{
					$item->setWidth($w_col);				
					$item->setMargin($this->m_magrinItems, $this->m_magrinItems, $this->m_magrinItems, $this->m_magrinItems);
					$item->setMarginUnits('%');				
				}
			}
		}			
	}
	protected function getElement($i, $j)
	{
		if ($i < 0 || $i >= $this->m_rows) return null;
		if ($j < 0 || $j >= $this->m_cols) return null;
		return $this->m_childs[$i]->m_childs[$j];
	}	
}

//////////////// HImage (image element) ///////////////////////
class HImage extends HObject 
{
	public function __construct($path) //constructor
	{
		parent::__construct();
		$this->m_tagName = 'img';	
		$this->m_path = $path;
		$this->m_displayMode = HDisplayMode::hdmInlineBlock;
	}	
	
	public function setLink($link) {$this->m_link = $link;}	
	public function setAltText($text) {$this->m_altText = $text;}	
	public function place() //overload func
	{
		if ($this->m_link) $this->m_link->placeBegin();
		$this->placeBegin();
		if ($this->m_link) $this->m_link->placeEnd();
	}
		
	//protected section	
	protected $m_path = '';
	protected $m_altText = '';
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
		return "src=\"$this->m_path\"";
	}


}



?>


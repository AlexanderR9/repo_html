<?php	


//////////////// HDiv (block element) ///////////////////////
class HDiv extends HObject 
{
	public function __construct($id = '') //constructor
	{
		parent::__construct($id);
		$this->m_tagName = 'div';
		$this->m_childs = array();
		$this->m_displayMode = HDisplayMode::hdmBlock;
	}	
	public function addChild($child_obj) {array_push($this->m_childs, $child_obj);}
	public function setScroll($b) {$this->m_scroll = $b;}
	public function setChildsStyle($styles) {$this->m_childsStyle = $styles;}
	public function hasChilds() {return (count($this->m_childs) > 0);}
	public function childsCount() {return count($this->m_childs);}		
	
	public function showChildsBorder($w = 1, $color = 'gray') //показать рамки всех детей (диогностическая функ.)
	{
		foreach($this->m_childs as $child)
			$child->setBorder($w, $color);
	}
		
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
	public function __construct($id = '') //constructor
	{
		parent::__construct($id);
		$this->m_displayMode = HDisplayMode::hdmFlex;
		$this->m_justifyType = HFlexJustifyType::fjtBetween;
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
	public function setJustifyType($jt) {$this->m_justifyType = $jt;}

	
	//protected section
	protected $m_justifyType = null;
	
	
	protected function justifyValue()
	{
		switch ($this->m_justifyType)
		{
			case HFlexJustifyType::fjtBetween: {return 'space-between';}
			case HFlexJustifyType::fjtRound: {return 'space-around';}
			case HFlexJustifyType::fjtCenter: {return 'center';}
			case HFlexJustifyType::fjtLeft: {return 'start';}
			case HFlexJustifyType::fjtRight: {return 'flex-end';}
			default: break;
		}
		return '';
	}
	
	protected function styleValue() //return style values of attrs OR ""
	{
		$s = $this->justifyValue();
		if (!empty($s)) $s = "justify-content: $s; ";
		$s = $s.parent::styleValue();
		return trim($s);
	} 
	
}

//class space block
class HSpaceDiv extends HDiv
{	
	public function __construct($size, $u = 'px', $id = '') //constructor
	{
		parent::__construct($id);		
		$space_div->setHeight($size, -1, -1, $u);
		$space_div->setTransparent(true);
	}
}


//класс для создания матрицы блоков
class HMatrixDiv extends HDiv
{
	public function __construct($rows, $cols, $id = '') //constructor
	{
		parent::__construct($id);
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
	public function setCellPosition($t)
	{
		$item = $this->getElement($i, $j);
		if (!$item) 
		{
			echo_br("setCellPosition: invalid item by (i=$i, j=$j)", 'red'); 
			return;
		}
		$item->setPosition($t);		
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
					$item->setMargin($this->m_magrinItems, $this->m_magrinItems, $this->m_magrinItems, $this->m_magrinItems, '%');
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


?>


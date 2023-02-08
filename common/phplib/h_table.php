<?php	


//////////////// HText (paragraph element) ///////////////////////
class HTable extends HObject 
{
	public function __construct($rows, $cols) //constructor
	{
		parent::__construct();
		$this->m_tagName = 'table';	
		$this->m_displayMode = HDisplayMode::hdmTable;
		$this->m_rows = $rows;
		$this->m_cols = $cols;
		$this->initData();
	}	
	
	public function setCaption($text) {$this->m_caption = $text;}
	public function setHeaderFont($hf) {$this->m_headerFont = hf;}
	public function setHeaderBackground($color) {$this->m_headerBackground = hf;}
	public function setHeaderLabels($h_labels) //задать текст для заголовка (массив)
	{
		$this->m_headerLabels = array();
		if (count($h_labels) != $this->m_cols)
		{
			echo_br("WARNING: invalid h_labels size - ".count($h_labels)." != $this->m_cols", red);	
			$this->m_headerLabels = null;
		}
		else
		{
			for ($j=0; $j<$this->m_cols; $j++)
				array_push($this->m_headerLabels, $h_labels[$j]);
		}
	}
	public function setCellData($i, $j, $text) //задать текст ячейки таблицы
	{
		$this->m_data["$i-$j"] = $text;
	}
	public function setColsWidth($w_arr) //задать ширины для всех столбцов, сумма должна быть 100%  (массив)
	{
		$this->m_colsWidth = array();
		if (count($w_arr) != $this->m_cols) 
		{
			$this->m_colsWidth = null;
			return;
		}
		
		$result = true;
		$sum = 0;
		for ($j=0; $j<$this->m_cols; $j++)
		{
			if (!is_int($w_arr[$j])) {$result = false; break;}
			array_push($this->m_colsWidth, $w_arr[$j]);
			$sum += $w_arr[$j];
		}
		if ($sum != 100) $result = false;		
		if (!$result) 
		{
			$this->m_colsWidth = array();
			$this->m_colsWidth = null;
		}
	}
	
					
	//protected section
	protected $m_rows = -1;
	protected $m_cols = -1;
	protected $m_caption = ''; //название таблицы (может отсутствовать)
	protected $m_headerLabels = null; //строковый массив - заголовок таблицы  (может отсутствовать)
	protected $m_headerFont = null; //OBJ:  type of HFont заголовокa
	protected $m_headerBackground = 'LightSteelBlue'; //цвет заливки заголовокa
	protected $m_colsWidth = null; //массив числовых значений, ширины столбцов в %, сумма всех элементов должна быть 100%


	
	//данные таблицы, представляет из себя строковый одномерный массив (размер постоянный  m_rows*m_cols)
	//изначально массив заполняется пустыми строками, key каждого элемента вида: i-j (пример 0-3 или 25-1) 
	//индексация строк и столбцов с 0
	protected $m_data = null; //строковый одномерный массив, 

	
	protected function hasHeader() {return (is_array($this->m_headerLabels));}
	protected function hasCaption() {return (!empty($this->m_caption));}
	protected function placeContent() 
	{
		echo "<style>", "\n"; //td {background-color:yellow; border: 1px solid black;} </style>", "\n";
		echo "td {border: 1px solid black; white-space:pre; word-wrap:break-word; white-space:normal; text-align: left; padding: 2px;}", "\n";
		echo "caption {background-color:transparent; text-align: left; font-style:italic;  color: green;}", "\n";
		echo "</style>", "\n";
		
		$this->placeCaption();
		$this->placeColGroup();
		$this->placeHeader();
		
		for ($i=0; $i<$this->m_rows; $i++)
		{
			echo "<tr>", "\n"; 
			for ($j=0; $j<$this->m_cols; $j++)
			{
				echo "<td>", $this->m_data["$i-$j"], "</td>", "\n"; 
			}
			echo "</tr>", "\n"; 			
		}		
	}	
	protected function placeColGroup()
	{
		if ($this->m_cols < 2) return;
		echo "<colgroup>", "\n"; 
		$w_col = (int)(100/$this->m_cols);
		//$b = (($this->m_colsWidth != null) && is_array($this->m_colsWidth));
		$b = ($this->m_colsWidth != null);
		for ($j=0; $j<$this->m_cols-1; $j++)
		{
			if ($b) $w_col = $this->m_colsWidth[$j];
			echo "<col span=\"1\" style=\"width: $w_col%;\">", "\n"; 
		}
		echo "</colgroup>", "\n"; 
	}
	protected function placeCaption() 
	{
		if (!$this->hasCaption()) return;
		echo "<caption>", "\n"; 
		echo $this->m_caption, "\n";
		echo "</caption>", "\n"; 						
	}
	protected function placeHeader() 
	{
		if (!$this->hasHeader()) return;
		$s = "";
		if ($this->m_headerFont) $s = $s.$this->m_headerFont->styles();	
		$s = $s." background-color: $this->m_headerBackground; ";
		echo "<thead style=\"$s\">", "\n"; 
		echo "<tr>", "\n"; 
		for ($j=0; $j<$this->m_cols; $j++)
			echo "<th>", $this->m_headerLabels[$j], "</th>", "\n"; 
		echo "</tr>", "\n"; 
		echo "</thead>", "\n"; 				
	}
	protected function styleValue()
	{
		$s = 'table-layout: fixed; ';
		//if ($this->m_scroll) $s = $s."overflow:auto; ";
		return trim($s.parent::styleValue());
	} 
	protected function initData()
	{
		$this->m_data = array();
		for ($i=0; $i<$this->m_rows; $i++)
			for ($j=0; $j<$this->m_cols; $j++)
				$this->m_data["$i-$j"] = '';
	}
				
					
}




?>


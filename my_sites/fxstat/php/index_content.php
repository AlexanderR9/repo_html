<?php	

/*
//main CSS settins for my project
class AppSettings 
{
	public $host = 'localhost'; //имя хоста, на локальном компьютере это localhost
	public $user = 'root'; //имя пользователя, по умолчанию это root
	public $password = ''; //пароль, по умолчанию пустой
	public $db_name = 'fxstat_db'; //имя базы данных
}
*/

enum HAlign 
{
    case haLeft;
    case haRight;
    case haTop;
    case haBottom;
    case haCenter;
    case haNone;
}
//class-struct for set MAGRIN/PADDING properties
class HMarginSizes
{	
	public $left = 0;
	public $right = 0;
	public $top = 0;
	public $bottom = 0;
	public $units = 'px';	//string value

	public function values() {return "left=$this->left  right=$this->right  top=$this->top  top=$this->top";}		
	public function setValues($l, $r, $t, $b)
	{
		if ($l >= 0) $this->left = $l;
		if ($r >= 0) $this->right = $r;
		if ($t >= 0) $this->top = $t;
		if ($b >= 0) $this->bottom = $b;
	}
	public function styles($attr_name)
	{
		$s = "";
		if ($this->left > 0) $s = "$attr_name-left: $this->left$this->units; ";
		if ($this->right > 0) $s = $s."$attr_name-right: $this->right$this->units; ";
		if ($this->top > 0) $s = $s."$attr_name-top: $this->top$this->units; ";
		if ($this->bottom > 0) $s = $s."$attr_name-bottom: $this->bottom$this->units; ";
		return $s;
	}
}
class HBorder
{	
	public $width = 0; //px
	public $type = "solid"; //string value
	public $color = "Silver"; //string value
	
	public function setValues($w, $color, $type)
	{
		if ($w >= 0) $this->width = $w;
		if (!empty($color)) $this->color = $color;
		if (!empty($type)) $this->type = $type;
	}
	public function styles()
	{
		$s = "border: ";
		if ($this->width <= 0) $s = $s."none; ";
		else
		{
			$s = $s."$this->width"."px";
			$s = $s." $this->type $this->color; ";
		}			
		return $s;
	}	
}
//class-struct for set SIZES properties
class HSize
{
	public $width = -1;
	public $min_width = -1;
	public $max_width = -1;
	public $w_units = '%';
	
	public $height = -1;
	public $min_height = -1;
	public $max_height = -1;
	public $h_units = '%';
	
	public function setWidth($w, $min_w, $max_w, $u)
	{
		if ($w >= 0) $this->width = $w;
		if ($min_w >= 0) $this->min_width = $min_w;
		if ($max_w >= 0) $this->max_width = $max_w;
		if (!empty($u)) $this->w_units = $u;
	}
	public function setHeight($h, $min_h, $max_h, $u)
	{
		if ($h >= 0) $this->height = $h;
		if ($min_h >= 0) $this->min_height = $min_h;
		if ($max_h >= 0) $this->max_height = $max_h;
		if (!empty($u)) $this->h_units = $u;
	}
	public function styles()
	{
		$s = "";
		if ($this->width >= 0) $s = $s."width: $this->width$this->w_units; ";
		if ($this->min_width >= 0) $s = $s."min_width: $this->min_width$this->w_units; ";
		if ($this->max_width >= 0) $s = $s."max_width: $this->max_width$this->w_units; ";
		if ($this->height >= 0) $s = $s."height: $this->height$this->h_units; ";
		if ($this->min_height >= 0) $s = $s."min_height: $this->min_height$this->h_units; ";
		if ($this->max_height >= 0) $s = $s."max_height: $this->max_height$this->h_units; ";
		return $s;
	}	
}
//class-struct for set FONT params
class HFont
{
	public $text_color = ''; //string value
	public $size = -1; //px
	public $family = ''; //string value
	public $align = HAlign::haNone; //ENUM_VAR: type of enum HAlign
	public $is_bold = false; //bool
	public $is_italic = false; //bool
	
	public function styles()
	{
		$s = "";
		if ($this->size > 0) $s = $s."font-size: $this->size"."px; ";
		if (!empty($this->family)) $s = $s."font-family: $this->family; ";
		if (!empty($this->text_color)) $s = $s."color: $this->text_color; ";
		if ($this->align != HAlign::haNone)
		{
			switch ($this->align)
			{
				case HAlign::haLeft: {$s = $s."text-align: left; "; break;}
				case HAlign::haRight: {$s = $s."text-align: right; "; break;}
				case HAlign::haTop: {$s = $s."text-align: top; "; break;}
				case HAlign::haBottom: {$s = $s."text-align: bottom; "; break;}
				case HAlign::haCenter: {$s = $s."text-align: center; "; break;}
				default: break;		
			}
		}
		$other_params="";
		if ($this->is_bold) $s = $s."font-weight: bold; ";
		if ($this->is_italic) $s = $s."font-style: italic; ";
		return $s;
	}	
	
}
//abstract class of base HTML-object
abstract class HObject
{
	public function __construct() //constructor
	{
		//echo_br("HObject constructor");
		$this->m_border = new HBorder();
		$this->m_margin = new HMarginSizes();
		$this->m_padding = new HMarginSizes();
		$this->m_font = new HFont();
		$this->m_size = new HSize();
	}	
	abstract public function placeObject(); //virtual func
	
	public function setMargin($l, $r, $t, $b) {$this->m_margin->setValues($l, $r, $t, $b);}
	public function setMarginUnits($u) {$this->m_margin->units = $u;}
	public function setPadding($l, $r, $t, $b) {$this->m_padding->setValues($l, $r, $t, $b);}
	public function setPaddingUnits($u) {$this->m_padding->units = $u;}
	public function setBorderParams($w, $color = '', $type = '') {$this->m_border->setValues($w, $color, $type);}
	public function setWidth($w, $min_w = -1, $max_w = -1, $u='%') {$this->m_size->setWidth($w, $min_w, $max_w, $u);}
	public function setHeight($h, $min_h = -1, $max_h = -1, $u='%') {$this->m_size->setHeight($h, $min_h, $max_h, $u);}
	public function setFontTextColor($color) {$this->m_font->text_color = $color;}
	public function setFontSize($size) {$this->m_font->size = $size;}
	public function setFontFamily($ff) {$this->m_font->family = $ff;}
	public function setFontAlign($align) {$this->m_font->align = $align;}
	public function setFontBoldItalic($b, $i) {$this->m_font->is_bold = $b; $this->m_font->is_italic = $i;}
	
	
	
	//protected section
	protected $m_tagName = ''; //
	protected $m_border; //OBJ: type of HBorder
	protected $m_margin; //OBJ: type of HMarginSizes
	protected $m_padding; //OBJ: type of HMarginSizes
	protected $m_font; //OBJ:  type of HFont
	protected $m_size;  //OBJ:  type of HSize
	
	
	protected function styleValue() //return style values of attrs OR ""
	{
		$s = $this->m_border->styles();	
		$s = $s.$this->m_margin->styles("margin");	
		$s = $s.$this->m_padding->styles("padding");	
		$s = $s.$this->m_size->styles();	
		$s = $s.$this->m_font->styles();	
		return trim($s);	
	}
	protected function placeBegin()
	{
		print("\n");
		$sv = $this->styleValue();
		$s = "<".$this->m_tagName." style=\"$sv\">";
		echo $s;
		print("\n");
	}
	protected function placeEnd() 
	{
		print("\n");
		echo "</$this->m_tagName>"; 
		print("\n");
	}
	
	
}

//////////////// HDiv (block element) ///////////////////////
class HDiv extends HObject 
{
	public function __construct() //constructor
	{
		parent::__construct();
		//echo_br("HDiv constructor");
		$this->m_tagName = 'div';
	}	
	public function placeObject() 
	{
		//print("\n");
		parent::placeBegin();
		echo_br($this->styleValue());
		parent::placeEnd();		
	}		
	protected function styleValue() //return style values of attrs OR ""
	{
		$s = "display: block; ".parent::styleValue();
		return trim($s);
	} 
}
class HFlexParentDiv
{
	
}


class IndexContent
{
	
}

?>


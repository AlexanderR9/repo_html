<?php	

//align enum
enum HAlign 
{
    case haLeft;
    case haRight;
    case haTop;
    case haBottom;
    case haCenter;
    case haNone;
}

//display mode
enum HDisplayMode
{
	case hdmInline;
	case hdmInlineBlock;
	case hdmBlock;
	case hdmFlex;
	case hdmTable;
}


//Position types
enum HPositionType
{
	case hpNone;
	case hpRelative;
	case hpAbsolute;	
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
	public function setValues($l, $r, $t, $b, $u)
	{
		/*
		if ($l >= 0) $this->left = $l;
		if ($r >= 0) $this->right = $r;
		if ($t >= 0) $this->top = $t;
		if ($b >= 0) $this->bottom = $b;
		*/
		$this->left = $l;
		$this->right = $r;
		$this->top = $t;
		$this->bottom = $b;
		$this->units = $u;				
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


//class-struct for set POSITION properties
class HPosition
{
	public function __construct() //constructor
	{
		$this->pos = new HMarginSizes();
		$this->pos->setValues(-1, -1, -1, -1, 'px');
	}	
	
	
	public $type = HPositionType::hpNone;
	public $pos = null; //OBJ of HMarginSizes
	
	public function setValues($type, $l, $r, $t, $b, $u)
	{
		$this->type = $type;
		$this->pos->setValues($l, $r, $t, $b, $u);
	}
	public function styles()
	{
		$s = "";
		switch ($this->type)
		{
			case HPositionType::hpRelative: {$s = $s."position: relative; "; break;}
			case HPositionType::hpAbsolute: {$s = $s."position: absolute; "; break;}
			default: break;		
		}
		
		$u = $this->pos->units;
		if ($this->pos->left != -1) $s = $s."left:".$this->pos->left."$u; ";
		if ($this->pos->right != -1) $s = $s."right:".$this->pos->right."$u; ";
		if ($this->pos->top != -1) $s = $s."top:".$this->pos->top."$u; ";
		if ($this->pos->bottom != -1) $s = $s."bottom:".$this->pos->bottom."$u; ";

		return $s;
	}	
}

//class-struct for set BORDER properties
class HBorder
{	
	public $width = 0; //px
	public $type = "solid"; //string value
	public $color = "Silver"; //string value
	public $radius = -1; //закругление углов, px
	
	
	public function setValues($w, $color, $r, $type)
	{
		if ($w >= 0) $this->width = $w;
		if ($r > 0) $this->radius = $r;
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
			
			if ($this->radius > 0)
				$s = $s." border-radius: $this->radius"."px; ";
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
		//$other_params="";
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
		$this->m_position = new HPosition();
		$this->m_border = new HBorder();
		$this->m_margin = new HMarginSizes();
		$this->m_padding = new HMarginSizes();
		$this->m_font = new HFont();
		$this->m_size = new HSize();
		$this->m_classes = array();
	}	
	
	abstract protected function placeContent(); //virtual func
	public function place() //main func for place to HTML page
	{
		$this->placeBegin();
		$this->placeContent();
		$this->placeEnd();		
	}
		
	public function setMargin($l, $r, $t, $b, $u='px') {$this->m_margin->setValues($l, $r, $t, $b, $u);}
	//public function setMarginUnits($u) {$this->m_margin->units = $u;}
	public function setPadding($l, $r, $t, $b, $u='px') {$this->m_padding->setValues($l, $r, $t, $b, $u);}
	//public function setPaddingUnits($u) {$this->m_padding->units = $u;}
	public function setBorder($w, $color = 'Silver', $r = -1, $type = '') {$this->m_border->setValues($w, $color, $r, $type);}
	public function setWidth($w, $min_w = -1, $max_w = -1, $u='%') {$this->m_size->setWidth($w, $min_w, $max_w, $u);}
	public function setHeight($h, $min_h = -1, $max_h = -1, $u='%') {$this->m_size->setHeight($h, $min_h, $max_h, $u);}
	public function setFontTextColor($color) {$this->m_font->text_color = $color;}
	public function setFontSize($size) {$this->m_font->size = $size;}
	public function setFontFamily($ff) {$this->m_font->family = $ff;}
	public function setFontAlign($align) {$this->m_font->align = $align;}
	public function setFontBoldItalic($b, $i) {$this->m_font->is_bold = $b; $this->m_font->is_italic = $i;}
	public function setBackGround($color) {$this->m_bgColor = $color;}
	public function addClass($class_name) {array_push($this->m_classes, $class_name);}
	public function setID($id) {$this->m_id = $id;}
	public function setTransparent($b) {$this->m_bgColor = ($b) ? 'transparent' : '';} //делает элемент прозрачным
	public function setDisplayMode($mode) {$this->m_displayMode = $mode;}
	public function setPosition($type, $l=-1, $r=-1, $t=-1, $b=-1, $u='px') {$this->m_position->setValues($type, $l, $r, $t, $b, $u);}
	
		
	//protected section
	protected $m_tagName = ''; //
	protected $m_bgColor = ''; //цвет заливки элемента
	protected $m_position; //OBJ: type of HPosition
	protected $m_border; //OBJ: type of HBorder
	protected $m_margin; //OBJ: type of HMarginSizes
	protected $m_padding; //OBJ: type of HMarginSizes
	protected $m_font; //OBJ:  type of HFont
	protected $m_size;  //OBJ:  type of HSize
	protected $m_classes = null; //array of string (class names)
	protected $m_id = ''; //string value of ID element
	protected $m_displayMode = -1;
	
	
	protected function displayValue()
	{
		switch ($this->m_displayMode)
		{
			case HDisplayMode::hdmInline: {return 'inline';}
			case HDisplayMode::hdmInlineBlock: {return 'inline-block';}
			case HDisplayMode::hdmBlock: {return 'block';}
			case HDisplayMode::hdmFlex: {return 'flex';}
			case HDisplayMode::hdmTable: {return 'table';}
			default: break;
		}
		return 'inline';
	}
	protected function styleValue() //return style values of attrs OR ""
	{
		$s = '';
		$s = $s."display: ".$this->displayValue()."; ";	
		$s = $s.$this->m_border->styles();	
		$s = $s.$this->m_position->styles();	
		
		if (!empty($this->m_bgColor)) 
			$s = $s."background-color: $this->m_bgColor; ";
		
		$s = $s.$this->m_margin->styles("margin");	
		$s = $s.$this->m_padding->styles("padding");	
		$s = $s.$this->m_size->styles();	
		$s = $s.$this->m_font->styles();	
		return trim($s);	
	}
	protected function classValue()
	{
		$s = '';
		if (count($this->m_classes) > 0)
		{
			foreach($this->m_classes as $class_name)
				$s = $s."$class_name ";
		}
		return trim($s);
	}
	protected function otherAttrs() {return "";} //дополнительные атрибуты тегов
	protected function placeBegin()
	{
		$s = "<$this->m_tagName";
		$attr = $this->styleValue();
		if (!empty($attr)) $s = $s." style=\"$attr\"";
		$attr = $this->classValue();
		if (!empty($attr)) $s = $s." class=\"$attr\"";
		if (!empty($this->m_id)) $s = $s." id=\"$this->m_id\"";
		
		$attr = $this->otherAttrs();
		if (!empty($attr)) $s = $s." $attr";
		
		$s = $s.">";
		echo $s;
		print("\n");
	}
	protected function placeEnd() 
	{
		echo "</$this->m_tagName>"; 
		print("\n");
	}		
}


// class for bind link to element
class HLink
{
	public function __construct($ref_path) //constructor
	{
		$this->m_refValue = $ref_path;
	}			
	public function placeTextContent($text)
	{
		$s = "<a ";
		$attr = $this->styleValue();
		if (!empty($attr)) $s = $s." style=\"$attr\"";
		$s = $s." href=\"$this->m_refValue\"";
		$s = $s.">".$text."</a>";
		echo $s;
	}	
	public function placeBegin()
	{
		print("<a  href=\"$this->m_refValue\">");
	}
	public function placeEnd()
	{
		print("</a>");		
	}
	public function setColors($color, $hover_color = '') 
	{
		$this->m_color = $color; 
		$this->m_hoverColor = $hover_color;
	}
		
	//protected section
	protected $m_refValue = '';
	protected $m_color = '';
	protected $m_hoverColor = '';
	
	protected function styleValue() //return style values of attrs OR ""
	{
		$s = '';
		//$s = "outline: none; text-decoration: none; ";
		if (!empty($this->m_color)) $s = $s."color: $this->m_color; ";
		//if (!empty($this->m_hoverColor)) $s = $s."a:active: $this->m_hoverColor; ";
		return trim($s);	
	}
	
}


?>


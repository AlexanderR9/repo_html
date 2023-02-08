<?php

//main settings of my site
class AppSettings
{
	public static function projectName() {return 'fxstat';} //root folder name
	public static function indexLinkColor() {return 'Yellow';}
	
	
	//header
	public static function headerBackground() {return 'BurlyWood';}
	public static function headerBorderColor() {return 'RosyBrown';} 
	public static function headerMenuTitleColor() {return 'LightCyan';}
	public static function headerHeight() {return 80;} //px
	public static function headerMarginTop() {return 20;} //px
	public static function headerBorderRadius() {return 10;} //px
	public static function headerBorderWidth() {return 2;} //px
	public static function headerFontSize() {return 18;} 
	
	
	//footer
	public static function footerBackground() {return 'DarkSlateGray';}
	
	//instruments array (key - db table, value - header title)
	public static function instruments() 
	{		
		return array('stock' => "Stocks",
					'couple' => "Currency couples",
					'crypto' => "Crypto",
					'bond' => "Bonds",
					'index' => "Indexes");
	}
	
	
}


?>


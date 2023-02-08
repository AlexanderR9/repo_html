<?php
    $arr_stocks = array();
    $fname = "stocks.txt";
	$path = (isIndexPath(getcwd())) ? "instruments" : "../instruments";			
    $err = freadTextArr($path."/".$fname, $arr_stocks);
    to_debug("try read file..........");
    if (strlen($err) > 0) 
    {
        echo_br("<p style='color: red'>$err</p>");
        exit();
    }

    $n = count($arr_stocks);
    if ($n == 0) exit();
    //to_debug("n = $n");
	
    foreach ($arr_stocks as $ticker) 
	{
		$el = new HText($ticker);
		$el->setFontTextColor('DarkTurquoise');
		$el->setMargin(40, -1, 5, 8);
		$el->setBorder(1, 'black');
		$el->setWidth(50);		
		$el->setFontSize(16);		
		$l_path = 'couple_data.php?ticker='.$ticker;		
		$t_link = new HLink($l_path);
		//$t_link->setColors('RosyBrown', 'Gold');
		$el->setLink($t_link);
		
		$sidebar_div->addChild($el);
		$sidebar_div->setBackGround('LightCyan');
		$sidebar_div->setBorder(1, 'red', 10);

	}
	

/*
    echo "<script type=\"text/javascript\">"; print("\n");
    echo "let e = document.getElementById('instrument_list');"; print("\n");
    echo "e.innerHTML += '<p style=\'color: green; font-size: 12px\'>Total:'+$n+'</p>';"; print("\n");
    echo "let js_array = new Array();"; print("\n");

    $i = 0;
    foreach ($arr_stocks as $ticker) 
    {
       echo "js_array[$i] = '$ticker';\n";
       $i++;
    }

    echo "
        for (var i=0; i<js_array.length; i++)
        {
            let s = '<p>' + js_array[i] + '</p>';
            e.innerHTML += s;
        }    
        ";

    echo "</script>"; print("\n");
	*/

?>

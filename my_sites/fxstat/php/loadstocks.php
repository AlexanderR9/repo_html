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
    to_debug("n = $n");

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

?>

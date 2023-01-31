<?php
    function br() {print "<br>";}
    function echo_br($str_line) {echo $str_line; br();}
    function root_path() {return $_SERVER['DOCUMENT_ROOT'];}
    function str_date() {return date('d.m.Y');}
    function str_time() {return date('H:i:s');}
    function str_datetime() {return date('d.m.Y / H:i:s');}
?>



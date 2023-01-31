<?php
   function freadTextArr($fname, &$arr)
   {      
      $err = "";
      if (!file_exists($fname)) 
      {
        $err = "WARNING: file $fname not found ";
        return $err;
      }

      $f_handle = fopen($fname, "r");
      if (!$f_handle)
      {
        $err = "WARNING: file $fname can't open for reading ";
        return $err;
      }

      while (($fline = fgets($f_handle)) !== false) 
      {
        array_push($arr, $fline);    
      }
      fclose($f_handle);
      return $err;
    }


?>


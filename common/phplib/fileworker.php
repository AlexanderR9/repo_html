<?php

	//считывает строки из файла и записывает в массив $arr, функция возвращает строку (ошибку либо "")
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
        $fline = str_replace("\r\n", "", $fline);
        array_push($arr, $fline);    
      }
      fclose($f_handle);
      return $err;
    }
	
	//функция возвращает список файлов в указанной папке (без полного пути)
	function getFileListByDir($dir_name)
	{
		$f_arr = array();
		if (is_dir($dir_name))
		{
			$f_arr = scandir($dir_name);
			$n = count($f_arr);
			for ($i=$n-1; $i>=0; $i--)
			{
				if ($f_arr[$i] == "." || $f_arr[$i] == "..") 
				{
					array_splice($f_arr, $i, 1);
					continue;
				}
				if (is_dir($f_arr[$i])) 
				{
					array_splice($f_arr, $i, 1);
				}
			}			
		}
		return $f_arr; 
	}

	
	//функция возвращает признак того что папка является корневой для сайта, т.е. здесь присутствует файл index.*
	
	function isIndexPath($dir_name)
	{	
		$f_arr = getFileListByDir($dir_name);
		foreach ($f_arr as $key => $fname) 
		{
//			to_debug("key[$key]  =>  $fname <br>");
			if (str_contains($fname, "index.")) 
				return true;		
		}
		return false;
	}
	


?>


<?php	

//struct data for connection to DB 
class DBLoginInfo 
{
	public $host = 'localhost'; //имя хоста, на локальном компьютере это localhost
	public $user = 'root'; //имя пользователя, по умолчанию это root
	public $password = ''; //пароль, по умолчанию пустой
	public $db_name = 'fxstat_db'; //имя базы данных
}


//класс для работы с БД, при создании объекта класса(т.е. new) сразу происходит попытка подключения к серверу(БД).
//параметры подключения находятся в переменной $m_loginData типа DBLoginInfo (на данный момент значения DBLoginInfo константы).
//после подключения или выполнения любой операции в БД необходимо проверить наличие ошибки методом hasErr(), 
//в случае ошибки вывести ошибку методом printErr().
class DBObject
{
//public section
	public function __construct($with_debug = false) //constructor
	{
		//echo_br("DBObject constructor");
		$this->m_loginData = new DBLoginInfo();
		$this->m_err = "";

		$this->connectDB($with_debug);
		if ($this->hasErr()) $this->printErr();
	}	
	public function __destruct() //distructor
	{
		//echo_br("DBObject distructor");
	}	
	
	public function lastErr() {return $this->m_err;} //значение ошибки	
	public function hasErr() {return (!empty($this->m_err));} //наличие ошибки при работе с базой (подключения в том числе)
	public function dbName() {return $this->m_loginData->db_name;} //имя базы (состояние подключения может быть любым)
	public function printErr() {echo_br("ERR_VALUE: <em style=\"color:red\">".$this->lastErr()."</em>");} //печать ошибки на странице
	public function isConnected() {if (!$this->m_db) return false; return $this->m_db->ping();} //признак наличия подключения к базе
	public function closeConnection() {if ($this->isConnected()) $this->m_db->close();} //в деструкторе нельзя вызывать этот метод
	
	//список возможных типов данных полей для интерфейса пользователя.
	//возвращает массив элементов: типа ключ - значение.
	public static function userFieldTypes() 
	{		
		return array('char' => "Char (1 symbol)", //1 символ (длина фиксированная)
					'short_string' => "Short string (max len 10)", //переменная строка до 10 символов
					'string' => "String (max len 100)", //переменная строка до 100 символов
					'text' => "Text", //произвольный длинный текст (например некое описание)
					'date' => "Date",
					'time' => "Time",					
					'int8' => "Int (8 bit)",
					'int16' => "Int (16 bit)",
					'int32' => "Int (32 bit)",
					'uint8' => "Unsigned int (8 bit)",
					'uint16' => "Unsigned int (16 bit)",
					'uint32' => "Unsigned int (32 bit)",					
					'float' => "Float",
					'bool' => "Boolean"					
					);															
	}
	
	//получить реальный тип данных языка MySQL по пользовательскому ключу из массива fieldTypes() 
	public static function getDBType($type) 
	{
		if ($type == 'char') 	return "CHAR(1)";
		if ($type == 'short_string') 	return "VARCHAR(10)";
		if ($type == 'string') 	return "VARCHAR(100)";
		if ($type == 'text') 	return "TEXT";
		if ($type == 'date') 	return "DATE";
		if ($type == 'time') 	return "TIME";
		if ($type == 'int8') 	return "TINYINT";
		if ($type == 'uint8') 	return "TINYINT UNSIGNED";
		if ($type == 'int16') 	return "SMALLINT";
		if ($type == 'uint16')	return "SMALLINT UNSIGNED";
		if ($type == 'int32') 	return "INT";
		if ($type == 'uint32') 	return "INT UNSIGNED";
		if ($type == 'float') 	return "FLOAT";
		if ($type == 'bool') 	return "BOOLEAN";		
		return "none";		
	}
	
	//возвращает признак только что пользовательский тип данных является целым
	public static function isIntegerType($type) 
	{
		return str_contains($type, 'int');
	}

	//возвращает признак только что пользовательский тип данных численным (целым или вещественным)
	public static function isNumeric($type) 
	{
		if (isIntegerType($type)) return true;
		return ($type == 'float');
	}
	
	

	
	/////////////////SQL query finctions////////////////////////
	
	//возвращает количество таблиц в рабочей БД
	public function tableCount()
	{
		$req = "SHOW TABLES;";
		$this->trySqlRequest($req);
		if ($this->hasErr()) return -1;
		return $this->sql_result->num_rows;		
	}
		
	//возвращает массив имен таблиц в рабочей БД
	public function tableList()
	{
		$tables = array();
		$n = $this->tableCount();
		if (!$this->hasErr())
		{
			while (true) 
			{
				$row = $this->sql_result->fetch_row();
				if ($row) array_push($tables, $row[0]);
				else break;
			}
		}
		return $tables;		
	}	
	
	//веррнет признак существование таблицы в БД с указанным именем
	public function existTable($t_name) 
	{
		$t_list = $this->tableList();
		if ($this->hasErr()) return false;
		return in_array($t_name, $t_list);
	}
	
	//возвращает количество строк (записей) в указанной таблице
	public function tableRowCount($t_name)
	{
		if (!$this->existTable($t_name))
		{
			$this->m_err = "the table [".$t_name."] not found in ".$this->dbName();
			return -1;
		}				

		$req = "SELECT COUNT(*) FROM $t_name;";
		$this->trySqlRequest($req);
		if ($this->hasErr()) return -1;		

		$row = $this->sql_result->fetch_row();
		if (!$row) return 0;
		return (int)$row[0];
	}
	
	
	//создает в БД таблицу с указанным именем, ничего не возвращает
	//$fields_info - двумерный массив, где ключ первого уровня это имя поля,
	//а значение это массив 2-го уровня, который содержит 1-тип данных(string) 2-is_primary_key(bool) 3-is_unique(bool).
	//ВНИМАНИЕ: тип данных необходимо передавать вида: ключ из массива DBObject::userFieldTypes() 
	public function createTable($t_name, $fields_info)
	{
		if ($this->existTable($t_name))
		{
			$this->m_err = "the table [".$t_name."] already exist in ".$this->dbName();
			return;
		}			
		
		
		$req = "CREATE TABLE IF NOT EXISTS $t_name ( ";
		$first = true;
		foreach($fields_info as $key => $value)
		{
			$mysql_dt = DBObject::getDBType($value[0]);
			$is_int = DBObject::isIntegerType($value[0]);
			
			$s = "$key $mysql_dt";
			if ($value[1])
			{
				$s = $s." PRIMARY KEY";
				if ($is_int) $s = $s." AUTO_INCREMENT";
			}
			else if ($value[2]) $s = $s." UNIQUE";
			
			if ($first) {$first = false; $req = $req.$s;}
			else $req = $req.", ".$s;
		}
		$req = $req." );";
		

/*			EXAMPLE		
		$req = "
					CREATE TABLE IF NOT EXISTS $t_name 
					(
						iid SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
						ticker VARCHAR(6) UNIQUE NOT NULL,
						name VARCHAR(50) DEFAULT '---'
					);
				";
				*/
				
		
		
		//echo "$req";
		$this->trySqlRequest($req);
	}
	
	//удаляет из БД таблицу с указанным именем, ничего не возвращает
	public function removeTable($t_name)
	{
		if (!$this->existTable($t_name))
		{
			$this->m_err = "the table [".$t_name."] not found in ".$this->dbName();
			return;
		}				
		$req = "DROP TABLE $t_name;"; 
		$this->trySqlRequest($req);
	}
	
	//получить все записи указанной таблицы, ничего не возвращает.
	//в параметр data запишется двумерный массив т.е. строки , а внутри строки значения полей.
	public function getAllTableData($t_name, &$data)
	{
		if ($data) {free($data); $data = null;}
		$data = array();
		
		if (!$this->existTable($t_name))
		{
			$this->m_err = "the table [".$t_name."] not found in ".$this->dbName();
			return;
		}				
		
		$req = "SELECT * FROM $t_name;"; 
		$this->trySqlRequest($req);
		if ($this->hasErr()) return;
		
		while (true) 
		{
			$row = $this->sql_result->fetch_row();
			if ($row) array_push($data, $row);
			else break;
		}
	}
	
	//возвращает массив названий столбцов указанной таблицы 
	public function getTableFields($t_name)
	{
		$fields = array();
		if (!$this->existTable($t_name))
		{
			$this->m_err = "the table [".$t_name."] not found in ".$this->dbName();
			return $fields;
		}				
		
		$req = "SHOW COLUMNS FROM $t_name;"; 
		$this->trySqlRequest($req);
		if ($this->hasErr()) return $fields;
		
		while (true) 
		{
			$row = $this->sql_result->fetch_row();
			if ($row) array_push($fields, $row[0]);
			else break;
		}
		return $fields;		
	}
	
	//возвращает двумерный массив с информацией о столбцах таблицы.
	//вид массива: key - имя столбца, value - array(тип данных, is_primary_key, is_unique)
	public function getTableDataTypes($t_name)
	{
		$cols_data = array();
		if (!$this->existTable($t_name))
		{
			$this->m_err = "the table [".$t_name."] not found in ".$this->dbName();
			return $fields;
		}				
		
		$req = "SHOW COLUMNS FROM $t_name;"; 		
		$this->trySqlRequest($req);
		if ($this->hasErr()) return $cols_data;
				
		while (true) 
		{
			$row = $this->sql_result->fetch_row();
			if ($row) 
			{
				$col_data = array();
				$col_data[0] = $row[1];
				$col_data[1] = (bool)($row[3] == 'PRI');
				$col_data[2] = (bool)($row[3] == 'UNI');
				$cols_data[$row[0]] = $col_data;
			}
			else break;
		}		
		return $cols_data;
	}
	
		
	//добавляет 1 запись таблицу с указанным именем, ничего не возвращает
	//row_data - массив вида: (key1=>value1, key2=>value2  .....), где key  это название поля(столбца) 
	public function addRecord($t_name, $row_data)
	{
		if (!$this->existTable($t_name))
		{
			$this->m_err = "the table [".$t_name."] not found in ".$this->dbName();
			return;
		}				
		if (count($row_data) == 0)
		{
			$this->m_err = "row_data is empty";
			return;			
		}
		
		$fields = "";
		$values = "";
		foreach($row_data as $key => $v)
		{
			if (empty($fields)) $fields = $key;
			else $fields = "$fields, $key";
			
			if (empty($values)) $values = "'$v'";
			else $values = "$values, '$v'";
		}
		
		$req = "INSERT INTO $t_name ($fields) VALUES ($values);";
		echo_br($req, 'blue');
		$this->trySqlRequest($req);
	}
		

//protected section
	protected $m_loginData;
	protected $m_err = "";
	protected $m_db;
	protected $sql_result = null;
		
	
	//подключится к БД, ничего не возвращает
	protected function connectDB($with_debug = false)
	{
		if (!$this->m_loginData)
		{
			$this->m_err = "login data object is NULL";
			return;
		}
		
		if ($with_debug) echo_br("try connect to DB: ".$this->dbName()." ............");		
		try
		{			
			$this->m_db = new mysqli($this->m_loginData->host, $this->m_loginData->user, $this->m_loginData->password, $this->m_loginData->db_name);
		}
		catch(Exception $ex)
		{
			$this->m_err = "catch exception: ".$ex->getMessage();
			return;
		}		
		
		if ($this->m_db->connect_error)
		{
			$this->m_err = "DB connection faled".$this->m_db->connect_error.")";
			return;
		}
		if ($with_debug) echo_br("RESULT: <em style=\"color:green\">DB connection: OK</em>");	
	}
	
	//выполнить запрос к БД, ничего не возвращает
	protected function trySqlRequest($req)
	{
		//reset result 
		$this->m_err = "";
		if ($this->sql_result) $this->sql_result->free();
		
		//try request
		try
		{
			$this->sql_result = $this->m_db->query($req);
		}
		catch(Exception $ex)
		{
			$this->m_err = "catch exception: ".$ex->getMessage();
		}				
	}
	
	
}


?>



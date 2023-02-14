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
	public function createTable($t_name)
	{
		if ($this->existTable($t_name))
		{
			$this->m_err = "the table [".$t_name."] already exist in ".$this->dbName();
			return;
		}				
		$req = "
					CREATE TABLE IF NOT EXISTS $t_name 
					(
						iid SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
						ticker VARCHAR(6) UNIQUE NOT NULL,
						name VARCHAR(50) DEFAULT '---'
					);
				";
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



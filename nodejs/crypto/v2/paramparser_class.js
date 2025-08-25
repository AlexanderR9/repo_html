const {space, log, curTime, hasField, jsonFromFile, jsonKeys, fileExist, isJson} = require("./../utils.js");

// список валидных значений команд  (порядок элементов важен)
const REQ_NAME_VALID_LIST = ["balance", "tx_count", "approved", "gas_price", "chain_id", "tx_status"];

//класс для чтения и обработки входного json-файла параметров для скрипта
class ParamParser 
{
	constructor(fname) 
	{	
	    this.keys = []; //список ключей считанного объекта из файла параметров
	    this.params = {}; //полный считанный объект из файла параметров
	    this.param_file = fname;
	    this.err = ""; //значение ошибки при чтении файла параметров, пустая строка означает OK
	    this._initParams();
	    this._checkReqNameValue()
	    
	    if (!this.invalid()) log("loaded OK!  ");
	}

	//инициализация объекта 
	_initParams()
	{
	    log(`try loading paramfile [${this.param_file}] ..........`);
	    if (!fileExist(this.param_file)) {this.err="params-file not found"; return;}

            const jres = jsonFromFile(this.param_file);
	    if (!isJson(jres)) {this.err="params-file not json-obj"; return;}
	    if (!hasField(jres, "req_name")) {this.err="params-file have not field <req_name>"; return;}	 

	    this.params = jres;
	    this.keys = jsonKeys(jres);    
	    log(`params object contains ${this.paramCount()} fields`);
	    log("PARAMS_OBJ:", this.params);	    
	}
	//проверка значения самой команды запроса, т.е. поля 'req_name'
	_checkReqNameValue()
	{
	    if (this.invalid()) return;
	    if (!REQ_NAME_VALID_LIST.includes(this.reqName()))
	    {
		this.err = ("invalid cmd value: "+this.reqName());
		log("Correct commands: \n ", REQ_NAME_VALID_LIST);
	    }
	}



	//inline funcs
	paramCount() {return this.keys.length;}
	isEmpty() {return (this.keys.length == 0);}
	invalid() {return (this.err != "");}
	reqName()
	{
	    if (this.isEmpty()) return "none";
	    if (!hasField(this.params, "req_name")) return "none";	 
	    return this.params.req_name;
	}

	//функциий возвращающие признак того, что пришел запрос типа  REQ_NAME_VALID_LIST[i]
	isBalanceReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_VALID_LIST[0]));}
	isTxCountReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_VALID_LIST[1]));}
	isApprovedReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_VALID_LIST[2]));}
	isGasPriceReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_VALID_LIST[3]));}
	isChainIdReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_VALID_LIST[4]));}
	isTxStatusReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_VALID_LIST[5]));}


/*
	first() {return (this.isEmpty() ? "" : this.at(0));}
	last() {return (this.isEmpty() ? "" : this.at(this.count()-1));}

  	out() //to debug (diag func)
	{
		if (this.invalid) {log("invalid!!!"); return;}	

		log("/////// SCRIPT ARGUMENTS ///////////")
		log("SCRIPT: ", this.script_name);
		if (this.isEmpty()) {log("ARGS_EMPTY"); return;}	

		const n = this.count();
		log("ARGS_COUNT: ", n);
		let i = 0;
		for (i=0; i<n; i++) 
			log(i+1, ".  [", this.at(i), "]");
  	}
	at(i)
	{
        	if (i>=this.count() || i<0) return "???";
        	return this.list[i];
	}
	isNumber(i) ///является ли аргумент числом (float или int)
	{
		let a = Number.parseFloat(this.at(i));
		return Number.isFinite(a);
	}
*/

}

module.exports = {ParamParser, REQ_NAME_VALID_LIST};


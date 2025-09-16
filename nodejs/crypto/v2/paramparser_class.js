const {space, log, curTime, hasField, jsonFromFile, jsonKeys, fileExist, isJson} = require("./../utils.js");

// список валидных значений команд на чтение  (порядок элементов важен)
const REQ_NAME_LIST = ["balance", "tx_count", "approved", "gas_price", "chain_id", "tx_status"];

// список валидных значений команд на запись  (порядок элементов важен)
const TX_REQ_NAME_LIST = ["wrap", "unwrap", "transfer", "approve", "swap"];

//класс для чтения и обработки входного json-файла параметров для скрипта
class ParamParser 
{
	constructor(fname) 
	{	
	    this.keys = []; //список ключей считанного объекта из файла параметров
	    this.params = {}; //полный считанный объект из файла параметров
	    this.param_file = fname;
	    this.err = ""; //значение ошибки при чтении файла параметров, пустая строка означает OK
	    this._initParams(); // в том числе, проверка наличия основного поля 'req_name'
	    this._checkReqNameValue(); //проверка значения основного поля 'req_name'
	    
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
	    if (!REQ_NAME_LIST.includes(this.reqName()) && !TX_REQ_NAME_LIST.includes(this.reqName()))
	    {
		this.err = ("invalid cmd value: "+this.reqName());
		log("Correct commands: \n ", REQ_NAME_LIST);
	    }
	}



	//help funcs
	paramCount() {return this.keys.length;}
	isEmpty() {return (this.keys.length == 0);}
	invalid() {return (this.err != "");}
	isReadingReq()  // признак того что текущий запрос на чтение
	{
	    if (this.invalid()) return false;
	    return REQ_NAME_LIST.includes(this.reqName());
	}
	isWritingReq() // признак того что текущий запрос на запись (транзакция)
	{
	    if (this.invalid()) return false;
	    return TX_REQ_NAME_LIST.includes(this.reqName());
	}
	reqName() // значение самой команды запроса, т.е. поля 'req_name'
	{
	    if (this.isEmpty()) return "none";
	    if (!hasField(this.params, "req_name")) return "none";	 
	    return this.params.req_name;
	}
	simulateMode() //признак того что текущий запрос на запись и при этом установлен режим симуляции
	{
	    if (!this.isWritingReq()) return false;
	    if (!this.keys.includes("simulate_mode")) return true;
	    return (this.params.simulate_mode == "yes");
	}

	//функциий возвращающие признак того, что пришел запрос типа  REQ_NAME_LIST[i] (read cmd)
	isBalanceReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_LIST[0]));}
	isTxCountReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_LIST[1]));}
	isApprovedReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_LIST[2]));}
	isGasPriceReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_LIST[3]));}
	isChainIdReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_LIST[4]));}
	isTxStatusReq() {return (!this.invalid() && (this.reqName() == REQ_NAME_LIST[5]));}

	//функциий возвращающие признак того, что пришел запрос типа  TX_REQ_NAME_LIST[i] (tx cmd)
	isWrapTxReq() {return (!this.invalid() && (this.reqName() == TX_REQ_NAME_LIST[0]));}
	isUnwrapTxReq() {return (!this.invalid() && (this.reqName() == TX_REQ_NAME_LIST[1]));}
	isTransferTxReq() {return (!this.invalid() && (this.reqName() == TX_REQ_NAME_LIST[2]));}
	isApproveTxReq() {return (!this.invalid() && (this.reqName() == TX_REQ_NAME_LIST[3]));}
	isSwapTxReq() {return (!this.invalid() && (this.reqName() == TX_REQ_NAME_LIST[4]));}

	
	//проверка набора полей(НЕ ЗНАЧЕНИЙ) на соответствие типу запроса
	readFieldsKidOk() //for reading req
	{	    
	    if (this.invalid()) return false;
	    if (this.isBalanceReq() || this.isTxCountReq() || this.isGasPriceReq() || this.isChainIdReq()) return true;
	    if (this.isApprovedReq()) 
	    {
		return (this.keys.includes("token_address"))
	    }
	    if (this.isTxStatusReq()) 
	    {
		return (this.keys.includes("tx_hash"))
	    }
	    return false;
	}    
	writeFieldsKidOk() //for TX req
	{	    
	    if (this.invalid()) return false;
	    if (this.isWrapTxReq() || this.isUnwrapTxReq()) 
	    {
		return (this.keys.includes("amount"))
	    }
	    if (this.isTransferTxReq()) 
	    {
		if (!this.keys.includes("amount")) return false;
		if (!this.keys.includes("token_address")) return false;
		if (!this.keys.includes("to_wallet")) return false;
		return true;
	    }
	    if (this.isApproveTxReq()) 
	    {
		if (!this.keys.includes("amount")) return false;
		if (!this.keys.includes("token_address")) return false;
		if (!this.keys.includes("to_contract")) return false;
		return true;
	    }
	    return false;
	}    

}

module.exports = {ParamParser, REQ_NAME_LIST};


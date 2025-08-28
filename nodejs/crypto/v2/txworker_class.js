
//include modules
const {space, log, isInt, mergeJson, isJson, hasField, fileExist, charRepeat, removeField} = require("./../utils.js");

const { DateTimeObj } = require("./../obj_dt.js");
const { TxGasObj } = require("./gas_class.js");
const { ChainObj } = require("./chain_class.js");
const { WalletObj } = require("./wallet_class.js");
const { ContractObj } = require("./contract_class.js");
const { JSBIWorker } = require("./calc_class.js");


const fs = require("fs");
const F_LOG = "tx.log";




//класс для работы с транзакциями отправка/проверка состояния выполнения
//предварительно требуется создать объект, передав в конструктор WalletObj, который является Signer.
//для выполнения транзакции необходимо вызвать основную функцию данного класса sendTx, передав ей объект json 
//c правильными параметрами которые понимают объекты ethers_js + одно дополнительное поле 'tx_kind'.
//ВНИМАНИЕ: класс не проверяет валидность параметров транзакции, все должно быть корректно иначе транзакция завершится с ошибкой.
//поле 'tx_kind' служит для точного определения типа транзакции и ее отправки, перед записью транзакции это поле будет удалено из объекта параметров.
//обязательное поле params: tx_kind, может принимать следующие значения:
//1. wrap  (оборачивание нативного токена в завернутый)
//2. unwrap  (обратная процедура операции wrap)
//3. approve
//4. transfer  (передача любого токена кошелька на другой кошелек)
//5. mint (чеканка новой позы)
//6. increase (добавление ликвидности в существующую позу)
//7. decrease (перевод части/всей ликвидности указанной позы в раздел невостребованные комиссии этой позы)
//8. collect (вывод токенов-комиссий у заданной позы на кошелек)
//9. swap (обмен токенов один на другой в кошельке используя конкретный пул)
//10. burn (Сжигает позицию. Ликвидность токена должна быть нулевой, и все токены должны быть собраны)
class TxWorkerObj
{
    //в конструкторе необходимо передать объект валидный wallet_obj, при чем у которого должен быть активирован signer
    constructor(w_obj)
    {
	this.wallet = w_obj;
	this.tx_debug = true; //выводить полученный ответ из сети после отправки транзакции в debug
	this.fee_gas = new TxGasObj(); // объект который отвечает за параметры газа для текущей сети и его размера.
	this.isSimulate = true; //признак режима симуляции
    }

    // признак успешности инициализации объекта
    _invalid() {return (this.wallet == null || this.wallet.invalid() || !this.wallet.isSigner());}	

    // признак того что тип транзакции относится PosManager operations
    _isPosManagerKind(tx_kind) //protected
    {
	if (tx_kind == "mint") return true;
	if (tx_kind == "increase") return true;
	if (tx_kind == "decrease") return true;
	if (tx_kind == "collect") return true;
	if (tx_kind == "burn") return true;
	return false;
    }

    //после успешной отправки транзакции и получения ее хеша можно добавить соответствующую запись в файл логов
    _addTxLog(tx_reply, tx_kind)
    {
        let fline = "";
        if (!fileExist(F_LOG))
        {
            log("TXWorker: log file [", F_LOG, "] not found, need to create it");
            fline = "### Date / Time / TX_hash / Chain / TX_kind";
            fs.writeFileSync(F_LOG, (fline+'\n'));
        }
    
        //add new record
	const dt = new DateTimeObj(); //время отправки транзакции, инициализируется текущими DT
        fline = (dt.strDate() + " / " + dt.strTime(true) + " / " + tx_reply.hash + " / " + ChainObj.currentChain() + " / " + tx_kind);
        fs.appendFileSync(F_LOG, (fline + '\n'));
    }
    
    // проверить результат на предмет была ли отправлена транзакция в сеть
    // если результат простое ценлое отрицательное число то - неудача.
    _checkTxReply(tx_result, tx_kind)
    {
	const checked_res = {code: 0};
	if (isInt(tx_result) && tx_result < 0) // произошла ошибка при выполнении
	{
	    log("TxWorkerObj WARNING: invalid TX result, code ", tx_result);
	    checked_res.code = tx_result;	
	    checked_res.result = "FAULT";
	    return checked_res;
	}
	if (this.isSimulate) // активирован режим симуляции, вместо реальной транзакции получаем лимит газа
	{
	    log("TXWorker: Simulate mode was ativated!!!");
	    checked_res.result = "SIMULATE";
	    checked_res.estimated_gas = tx_result.toString();	
	    return checked_res;	    
	}
	    
        //TX sent OK
        if (this.tx_debug) log("CHAIN_TX_REPLY:", tx_result);
	this._addTxLog(tx_result, tx_kind); //add log record
        checked_res.result = "OK";
        checked_res.tx_hash = tx_result.hash;
	return checked_res;
    }

    //функция проверяет результат выполнения транзакции по ее хеш-значению, 
    //возвращает код текущего состояния транзакции (-1 еще выполняется, 1 выполнена успешно, 0 транзакция завершилась но результат отрицательный)
    async checkTxByHash(hash_value)
    {
        let result = {status: -1, finished: false};
        log("try check TX result by HASH:", hash_value, " .......");
        const tx_state = await this.wallet.pv.getTransactionReceipt(hash_value);
        if (!isJson(tx_state)) {log("TX is executing else."); return result;} //tx running else
        else result.finished = true;

        result.status = ((tx_state.status == 1) ? 1 : 0);

	//log("tx_state:", tx_state);
        result.gas_used = tx_state.gasUsed.toString();
	const gweis = JSBIWorker.weisToGwei(tx_state.effectiveGasPrice, 3);
	result.gas_price = (gweis.toString() + " gw");
	const full_gw = Number.parseInt(result.gas_used)*gweis; // полная цена газа в гвеях
	result.fee = (full_gw/(10**9)).toFixed(8);
	

        // finished with fail
        if (result.status == 0)
        {
            log("TX executed with FAULT, status: ", tx_state.status);
            log("TX: \n", tx_state);
        }
        else log("TX executed success");
        return result;
    }


    //отправить транзакцию в сеть.
    //для каждой операции должен свой достаточный набор конкретных параметров параметров.
    //все параметры должны быть корректно заданы.	
    async sendTx(params)
    {
	if (this._invalid()) {log("TxWorkerObj WARNING: invalid state of object."); return -101;}
	if (!isJson(params)) {log("TxWorkerObj WARNING: invalid paramers, is not JSON."); return -102;}
	if (!hasField(params, "tx_kind")) {log("TxWorkerObj WARNING: params has not JSON field [tx_kind]."); return -103;}
	log("TX params: ", params, '\n');
	log("Simulate mode: ", this.isSimulate);
	const tx_kind = params.tx_kind;
	removeField(params, "tx_kind");	

        //prepare fee params
        let fee_params = {};
        this.fee_gas.setFeeParams(fee_params);	
        log("fee_params:", fee_params, '\n');

        log("try send transaction .................................................");
	let tx_result = null;
	if (tx_kind == "wrap") { tx_result = await this._wrap(params, fee_params);}
	else if (tx_kind == "unwrap") { tx_result = await this._unwrap(params, fee_params);}
	else if (tx_kind == "approve") { tx_result = await this._approve(params, fee_params);}
	else if (tx_kind == "transfer") { tx_result = await this._transfer(params, fee_params);}
	else if (this._isPosManagerKind(tx_kind)) { tx_result = await this._pmTx(params, fee_params);}
	else if (tx_kind == "swap") { tx_result = await this._swap(params, fee_params);}
	else {log("TxWorkerObj WARNING: invalid TX kind - ", tx_kind); return -104;}

	// process result
	return this._checkTxReply(tx_result, tx_kind);
    };
    
    ///////////////////PROTECTED SEND_TX METODS///////////////////////
    async _wrap(params, fee_params) //need params: value, token_address
    {
	mergeJson(params, fee_params);    
        const wrapAbi = [ "function deposit() public payable" ];
	const t_contract = ContractObj.getContract(this.wallet.wrapedNativeAddr(), wrapAbi, this.wallet.signer);
        try
        {
	    let tx_reply = null;
	    if (this.isSimulate) tx_reply = await t_contract.estimateGas.deposit(params);
	    else tx_reply = await t_contract.deposit(params);
	    return tx_reply;
        }
        catch(e) {log("ERROR:", e); }
	return -111;
    }
    async _unwrap(params, fee_params) //need params: value, token_address
    {
        const unwrapAbi = [ "function withdraw(uint256 amount) public" ];
	const t_contract = ContractObj.getContract(this.wallet.wrapedNativeAddr(), unwrapAbi, this.wallet.signer);
        try
        {
	    let tx_reply = null;
	    if (this.isSimulate) tx_reply = await t_contract.estimateGas.withdraw(params.value);
	    else tx_reply = await t_contract.withdraw(params.value, fee_params);
	    return tx_reply;
        }
        catch(e) {log("ERROR:", e); }
	return -112;
    }
/*
    async _approve(params, fee_params) //need params: value, token_address, target_address
    {
        const t_obj = m_base.getTokenContract(params.token_address, this.wallet.signer);
        try
        {
            const tx_reply = await t_obj.approve(params.target_address, params.value, fee_params);
	    return tx_reply;
        }
        catch(e) {log("ERROR:", e); }
	return -113;
    }
    async _transfer(params, fee_params) //need params: value, token_address, target_address
    {
	const bi_sum = m_base.toBig(params.value);
	if (params.token_address == "") //native token
	{
	    fee_params.to = params.target_address;
	    fee_params.value = bi_sum;
    	    try
    	    {
        	const tx_reply = await this.wallet.signer.sendTransaction(fee_params);
		return tx_reply;
    	    }
    	    catch(e) {log("ERROR:", e); }
	}
	else // any token
	{
    	    const t_obj = m_base.getTokenContract(params.token_address, this.wallet.signer);
    	    try
    	    {
        	const tx_reply = await t_obj.transfer(params.target_address, bi_sum, fee_params);
		return tx_reply;
    	    }
    	    catch(e) {log("ERROR:", e); }	    
	}
	return -114;
    }
    async _pmTx(params, fee_params)
    {
	const operation_name = params.tx_kind;
        const pm_contract = m_base.getPosManagerContract(this.wallet.pv);
        const pm_conn = pm_contract.connect(this.wallet.signer);
	delete params.tx_kind;

        let tx_reply = {};
        if (operation_name == "mint")
        {
            try { tx_reply = await pm_conn.mint(params, fee_params); }
            catch(e) {log("ERROR:", e); return -115;}         
        }
        else if (operation_name == "increase")
        {
            try { tx_reply = await pm_conn.increaseLiquidity(params, fee_params); }
            catch(e) {log("ERROR:", e); return -116;}         
        }
        else if (operation_name == "decrease")
        {
            try { tx_reply = await pm_conn.decreaseLiquidity(params, fee_params); }
            catch(e) {log("ERROR:", e); return -117;}         
        }
        else if (operation_name == "collect")
        {
            try { tx_reply = await pm_conn.collect(params, fee_params); }
            catch(e) {log("ERROR:", e); return -118;}         
        }
        else if (operation_name == "burn")
        {
            try { tx_reply = await pm_conn.burn(params.tokenId, fee_params); }
            catch(e) {log("ERROR:", e); return -119;}         
        }
        else {log("ERROR: invalid operation_name ", operation_name); return -99;}

	return tx_reply;
    }
    async _swap(params, fee_params)
    {
        const router_contract = m_base.getRouterContract(this.wallet.pv); //swap router contract object
	const router_conn = router_contract.connect(this.wallet.signer);
	delete params.tx_kind;

        try
        {
            const tx_reply = await router_conn.exactInputSingle(params, fee_params);
	    return tx_reply;
        }
        catch(e) {log("ERROR:", e); }
	return -119;
    }
    

    //PROTECTED METOD
    _saveTXListToFile()
    {
	log("try save TX list to log_file .......");
	if (this.txEmpty()) {log("TX list is empty!"); return;}

	const n = this.txCount();
	for (var i=0; i<n; i++)
	{
	    const fline = this.tx_list[i].toFileLine() + '\n';
	    if (i == 0) fs.writeFileSync("1.txt", fline);
            else fs.appendFileSync("1.txt", fline);
	}
	log(`done, writed ${n} TX records!`);
    }
*/

};


module.exports = {TxWorkerObj};


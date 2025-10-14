
//include modules
const {space, log, isInt, mergeJson, isJson, hasField, fileExist, charRepeat, removeField} = require("./../utils.js");

const { DateTimeObj } = require("./../obj_dt.js");
const { TxGasObj } = require("./gas_class.js");
const { PmTxObj } = require("./pmtxobj_class.js");
const { ChainObj } = require("./chain_class.js");
const { WalletObj } = require("./wallet_class.js");
const { ContractObj } = require("./contract_class.js");
const { JSBIWorker } = require("./calc_class.js");

//including
//const ethers = require("ethers");


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
//11. take_away (комбинация decrease + collect)
class TxWorkerObj
{
    //в конструкторе необходимо передать объект валидный wallet_obj, при чем у которого должен быть активирован signer
    constructor(w_obj)
    {
	this.wallet = w_obj;
	this.tx_debug = true; //выводить полученный ответ из сети после отправки транзакции в debug
	this.fee_gas = new TxGasObj(); // объект который отвечает за параметры газа для текущей сети и его размера.
	this.isSimulate = true; //признак режима симуляции
	this.deadline = 60; // seconds left
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
	if (tx_kind == "take_away") return true;
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
	space();    
	log("_checkTxReply ....................");
	//log("tx_result:", tx_result);
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
	    if (tx_kind == "swap") mergeJson(checked_res, tx_result);
	    else checked_res.estimated_gas = tx_result.toString();	
	    return checked_res;	    
	}
	    
        //TX sent OK
        if (this.tx_debug) log("CHAIN_TX_REPLY:", tx_result);
	this._addTxLog(tx_result, tx_kind); //add log record
        checked_res.result = "OK";
        checked_res.tx_hash = tx_result.hash;
	return checked_res;
    }
    // добавить в структуру параметров транзакции поле deadline.
    // данное поле записывается только для некоторых типов транзакций.
    _addDeadlineField(params)
    {
	removeField(params, "deadline");
	const txk = params.tx_kind;
	if (txk === "swap" || this._isPosManagerKind(txk))
	    params.deadline = Math.floor(Date.now()/1000) + this.deadline;
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

	//check tx kind abd add  DeadlineField if need
	this._addDeadlineField(params);
	log("TX params: ", params, '\n');
	log("Simulate mode: ", this.isSimulate);
	const tx_kind = params.tx_kind;
	removeField(params, "tx_kind");	

        //prepare fee params
	this.fee_gas.setKindFactor(tx_kind);

        let fee_params = {};
        this.fee_gas.setFeeParams(fee_params);	
        log("fee_params:", fee_params, '\n');
	space();space();space();

        log("try send transaction .................................................");
	let tx_result = null;
	if (tx_kind == "wrap") { tx_result = await this._wrap(params, fee_params);}
	else if (tx_kind == "unwrap") { tx_result = await this._unwrap(params, fee_params);}
	else if (tx_kind == "approve") { tx_result = await this._approve(params, fee_params);}
	else if (tx_kind == "transfer") { tx_result = await this._transfer(params, fee_params);}
	else if (this._isPosManagerKind(tx_kind)) { tx_result = await this._pmTx(params, fee_params, tx_kind);} // особый тип параметров
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
    async _transfer(params, fee_params) //need params: value, token_address, target_address
    {
	if (params.token_address == "") //native token
	{
	    log("sending native token ................");
	    fee_params.to = params.to_wallet;
	    fee_params.value = params.value;
	    try
	    {
		let tx_reply = null;
		if (this.isSimulate) tx_reply = await this.wallet.signer.estimateGas(fee_params);
		else tx_reply = await this.wallet.signer.sendTransaction(fee_params);
		return tx_reply;
	    }
    	    catch(e) {log("ERROR:", e); }
	}
	else // any token
	{
	    log("sending some token ................");
	    const t_contract = ContractObj.getTokenContract(params.token_address, this.wallet.signer);
	    try
	    {
		let tx_reply = null;
		if (this.isSimulate) tx_reply = await t_contract.estimateGas.transfer(params.to_wallet, params.value);
		else tx_reply = await t_contract.transfer(params.to_wallet, params.value, fee_params);
		return tx_reply;
	    }
    	    catch(e) {log("ERROR:", e); }
	}
	return -114;
    }
    async _approve(params, fee_params) //need params: value, token_address, to_contract
    {
	const t_contract = ContractObj.getTokenContract(params.token_address, this.wallet.signer);
        try
        {
	    let tx_reply = null;
	    if (this.isSimulate) tx_reply = await t_contract.estimateGas.approve(params.to_contract, params.value);
	    else tx_reply = await t_contract.approve(params.to_contract, params.value, fee_params);
	    return tx_reply;
        }
        catch(e) {log("ERROR:", e); }
	return -113;
    }
    async _swap(params, fee_params)
    {
        const router_contract = ContractObj.getRouterContract(this.wallet.signer);
        try
        {
	    log("try run _swap()");
	    let tx_reply = null;
	    if (this.isSimulate) 
	    {
		const amountOut_bi = await router_contract.callStatic.exactInputSingle(params);		
		const amountOut = JSBIWorker.weisToFloat(amountOut_bi, this.wallet.findAsset(params.tokenOut).decimal);
		const gas = await router_contract.estimateGas.exactInputSingle(params);
		log("result of simulate SWAP:");
		log("amountOut:", amountOut.toString());
		log("gas cost:", gas.toString());

		tx_reply = {};
		tx_reply.amount_out = amountOut.toString();
		tx_reply.estimated_gas = gas.toString();
	    }
	    else tx_reply = await router_contract.exactInputSingle(params, fee_params);
	    return tx_reply;
        }
        catch(e) {log("ERROR:", e); }
	return -119;
    }
    async _pmTx(params, fee_params, tx_kind)
    {
        let tx_reply = undefined;
	const pmtx = new PmTxObj(this.wallet);
	pmtx.setFeeParams(fee_params);
	params.is_simulate = this.isSimulate;

        if (tx_kind == "burn") tx_reply = await pmtx.tryBurn(params);
        else if (tx_kind == "collect") tx_reply = await pmtx.tryCollect(params);
        else if (tx_kind == "decrease") tx_reply = await pmtx.tryDecrease(params);
        else if (tx_kind == "take_away") tx_reply = await pmtx.tryTakeaway(params);
        else {log("ERROR: invalid tx_name ", tx_kind); tx_reply = -99;}

	return tx_reply;
    }
    

};


module.exports = {TxWorkerObj};


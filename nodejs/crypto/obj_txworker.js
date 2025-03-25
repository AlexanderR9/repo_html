
//include modules
const {space, log, curTime, varNumber, mergeJson, isJson, hasField, fileExist} = require("./utils.js");
const m_base = require("./base.js");
const m_wallet = require("./obj_wallet.js");

const fs = require("fs");
const F_LOG = "tx.log";


//класс для работы с транзакциями отправка/проверка/отслеживание
//объект создаеться внутри другого объекта, который отправляет запрос на транзакцию.
//для выполнения транзакции необходимо вызвать основную функцию данного класса sendTx,
//передав ей объект json c правильными параметрами для точного определения типа транзакции и ее отправки.
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
class TxWorkerObj
{
    //в конструкторе необходимо передать объект wallet_obj
    constructor(w_obj)
    {
	this.wallet = w_obj;
	this.tx_debug = true; //выводить полученный ответ из сети после отправки транзакции в debug
    }

    invalid() {return (this.wallet == null);}
    setTxDebug(b) {this.tx_debug = b;}

    //после успешной отправки транзакции и получения ее хеша можно добавить соответствующую запись в файл логов
    addTxLog(tx_reply, tx_kind) 
    {
	let fline = "";
	if (!fileExist(F_LOG))
	{
	    log("TXWorker: log file [", F_LOG, "] not found");
	    fline = "### DateTime / TX_hash / TX_kind";
	    fs.writeFileSync(F_LOG, (fline+'\n'));
	}

	//add new record
        const dt = new Date(Date.now()); 	
//	log(dt.toISOString().replace('T', ' ').split('.')[0]);
	fline = dt.toISOString().replace('T', ' ').split('.')[0] + " / ";
	fline += tx_reply.hash + " / " + tx_kind;
        fs.appendFileSync(F_LOG, (fline+'\n'));		
    }
    //функция проверяет результат выполнения транзакции по ее хеш-значению, 
    //возвращает код текущего состояния транзакции (-1 еще выполняется, 1 выполнена успешно, 0 транзакция завершилась но результат отрицательный)
    async checkTxByHash(hash_value)
    {
        log("try check TX result by HASH:", hash_value, " .......");
        const tx_state = await this.wallet.pv.getTransactionReceipt(hash_value);
        if (!tx_state) {log("TX is executing else."); return -1;} //tx running else

	//calc gas	
	const gas_used = tx_state.gasUsed;
	var gas_price = 0;
	if (hasField(tx_state, "effectiveGasPrice")) gas_price = tx_state.effectiveGasPrice;
	else
	{
    	    const tx = await this.wallet.pv.getTransaction(hash_value);
	    gas_price = tx.gasPrice;
    	    //log("TX: \n", tx);
	    //space();    
	}
	gas_price = m_base.fromGwei(gas_price.toString());	
	var gas_fee = gas_used*gas_price;
	log("gas_used =", gas_used.toString());
	log("gas_price =", gas_price, "  Gwei/ps");
	log("gas_fee =", gas_fee, " Gwei");
	log("gas_fee =", m_base.fromGwei(gas_fee).toString().slice(0,8), m_base.nativeToken());


        if (tx_state.status == 1) {log("TX executed success"); return 1;}
    
        // finished with fail
        log("TX executed with FAULT, status: ", tx_state.status);
        log("TX: \n", tx_state);
        return 0;
    }       


    // признак того что тип транзакции относится PosManager operations
    _isPosManagerKind(tx_kind) //protected
    {
	if (tx_kind == "mint") return true;
	if (tx_kind == "increase") return true;
	if (tx_kind == "decrease") return true;
	if (tx_kind == "collect") return true;
	return false;
    }
    
    
    //отправить транзакцию в сеть.
    //для каждой операции должен свой достаточный набор конкретных параметров параметров.
    //все параметры должны быть корректно заданы.	
    async sendTx(params)
    {
	if (this.invalid()) {log("TxWorkerObj WARNING: invalid state of object."); return -101;}
	if (!isJson(params)) {log("TxWorkerObj WARNING: invalid paramers, is not JSON."); return -102;}
	if (!hasField(params, "tx_kind")) {log("TxWorkerObj WARNING: params has not JSON field [tx_kind]."); return -102;}
	log("TX params: ", params, '\n')

        //prepare fee params
        let fee_params = {};
        this.wallet.gas.setFeeParams(fee_params);
        log("fee_params:", fee_params, '\n');

        log("try send transaction .................................................");
	let tx_result = null;
	let tx_kind = params.tx_kind;
	if (tx_kind == "wrap") { tx_result = await this._wrap(params, fee_params);}
	else if (tx_kind == "unwrap") { tx_result = await this._unwrap(params, fee_params);}
	else if (tx_kind == "approve") { tx_result = await this._approve(params, fee_params);}
	else if (tx_kind == "transfer") { tx_result = await this._transfer(params, fee_params);}
	else if (this._isPosManagerKind(tx_kind)) { tx_result = await this._pmTx(params, fee_params);}
	else if (tx_kind == "swap") { tx_result = await this._swap(params, fee_params);}
	else {log("TxWorkerObj WARNING: invalid TX kind - ", tx_kind); return -103;}

	if (!isJson(tx_result)) {log("TxWorkerObj WARNING: invalid TX result, code ", tx_result); return tx_result;} //TX sending fault

        //TX sent OK
        if (this.tx_debug) log("TX_REPLY:", tx_result);
	this.addTxLog(tx_result, tx_kind); //add log record
        return {code: true, tx_hash: tx_result.hash};
    };
    ///////////////////PROTECTED SEND_TX METODS///////////////////////
    async _wrap(params, fee_params) //need params: value, token_address
    {
	let tx_params = fee_params;
	tx_params.value = params.value;
        const wrapAbi = [   "function deposit() public payable"    ];
        const t_obj = m_base.getContract(params.token_address, wrapAbi, this.wallet.signer);
        try
        {
            const tx_reply = await t_obj.deposit(tx_params);
	    return tx_reply;
        }
        catch(e) {log("ERROR:", e); }
	return -111;
    }
    async _unwrap(params, fee_params) //need params: value, token_address
    {
	const bi_sum = m_base.toBig(params.value);
        const unwrapAbi = [   "function withdraw(uint256 amount) public"    ];
        const t_obj = m_base.getContract(params.token_address, unwrapAbi, this.wallet.signer);
//	log("unwrap bi_sum:", bi_sum);
        try
        {
            const tx_reply = await t_obj.withdraw(bi_sum, fee_params);
	    return tx_reply;
        }
        catch(e) {log("ERROR:", e); }
	return -112;
    }
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
    


};


module.exports = {TxWorkerObj};


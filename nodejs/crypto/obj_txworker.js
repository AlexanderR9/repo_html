
//include modules
const {space, log, curTime, varNumber, isInt, mergeJson, isJson, hasField, fileExist, charRepeat} = require("./utils.js");
const m_base = require("./base.js");
const m_wallet = require("./obj_wallet.js");
const {DateTimeObj} = require("./obj_dt.js");


const fs = require("fs");
const F_LOG = "tx.log";


//вспомогательный класс для хранения данный одной транзакции
class TxRecord
{
    constructor(hash = "")
    {
	this.hash = hash; //основное поле - значение хеш транзакции
	this.dt = new  DateTimeObj(); //время отправки транзакции, инициализируется текущими DT
//	this.dt.reset();
	this.type = "---"; //тип операции, например approve
	this.result = "?"; //результат выполнения, может принимать значения OK/FAULT/?, ? значит неизвестно или до сих пор выполняется 
	this.chain = ""; //сеть в которой выполняется транзакция
	this.fee = -1;  //полная уплаченная комиссия за выполнение транзакции, Gweis (-1 значит пока неизвестно, еще предстоит получить)
//	this.fee_token = ""; //токен, которым платится комиссия за газ
    }
    invalid() {return (this.hash.length < 40 || this.dt.year() < 2024);}
    //вернет строку для записи в файл логов
    toFileLine()
    {
	let fline = this.dt.strDate() + " / " + this.dt.strTime(true) + " / ";
	fline += (this.hash + " / " + this.chain + " / " + this.type + " / " + this.result + " / ");
	fline += this.fee.toString();
	if (this.fee > 0) 
	    fline += ("(" + this.floatFee().toString() + m_base.feeTokenByChain(this.chain)  + ")");
	return fline;    
    }
    //спарсит строку файла и записать значения структуры
    fromFileLine(f_line)
    {
        let arr = f_line.split('/');
        if (arr.length != 7) {log("WARNING: invalid fields count of TX record data:", f_line); return;}
	
	const sdt = arr[0].trim() + "  " + arr[1].trim();
	this.dt.fromString(sdt);
	this.hash = arr[2].trim();
	this.chain = arr[3].trim();
	this.type = arr[4].trim();
	this.result = arr[5].trim();
	this.fee = this._parseFee(arr[6]);
	
/*
	const s_date = arr[0].trim();
	const dt_arr = s_date.split(' ');	
	this.dt.parseDate_invert(dt_arr[0]);
	this.dt.fromString(dt_arr[dt_arr.length-1]);
			
	this.chain = m_base.currentChain();
	//this.fee = 65465465;
*/

    }
    //реальное значении комисии в количестве токена сети
    floatFee()
    {
	return (this.fee/(10**9)).toFixed(6); 
    }
    _parseFee(f_cell)
    {
	let s = f_cell.trim();
	if (s.includes('('))
	{
	    const pos = s.indexOf('(');
	    if (pos > 0) s = s.slice(0, pos);
	}

	const res = Number.parseInt(s);
	if (isInt(res)) return res;
	return -1;
    }


};


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
	this.tx_list = []; //контейнер для загрузки/выгрузки лог файла записей транзакции типа TxRecord
    }

    invalid() {return (this.wallet == null);}	
    txCount() {return this.tx_list.length;}
    txEmpty() {return (this.txCount() == 0);}
    setTxDebug(b) {this.tx_debug = b;}

    //загрузка записей транзакций из лог файла в контейнер tx_list
    loadTxFile()
    {
	this.tx_list = [];
        log("try get TX records from file [tx.log] ......");
        if (!fs.existsSync(F_LOG)) {log("WARNING: pools file not found - ", F_LOG); return false;}

        const data = fs.readFileSync(F_LOG);
        let f_list = data.toString().split("\n");
        for (let i=0; i<f_list.length; i++)
        {
	    const f_line = f_list[i].trim();
	    if (f_line.length < 50) continue;
	    if (f_line[0] == '#') continue;
	    
	    //log("f_line: ", f_line);
	    let rec = new TxRecord();
	    rec.fromFileLine(f_line);
	    if (rec.invalid())
	    {
		log("TxWorkerObj: WARNING invalid parsing TX file line: ", f_line);
		rec = null;
	    }
	    else this.tx_list.push(rec);
	}
	return (this.tx_list.length > 0);
    }
    //вывести в debug список TX записей
    showTXList()
    {
	log(charRepeat('=', 30), " TX records ", charRepeat('=', 30));
	if (this.txEmpty()) {log("TX list is empty!"); return;}

	const n = this.txCount();
	for (var i=0; i<n; i++)
	    log(`${i+1}. `, this.tx_list[i].toFileLine());
    }

    //после успешной отправки транзакции и получения ее хеша можно добавить соответствующую запись в файл логов
    addTxLog(tx_reply, tx_kind) 
    {
	let fline = "";
	if (!fileExist(F_LOG))
	{
	    log("TXWorker: log file [", F_LOG, "] not found");
	    fline = "### Date / Time / TX_hash / Chain / TX_kind / Result / Gas fee";
	    fs.writeFileSync(F_LOG, (fline+'\n'));
	}

	//add new record
        let rec = new TxRecord(tx_reply.hash);
	rec.chain = m_base.currentChain();
	rec.type = tx_kind;
        if (rec.invalid())
	{
	    log("TxWorkerObj: WARNING invalid TX record, can't write log_file ");
	    rec = null;
	    return;	
	}

/*
	    rec.fromFileLine(f_line);
	    if (rec.invalid())
	    {
		log("TxWorkerObj: WARNING invalid parsing TX file line: ", f_line);
		rec = null;
	    }
	    else this.tx_list.push(rec);
*/

/*
        const dt = new Date(Date.now()); 	
//	log(dt.toISOString().replace('T', ' ').split('.')[0]);
	fline = dt.toISOString().replace('T', ' ').split('.')[0] + " / ";
	fline += tx_reply.hash + " / " + tx_kind;
*/

	fline = rec.toFileLine() + '\n'
        fs.appendFileSync(F_LOG, fline);
	rec = null;
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

};


module.exports = {TxWorkerObj};


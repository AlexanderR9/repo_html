
//standart utils funcs
const { space, log, jsonFromFile, hasField, jsonKeys, isInt } = require("./../utils.js");

// my class objects
const { ChainObj } = require("./chain_class.js");
const { ContractObj } = require("./contract_class.js");
const { JSBIWorker } = require("./calc_class.js");

const TOKENS_FILE="tokens.json";
const BALANCE_PRECISION=5;


//вспомогательный класс контейнер для одного актива
class WalletAsset
{
	constructor(t_name)
	{
		this.decimal = 0;
		this.address = "?";
		this.name = t_name;			
		this.balance = -1;
	}	
	invalid()
	{
		if (this.decimal <= 0) return true;
		if (this.name == "none" || this.name.length < 2) return true;
		if (this.address.length < 10) return true;
		return false;
	}
	out()
	{
		if (this.invalid()) {log("WalletAsset: [INAVLID_FIELDS]"); return;}	

		log("WalletAsset:");	
		log("   NAME: ", this.name)
		log("   ADDR: ", this.address)
		log("   DECIMAL: ", this.decimal)
		log("   BALANCE: ", this.balance)
	}
	parse(jobj)
	{
	    if (hasField(jobj, "address")) this.address = jobj.address;
	    if (hasField(jobj, "decimal")) 
	    {
		const a = jobj.decimal;
		if (isInt(a)) this.decimal = a;
		else this.decimal = Number.parseInt(a);
	    }	    
//	    log(`this.address(${this.address})  this.decimal = ${this.decimal}`);
	}
}


//класс для работы с кошельком
//можно просматривать балансы всех токенов, предварительно вызвав функцию updateBalance()	
//класс при инициализации в список активов сначала добавляет нативный токен (т.е. он будет с индесом 0), затем считывает из файла остальные токены.
class WalletObj
{
	//при создании экземпляра необходимо сразу передать публичный адрес и необязательный параметр - приватный ключ
	constructor(addr, private_key = "") 
	{	
		log("Create wallet object: ", addr);
		this.address = addr; //public address
		this.pv = ContractObj.getProvider();	

		//инициализация активов кошелька
		this.assets = []; /// WalletAsset array
		this._initNativeToken(); // init firsrt asset (native token)
		this._loadTokensFile();
	
		this.signer = null;
		if (private_key.length > 10)  
		{
		    this.signer = ContractObj.getWallet(private_key, this.pv);
		}
  	}

	//инициализация нативного токена, он всегда в списке активов кошелька с индексом 0
	_initNativeToken() //protected
	{
		if (ChainObj.invalidChain()) return;

		let asset = new WalletAsset(1);
		asset.name = ChainObj.nativeToken();
		asset.decimal = 18;
		asset.address = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
		this.assets[0] = asset;
	}
	//загрузка токенов в this.assets из файла TOKENS_FILE (кроме нативного)
	_loadTokensFile() 
	{
	    if (this.invalid()) return;

	    log("loading file: ", TOKENS_FILE);
	    const jres = jsonFromFile(TOKENS_FILE);
//	    log("RESULT:", jres);
	    const keys = jsonKeys(jres);
	    keys.forEach(v => {
		//console.log(`TOKEN: ${v}`);
		let asset = new WalletAsset(v);
		asset.parse(jres[v]);
		if (!asset.invalid()) this.assets.push(asset);   
		else log("WARNING: invalid asset: ", jres[v]);
	    });
	}


	assetsCount() {return this.assets.length;} //количетсво активов в кошельке
	isSigner() {return (this.signer != null);}
	invalid() {return (this.assetsCount() == 0);} // состояние объекта

	//функция ищет по адресу контракта актив кошелька из контейнера this.assets.
	//возвращает объект с полями ticker, decimal, addr.
	//если актив не будет найден то, поле decimal=-1, ticker=""
	findAsset(t_addr)
	{
	    let result = {addr: t_addr.trim().toLowerCase(), ticker: "", decimal: -1};
	    if (result.addr.length < 10) {log("Invalid input address"); return result;}
	    if (this.assetsCount() <= 0) {log("Invalid assets container"); return result;}
    	    
	    for (let i=0; i<this.assets.length; i++)
	    {
		if (this.assets[i].address.toLowerCase() == result.addr)
		{
		    result.ticker = this.assets[i].name;
		    result.decimal = this.assets[i].decimal;
		    break;
		}
	    }
	    return result;
	}


	//diag debug
	out()
	{
		log("WalletObj: ");
		log("public_address: ", this.address);	
		log("is_signer:", this.isSigner() ? "TRUE" : "FALSE");		
		log("assets: ", this.assetsCount());
	}
	outAssets()
	{
		space();
		log("----------- WALLET ASSETS -------------");
		for (let i=0; i<this.assets.length; i++)
			this.assets[i].out();		
	}
	showBalances()
	{	
		log("----------- WALLET ASSETS BALANCES -------------");		
		const n = this.assetsCount();
		for (let i=0; i<n; i++)
		{
		    var s = ((i).toString() + ".  " + this.assets[i].name + " ");
		    const t_len = this.assets[i].name.length;
		    s += Array(5-t_len).join(" ");			
		    s += ("[" + this.assets[i].address + "]  ");
		    s += Array(10).join("_");			
		    log(s, this.assets[i].balance);
		}
	}

	////////////////////////////запросы в сети, (только чтение)////////////////////////////////////////////
	//возвращает количетсво всех транзакций совершенных кошельком
	//кошелек должен находится в режиме SIGNER.	
	async txCount()
	{
    	    log("get Tx count of WALLET ....");
	    if (!this.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return;}
    	    const result = await this.signer.getTransactionCount();
    	    return result;
	}
	//вернет текущую цену газа в виде объекта с двумя полями {weis, gweis}
	async currentGasPrice()
	{
	    log("Try get current gas price .........");
	    const data = await this.pv.getGasPrice();
	    let result = {weis: data.toString()};
	    result.gweis = JSBIWorker.weisToGwei(data, 3);
	    //log("data:", data);
	    return result;
	}
	//получить идентификатор текущей сети
	async chainId()
	{
	    log(`Try get chain ID (${ChainObj.currentChain()}) .........`);
	    const data = await this.pv.getNetwork();
	    //log("data:", data);
	    if (hasField(data, "chainId")) return Number.parseInt(data.chainId);
	    return -1;	    
	}
	//получить баланс актива с указанным индексом из списка активов кошелька (this.assets)
	//баланс возвращается в количетсве wei(согласно decimal данного актива), т.е. BigInt либо -1 в случае ошибки  
	async balance(i)
	{
		var result = -1;
		if (i == 0)  // баланс нативного токена
		{	
		    log("get native balance ...");
	    	    result = await this.pv.getBalance(this.address);
		}
		else if (i>0 && i < this.assetsCount())
		{
        	    const t_obj = ContractObj.getTokenContract(this.assets[i].address, this.pv);
        	    result = await t_obj.balanceOf(this.address);		    
		}
		else log("WARNING: Invalid asset index ", i, ", assets count: ", this.assetsCount());
		return result;
	}
	//обновить балансы всех токенов кошелька, т.е. обновить значения balance у элементов this.assets.
	//при успешном запросе значения балансов приводятся нормальный читабельный вид.
	//функция ничего не возвращает
	async updateBalances()	
	{
	    if (this.invalid()) {log("Invalid WALLET_OBJ state, assets is empty!");  return -1;}

	    log("try get balances all......");
	    let p_arr = [];		
	    const n = this.assetsCount();
	    for (let i=0; i<n; i++) p_arr[i] = this.balance(i);
	    const data = await Promise.all(p_arr);
	    if (!Array.isArray(data)) {log("WARNING: invalid result, data is not array"); return;} 
	    if (n != data.length) {log("WARNING: invalid result, data.length != n_assets"); return;} 

	    //log("RESULT_OK:", data); //значения балансов(BigInt) успешно получены
	    for (var i=0; i<n; i++)
    		this.assets[i].balance = JSBIWorker.weisToFloat(data[i], this.assets[i].decimal, BALANCE_PRECISION);
	}
	//функция определяет сколько единиц актива с индексом i предоставлено контракту to_addr.
	//результат возвращается в нормализованных единицах.
	async checkApproved(i, to_addr)
	{
	    log("try check approved size ......");
	    if (i >= this.assetsCount() || i < 0) {log("Invalid asset index ", i, ", assets count: ", this.assetsCount()); return -1;}

	    log("ASSET:", this.assets[i].name, "/" ,this.assets[i].address);
	    log("TO_CONTRACT:", to_addr);	    
	    let result = -1;

	    //try send request 
    	    const t_obj = ContractObj.getTokenContract(this.assets[i].address, this.pv);
            try {  result = await t_obj.allowance(this.address, to_addr); }
            catch(e) {log("ERROR:", e); return -1;}
	    return JSBIWorker.weisToFloat(result.toString(), this.assets[i].decimal, 2);	    
	}



	/////////////////////////////TRANSACTIONS FUNCS//////////////////////////////////////////


/*

	//TX_1. функция конвертирует завернутый нативный токен в нативную монету(внутри кошелька).
	//для этого в списке токенов кошелька должен присутствовать токен вида  W<NATIVE_TICKER> (example: WPOL)
	//если такого токена нет, то функция ничего не выполнит. Для такой операции approve не нужно делать предварительно.
	async unwrapNative(sum)
	{
	    log("try unwrap native asset ......");
	    if (!this.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return -1;}
	    if (!varNumber(sum))  {log("WARNING: unwraping SUM is not number_value, sum: ", sum); return -2;}
	    if (sum < 0.01 || sum > 10000)  {log("WARNING: unwraping SUM is not correct, sum:", sum); return -2;}
	    if (this.assetsCount() < 2) {log("Invalid asset count: ", this.assetsCount()); return -2;}
	    
	    const nt = this.assets[0].name;
	    const wnt = ("W" + nt);
	    log("Native coin: ", nt, ",   wraped token: ", wnt);
	    //find wraped native token
	    let i_wraped = -1;
    	    for (let i=1; i<this.assets.length; i++)
		if (this.assets[i].name == wnt) {i_wraped = i; break;}
	    if (i_wraped < 0) {log("WARNING: wraped native token not found among wallet assets"); return -3;}

    	    //prepare BinNumber sum
    	    const bi_sum = m_base.fromReadableAmount(sum, this.nativeDecimal());
    	    log("BI sum format: ", bi_sum, " / ", bi_sum.toString());
	    log("index of wraped token: ", i_wraped);	    	    
    	    space();

	    //prepare tx params
            let tx_params = {tx_kind: "unwrap", value: bi_sum.toString()};
	    tx_params.token_address = this.assets[i_wraped].address;        
            /////////////////////SEND TX///////////////////////////////////
            const result = await this.tx_worker.sendTx(tx_params);
            return result;
	}
	//TX_2. функция конвертирует нативный токен в завернутый тот же токен(внутри кошелька).
	//для этого в списке токенов кошелька должен присутствовать токен вида  W<NATIVE_TICKER> (example: WPOL)
	//если такого токена нет, то функция ничего не выполнит. Для такой операции approve не нужно делать предварительно.
	async wrapNative(sum)
	{
	    log("try wrap native asset ......");
	    if (!this.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return -1;}
	    if (!varNumber(sum))  {log("WARNING: wraping SUM is not number_value, sum: ", sum); return -2;}
	    if (sum < 0.01 || sum > 10000)  {log("WARNING: wraping SUM is not correct, sum:", sum); return -2;}
	    if (this.assetsCount() < 2) {log("Invalid asset count: ", this.assetsCount()); return -2;}
	    
	    const nt = this.assets[0].name;
	    const wnt = ("W" + nt);
	    log("Native coin: ", nt, ",   wraped token: ", wnt);
	    //find wraped native token
	    let i_wraped = -1;
    	    for (let i=1; i<this.assets.length; i++)
		if (this.assets[i].name == wnt) {i_wraped = i; break;}
	    if (i_wraped < 0) {log("WARNING: wraped native token not found among wallet assets"); return -3;}

    	    //prepare BinNumber sum
    	    const bi_sum = m_base.fromReadableAmount(sum, this.nativeDecimal());
    	    log("BI sum format: ", bi_sum, " / ", bi_sum.toString());
	    log("index of wraped token: ", i_wraped);	    	    
    	    space();

	    //prepare tx params
            let wrap_params = {tx_kind: "wrap", value: bi_sum};
	    wrap_params.token_address = this.assets[i_wraped].address;        
            /////////////////////SEND TX///////////////////////////////////
            const result = await this.tx_worker.sendTx(wrap_params);
            return result;
	}
	//TX_3. функция предоставляет актив с указанным индексом контракту to_addr. sum - количество предоставляемого токена.
	//кошелек должен находится в режиме SIGNER.	
	async tryApprove(i, to_addr, sum)
	{
	    log("try approve asset ......");
	    if (!this.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return -1;}
	    if (!varNumber(sum))  {log("WARNING: approvig SUM is not number_value, sum: ", sum); return -2;}
	    if (sum < 0.01 || sum > 10000)  {log("WARNING: approvig SUM is not correct, sum:", sum); return -3;}
	    if (i >= this.assetsCount() || i < 0) {log("Invalid asset index ", i, ", assets count: ", this.assetsCount()); return -4;}
	    
	    log("ASSET:", this.assets[i].name, "/" ,this.assets[i].address);
	    log("TO_CONTRACT:", to_addr);
	    log("APPROVING_AMOUNT:", sum, '\n');

    	    //prepare sum
    	    const bi_sum = m_base.fromReadableAmount(sum, this.assets[i].decimal);
    	    log("BI sum format: ", bi_sum, " / ", bi_sum.toString());
    	    space();

	    //prepare tx_params
            let tx_params = {tx_kind: "approve", value: bi_sum.toString()};
	    tx_params.token_address = this.assets[i].address;        
	    tx_params.target_address = to_addr;        
            /////////////////////SEND TX///////////////////////////////////
            const result = await this.tx_worker.sendTx(tx_params);
            return result;
	}
	//TX_4. функция отправляет актив с указанным индексом на другой кошелек to_addr. sum - количество переводимого токена.
	//кошелек должен находится в режиме SIGNER.	
	async trySend(i, to_addr, sum)
	{
	    log("try transfer asset ......");
	    if (!this.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return -1;}
	    if (!varNumber(sum))  {log("WARNING: transfer SUM is not number_value, sum: ", sum); return -2;}
	    if (sum < 0.0001 || sum > 10000)  {log("WARNING: transfer SUM limit is not correct, sum:", sum); return -3;}
	    if (i >= this.assetsCount() || i < 0) {log("Invalid asset index ", i, ", assets count: ", this.assetsCount()); return -4;}

	    log("SENDING ASSET:", this.assets[i].name, "/" ,this.assets[i].address);
	    if (i==0) log("IS A NATIVE TOKEN");
	    log("TO_WALLET:", to_addr);
	    log("ASSET_AMOUNT:", sum, '\n');

    	    //prepare sum
    	    const bi_sum = m_base.fromReadableAmount(sum, this.assets[i].decimal);
    	    log("BI sum format: ", bi_sum, " / ", bi_sum.toString());
    	    space();

	    //prepare tx_params
            let tx_params = {tx_kind: "transfer", value: bi_sum.toString()};
	    tx_params.token_address = ""; //native coin
	    if (i>0) tx_params.token_address = this.assets[i].address;  // any token       
	    tx_params.target_address = to_addr;        
            /////////////////////SEND TX///////////////////////////////////
            const result = await this.tx_worker.sendTx(tx_params);
            return result;
	}

*/

};

module.exports = {WalletObj};


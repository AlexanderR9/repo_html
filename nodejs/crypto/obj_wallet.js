const fs = require("fs");
const TOKENS_FILE="token.txt";

const {space, log, curTime, varNumber} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData, balanceAt} = require("./asyncbase.js");
const {TxWorkerObj} = require("./obj_txworker.js");


//вспомогательный класс контейнер для одного актива
class WalletAsset
{
	constructor(num)
	{
		this.decimal = 0;
		this.address = "?";
		this.name = "none";			
		this.balance = -1;
		this.number = num;
	}	
	parseLine(f_line)
	{
		const chain = m_base.currentChain();
		if (f_line[0] == "#") return;

		let list = f_line.toString().split("/");		
		if (list.length != 4) return;
		if (list[2].trim().toLowerCase() != chain) return;
		
		this.address = list[0].trim();
		this.name = list[1].trim();
		this.decimal = parseInt(list[3].trim());
	}
	invalid()
	{
		if (this.decimal <= 0) return true;
		if (this.name == "none") return true;
		if (this.address.length < 10) return true;
		return false;
	}
	out()
	{
		if (this.invalid()) log("WalletAsset: [INAVLID_FIELDS]");	
		else log("WalletAsset", this.number,":");	
		log("   INDEX: ", this.number-1)
		log("   NAME: ", this.name)
		log("   ADDR: ", this.address)
		log("   DECIMAL: ", this.decimal)
		log("   BALANCE: ", this.balance)
	}
}

//вспомогательный класс, служит для установки количества газа и максимального объема комисий
//перед проведенной транзакцией
class TxGas
{
    //настройки по умолчанию стоят минимальные, но этого хватает чтобы например сделать approve or wrap/unwrap
    constructor() 
    {
	this.gas_limit = 185000; //максимально единиц газа за транзакцию
	this.max_fee = 130; //максимальная цена за единицу газа, gwei
	this.priority = 35; //пожертвование за приоритет, gwei	
    }
    update(g, m, p = -1)
    {
	this.gas_limit = g;
	this.max_fee = m;
	if (p > 0) this.priority = p;
    }
    //установить в объект транзакции текщие значения комиссий
    setFeeParams(txp) 
    {
        txp.gasLimit = this.gas_limit;
        txp.maxFeePerGas = m_base.toGwei(this.max_fee);
        txp.maxPriorityFeePerGas = m_base.toGwei(this.priority);
    }
}

//класс для работы с кошельком
//сначала загружает информацию о токенах из файла token.txt, файл должен быть заранее подготовлен
//можно просматривать балансы всех токенов, предварительно вызвав функцию updateBalance()	
//класс при инициализации в список активов сначала добавляет нативный токен (т.е. он будет с индесом 0), затем считывает из файла остальные токены.
class WalletObj
{
	//при создании экземпляра необходимо сразу передать публичный адрес и необязательный параметр - приватный ключ
	constructor(addr, private_key = "") 
	{	
		log("Create wallet object: ", addr);
		this.address = addr; //public address
		this.pv = m_base.getProvider();	
		this.assets = []; /// WalletAsset array
		this.chain = m_base.currentChain();
		this.initNativeToken();
		this.readFileTokens();
	
		this.signer = null;
		this.gas = null;
		if (private_key.length > 10)  
		{
		    this.signer = m_base.getWallet(private_key, this.pv);
		    this.gas = new TxGas();
		}

		this.tx_worker = null; //отправитель/обработчик транзакций
		if (this.isSigner()) this.tx_worker = new TxWorkerObj(this);
  	}
	//установка параметров трат коммисии на газ за предстоящую транзакцию.
	//функция выполнится только если кошелек находится в режиме SIGNER.	
	setGas(g, m, p = -1) {if (this.gas) this.gas.update(g,m,p);}
	initNativeToken()
	{
		let asset = new WalletAsset(1);
		asset.name = m_base.nativeToken();
		asset.decimal = 18;
		asset.address = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
		this.assets[0] = asset;
	}
	assetsCount() {return this.assets.length;}
	isSigner() {return (this.signer != null);}
	nativeDecimal() {return ((this.assetsCount()>0) ? this.assets[0].decimal : -1);}

	//возвращает количетсво всех транзакций совершенных кошельком
	//кошелек должен находится в режиме SIGNER.	
	async txCount()
	{
    	    log("get Tx count of WALLET ....");
	    if (!this.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return;}
    	    const result = await this.signer.getTransactionCount();
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
	showBalances(with_addrs = false)
	{	
		log("----------- WALLET ASSETS BALANCES -------------");		
		for (let i=0; i<this.assets.length; i++)
		{
			let isnat = "";
			if (i==0) isnat = "(is_native)";
			const t_len = this.assets[i].name.length;

			let s = this.assets[i].number.toString()+".";			
			s += Array(5-s.length).join(" ");			

			if (with_addrs) s += (this.assets[i].address + "  ");
			s += this.assets[i].name;
			s += Array(16-t_len).join("_");			
			log(s, this.assets[i].balance, isnat);
		}
	}
	async balanceNative()
	{
		log("get native balance ...");
	        const data = await this.pv.getBalance(this.address);
		return m_base.toReadableAmount(data);
	}
	//получить баланс актива с указанным индексом из списка активов кошелька (this.assets)
	async balance(i)
	{
//		log("try get balance by index ", i, "......");
		if (this.assetsCount() <= 0)
		{
			log("Invalid WALLET_OBJ state, assets is empty!");
			return -1;
		}
		if (i == 0)
		{	
			const result = await this.balanceNative();
			log("balanceNative: ", result);
			return result;		
		}
		if (i >= this.assetsCount() || i < 0)
		{
			log("Invalid asset index ", i, ", assets count: ", this.assetsCount());
			return -1;
		}
        	const t_obj = m_base.getTokenContract(this.assets[i].address, this.pv);
        	const result = await t_obj.balanceOf(this.address);
        	return m_base.toReadableAmount(result, this.assets[i].decimal);
	}
	//обновить балансы всех токенов кошелька
	async updateBalance()	
	{
		const result = await this.balanceAll();
		const n = this.assetsCount();
		if (n == result.length)
		{
			for (let i=0; i<n; i++)
				this.assets[i].balance = result[i];
			log("tokens balance updated!!");
			return true;
		}
		else 
		{
			log("error updating");
			log("result", result, "   size=", result.length);
			return false;
		}
		
	}
	async balanceAll()
	{
		log("try get balances all......");
		if (this.assetsCount() <= 0)
		{
			log("Invalid WALLET_OBJ state, assets is empty!");
			return -1;
		}
		let p_arr = [];		
		for (let i=0; i<this.assetsCount(); i++) p_arr[i] = this.balance(i);
		const result = await Promise.all(p_arr);
		return result;
	}
	//загрузить список токенов из файла
	readFileTokens()
	{
		log("read tokens file ....");
		const data = fs.readFileSync(TOKENS_FILE);
		let list = data.toString().split("\n");		
		for (let i=0; i<list.length; i++)
		{
			let line = list[i].trim();
			if (line == "") continue;

			let asset = new WalletAsset(this.assetsCount()+1);
			asset.parseLine(line);
			if (!asset.invalid())
			{
				const a_index = this.assets.length;
				this.assets[a_index] = asset;
			}
		}	
		log("done! \n");
	}
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
	//функция ищет по адресу контракта актив кошелька из контейнера this.assets.
	//возвращает индекс найденого актива в массиве this.assets, или -1.
	assetIndexOf(t_addr)
	{
	    t_addr = t_addr.trim().toLowerCase();
	    for (let i=0; i<this.assets.length; i++)
	    {
		const i_addr = this.assets[i].address.trim().toLowerCase();
		if (i_addr == t_addr) return i;
	    }
	    return -1;
	}
	//функция определяет сколько единиц актива с индексом i предоставлено контракту to_addr.
	//результат возвращается в нормализованных единицах.
	async checkApproved(i, to_addr)
	{
	    log("try check approved size ......");
	    if (i >= this.assetsCount() || i < 0)
	    {
	    	log("Invalid asset index ", i, ", assets count: ", this.assetsCount());
		return -1;
	    }
	    log("ASSET:", this.assets[i].name, "/" ,this.assets[i].address);
	    log("TO_CONTRACT:", to_addr);
	    
	    //try send request 
    	    const t_obj = m_base.getTokenContract(this.assets[i].address, this.pv);

	    let result = -1;
            try {  result = await t_obj.allowance(this.address, to_addr); }
            catch(e) {log("ERROR:", e); return -1;}
	    return m_base.toReadableAmount(result, this.assets[i].decimal);;	    
	}


	/////////////////////////////TRANSACTIONS FUNCS//////////////////////////////////////////
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

};

module.exports = {WalletObj};


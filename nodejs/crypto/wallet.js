const fs = require("fs");
const TOKENS_FILE="token.txt";

const {space, log, curTime, varNumber} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData, balanceAt} = require("./asyncbase.js");


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
    //настройки по умолчанию стоят минимальные, но этого хватает чтобы например сделать approve
    constructor() 
    {
	this.gas_limit = 45000; //максимально единиц газа за транзакцию
	this.max_fee = 160; //максимальная цена за единицу газа, gwei
	this.priority = 50; //пожертвование за приоритет, gwei	
    }
    update(g, m, p)
    {
	this.gas_limit = g;
	this.max_fee = m;
	this.priority = p;
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
		this.address = addr; 
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
  	}
	//установка параметров трат коммисии на газ за предстоящую транзакцию.
	//функция выполнится только если кошелек находится в режиме SIGNER.	
	setGas(g, m, p) {if (this.gas) this.gas.update(g,m,p);}
	initNativeToken()
	{
		let asset = new WalletAsset(1);
		asset.name = m_base.nativeToken();
		asset.decimal = 18;
		asset.address = "0x00000000000000000000000000000000099";
		this.assets[0] = asset;
	}
	assetsCount() {return this.assets.length;}
	isSigner() {return (this.signer != null);}

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
	showBalances()
	{	
		log("----------- WALLET ASSETS BALANCES -------------");		
		for (let i=0; i<this.assets.length; i++)
		{
			let isnat = "";
			if (i==0) isnat = "(is_native)";
			const t_len = this.assets[i].name.length;
			let s = this.assets[i].number.toString()+". " + this.assets[i].name;
			log(s, Array(20-t_len).join("_"), this.assets[i].balance, isnat);
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
		}
		else 
		{
			log("error updating");
			log("result", result, "   size=", result.length);
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
//	    log("find asset by address: ", result.addr, " .........");	    
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
    	    const result = await t_obj.allowance(this.address, to_addr);
	    return m_base.toReadableAmount(result, this.assets[i].decimal);;	    
	}


	/////////////////////////////TRANSACTIONS FUNCS//////////////////////////////////////////


	//функция предоставляет актив с указанным индексом контракту to_addr. sum - количество предоставляемого токена.
	//кошелек должен находится в режиме SIGNER.	
	async tryApprove(i, to_addr, sum)
	{
	    log("try approve asset ......");
	    if (!this.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return -1;}
	    if (!varNumber(sum))  {log("WARNING: approvig SUM is not number_value, sum: ", sum); return -2;}
	    if (sum < 0.01 || sum > 1000)  {log("WARNING: approvig SUM is not correct, sum:", sum); return -3;}
	    if (i >= this.assetsCount() || i < 0) {log("Invalid asset index ", i, ", assets count: ", this.assetsCount()); return -4;}
	    
	    log("ASSET:", this.assets[i].name, "/" ,this.assets[i].address);
	    log("TO_CONTRACT:", to_addr);
	    log("APPROVING_AMOUNT:", sum);
	    space();

    	    //prepare sum
    	    const bi_sum = m_base.fromReadableAmount(sum, this.assets[i].decimal);
    	    const approvalAmount = bi_sum.toString();
    	    log("BI sum format: ", bi_sum, "approvalAmount: ", approvalAmount);
    	    space();

	    //prepare tx_params
    	    //log("set option params .....");
    	    let tx_params = {};
    	    this.gas.setFeeParams(tx_params);
    	    const tx_count = await this.txCount();
    	    log("tx_count:", tx_count);
    	    tx_params.nonce = tx_count;
    	    log("tx_params:", tx_params);
    	    space();
 
    	    ///////////////////////////////TX//////////////////////////////////////////
    	    log("try approve .....");
    	    const t_obj = m_base.getTokenContract(this.assets[i].address, this.signer);	    
    	    try 
	    {
		const approvalResponse = await t_obj.approve(to_addr, approvalAmount, tx_params);
    		log("approvalResponse:", approvalResponse);      
	    }
	    catch(e) {log("ERROR:", e); return -5;}

	    return true;
	}



	//функция отправляет актив с указанным индексом на другой кошелек to_addr. sum - количество переводимого токена.
	//кошелек должен находится в режиме SIGNER.	
	async trySend(i, to_addr, sum)
	{
	    log("try transfer asset ......");
	    if (!this.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return -1;}
	    if (!varNumber(sum))  {log("WARNING: transfer SUM is not number_value, sum: ", sum); return -2;}
	    if (sum < 0.01 || sum > 1000)  {log("WARNING: transfer SUM is not correct, sum:", sum); return -3;}
	    if (i >= this.assetsCount() || i < 0) {log("Invalid asset index ", i, ", assets count: ", this.assetsCount()); return -4;}

	    log("SENDING ASSET:", this.assets[i].name, "/" ,this.assets[i].address);
	    log("TO_WALLET:", to_addr);
	    log("ASSET_AMOUNT:", sum);
	    space();

    	    //prepare sum
    	    const bi_sum = m_base.fromReadableAmount(sum, this.assets[i].decimal);
    	    log("BI sum format: ", bi_sum);
    	    space();

	    //prepare tx_params
    	    const tx_count = await this.txCount();
    	    log("tx_count:", tx_count);

	    //transfer token
	    let result = -9999;
	    if (i == 0) result = await this.sendNativeToken(to_addr, bi_sum, tx_count)
	    else result = await this.sendAnyToken(i, to_addr, bi_sum, tx_count)

	    return result;
	}
	async sendNativeToken(to_addr, bi_sum, tx_count) //private
	{
	    log("IS A NATIVE TOKEN");
    	    let tx_params = {to: to_addr, nonce: tx_count, value: bi_sum};
    	    this.gas.setFeeParams(tx_params);
    	    log("tx_params:", tx_params);
    	    space();
	    ////////////////TX///////////////
    	    log("send transaction ....");
            try
            {
                const tx = await this.signer.sendTransaction(tx_params);
                log("TX:", tx);
            }
            catch(e) {log("ERROR:", e); return -5;}
            return true;
	}
	async sendAnyToken(i, to_addr, bi_sum, tx_count) //private
	{
    	    let tx_params = {nonce: tx_count};
    	    this.gas.setFeeParams(tx_params);
    	    log("tx_params:", tx_params);
    	    space();
	    ////////////////TX///////////////
            const t_obj = m_base.getTokenContract(this.assets[i].address, this.signer);
    	    log("send transaction ....");
            try
            {
                const tx = await t_obj.transfer(to_addr, bi_sum, tx_params);
                log("TX:", tx);
            }
            catch(e) {log("ERROR:", e); return -5;}
            return true;
	}

};

module.exports = {WalletObj};


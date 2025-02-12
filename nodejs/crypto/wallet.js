const fs = require("fs");
const TOKENS_FILE="token.txt";

const {space, log, curTime} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData, balanceAt} = require("./asyncbase.js");



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
		log("   NAME: ", this.name)
		log("   ADDR: ", this.address)
		log("   DECIMAL: ", this.decimal)
		log("   BALANCE: ", this.balance)
	}

}




//класс для работы с кошельком
//сначала загружает информацию о токенах из файла token.txt, файл должен быть заранее подготовлен
//можно просматривать балансы всех токенов, предварительно вызвав функцию updateBalance()	
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
		if (private_key.length > 10)  
			this.signer = m_base.getWallet(private_key, this.pv);
  	}
	initNativeToken()
	{
		let asset = new WalletAsset(1);
		asset.name = m_base.nativeToken();
		asset.decimal = 18;
		asset.address = "0x00000000000000000000000000000000099";
		this.assets[0] = asset;
	}
	assetsCount() {return this.assets.length;}

	//функция извлекает всю основную не изменяемую информацию о пуле и его активах.
	//ее необходимо выполнить 1 раз сразу после создания экземпляра	
	async updateData()
	{

	}
	isSigner() {return (this.signer != null);}
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
//		const result = await balanceAt(this.pv, this.assets[i].address);
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
		//for (let i=0; i<this.assetsCount(); i++)
		//	this.assets[i].balance = result[i];
		return result;
	}
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


};

module.exports = {WalletObj};


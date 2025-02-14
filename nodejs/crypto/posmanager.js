const {space, log, curTime} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");
const m_wallet = require("./wallet.js");



//класс для работы с позициями пулов для текущей цепи и указанного кошелька.
class PosManager
{
        //при создании экземпляра необходимо сразу передать адрес кошелька
        constructor(w_addr)
        {
                log("Create PosManager for wallet: ", w_addr);

    		this.walletObj = new m_wallet.WalletObj(w_addr);
    //            this.T0 = new TokenObj(-1); //пустой объект
                this.contract =  m_base.getPosManagerContract(this.walletObj.pv);
		this.pos_list = [];
		this.pos_count = -1;
        }
	posCount() {return this.pos_list.length;}
	async getPosCount() //получить количество всех позиций для текущего кошелька (открытых/закрытых)
	{
	    log("get pos count ....");
	    const n_pos = await this.contract.balanceOf(this.walletObj.address);
	    return Number(n_pos);
	}
	async updatePosCount()
	{
	    log("try get pos count ....");
	    try
	    {
		const n_pos = await this.contract.balanceOf(this.walletObj.address);
		this.pos_count = Number(n_pos);
		log("done, pos count: ", this.pos_count);
	    }
	    catch(err)
	    {
		log("CATCH_ERR:");
		log(err);
		this.pos_count = -1;
	    }    
	}
	//получить данные о позициях, предварительно необходимо выполнить updatePosCount()
	async updatePosData()
	{
	    if (this.pos_count <= 0)
	    {
		log("invalid pos count: ", this.pos_count);
		return "error";
	    }

	    log("try positions data ..........");
//     	    log("pos count: ", this.pos_count);

	    const calls = [];
	    for (let i = 0; i < this.pos_count; i++) 
		calls.push(this.contract.tokenOfOwnerByIndex(this.walletObj.address, i));
	    const pid_list = await Promise.all(calls);
	    return pid_list;
    	}
	//получить ID одной позиции по ее порядковому индексу [0..N]
	async getPosID(pos_index)
	{
	    let pos_data = -1;
	    log("pos_index =", pos_index);
	    log("try get pos ID ....");
	    try
	    {
		const pid = await this.contract.tokenOfOwnerByIndex(this.walletObj.address, pos_index);
		pos_data = Number(pid);
		log("done!");
	    }
	    catch(err)
	    {
		log("CATCH_ERR:");
		log(err);
	    }    
	    return pos_data;
	}
    
	//получить данные одной позиции по ее ID
	async getPosData(pid)
	{
	    log("get pos data, PID [", pid,"]  ....");
	    let data = {};
	    try
	    {
		data = await this.contract.positions(pid);
		log("done!");
	    }
	    catch(err)
	    {
		log("CATCH_ERR:");
		log(err);
	    }    
	    if (data.liquidity == 0) log("POS IS CLOSED!!!!");
	    else {log("POS IS ACTIVE!!!!"); log("liq: ", data.liquidity.toString());}
	    
	    return data;
	}	

};

module.exports = {PosManager};


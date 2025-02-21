
//классы для работы с позициями пулов ликвидности

const {space, log, curTime, varNumber} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");
const m_wallet = require("./wallet.js");

const fs = require("fs");
const PID_FILE="pid_list.txt";
const POS_DATA_FILE="pos_data.txt";


//вспомогательный класс-контейнер, содержит данные по одной позе
class PosData
{
    constructor(pid)
    {
	this.pid = pid; // ID of position
	this.liq = 0;
	this.l_tick = 0;
	this.u_tick = 0;
	this.fee = -1;
	this.token0 = ""; //adress of contract
	this.token1 = ""; //adress of contract
    }

    invalid() {return (this.fee <= 0);}
    isActive() {return (!this.invalid() && this.liq > 0);}
    out()
    {
	log("POS_DATA: PID =", this.pid);
	log("liq: ", this.liq.toString());
	const s = "[" + this.l_tick.toString() + " : " + this.u_tick.toString() + "]";
	log("tick range: ", s);
	log("token 0: ", this.token0);
	log("token 1: ", this.token1);
	log("fee: ", this.fee);
    }
    toFileLine()
    {
	let fline = this.pid.toString();        
	if (this.invalid()) return (fline + " / invalid pos" + '\n');
	fline += (" / " + this.liq.toString() + " / " + this.l_tick.toString() + " / " + this.u_tick.toString());
	fline += (" / " + this.token0 + " / " + this.toekn1 + " / " + this.fee.toString());
	return (fline + '\n');    	
    }

};


//класс для работы с позициями пулов для текущей цепи и указанного кошелька.
class PosManager
{
        //при создании экземпляра необходимо сразу передать адрес кошелька
        constructor(w_addr)
        {
                log("Create PosManager for wallet: ", w_addr);

    		this.wallet = new m_wallet.WalletObj(w_addr);
                this.contract =  m_base.getPosManagerContract(this.wallet.pv);
		this.pos_list = [];  //array of PosData
        }
	posDataCount() {return this.pos_list.length;}
	posEmpty() {return ((this.posDataCount() == 0) ? true : false);}
	//получить количество всех позиций для текущего кошелька (открытых/закрытых) из сети
	async getPosCount() 
	{
	    log("get pos count ....");
	    let n_pos = -1;
	    try
	    {
		const n = await this.contract.balanceOf(this.wallet.address);
		n_pos = Number(n);
		log("done!");
	    }
	    catch(err) {log("CATCH_ERR:", err);}
	    return Number(n_pos);
	}

	//функция предварительно запрашивает getPosCount,
	//затем в цикле запрашивает все идентифекаторы поз по n_sep шт пока не получит все N_pos.
	//в процессе выполнения функция полностью перезапишет файл PID_FILE.
	//в случае возникновения ошибки функция прервется и вернет false. 
	async fullUpdatePidList(n_sep = 8)
	{
	    const n_pos = await this.getPosCount();
	    if (n_pos <= 0) return false;
	    
	    let i_start = 0;
	    let remainder = n_pos;
	    while (2 > 1)
	    {
		space();
		log("try get next fraction, i_start", i_start, ".........");
		if ((n_pos - i_start) < n_sep) 
		{
		    n_sep = (n_pos - i_start); 
		    remainder = -1;
		    log("it is last iteration,  n_sep ", n_sep);
		} //it is last iteration

		const pid_list = await this.getPidList(i_start, n_sep);		
		if (pid_list.length == 0) {log("ERROR: pid_list is empty"); return false;}

		this.writePidListToFile(pid_list, (i_start == 0));
		if (remainder < 0) break; //получили все ID		

		i_start += n_sep;
		remainder -= n_sep;		
		if (i_start > (n_pos-1)) break; //получили все ID		
		if (remainder == 0) break; //получили все ID		

		log("fraction fetched, remainder =", remainder);
	    }
	    log("//////////FINISHED ALL!/////////////////");
	    return true;
	}	

	//получить список идентификаторов всех поз(открытых/закрытых) , 
	//предварительно необходимо выполнить updatePosCount()
	async getPidList(i_start, n)
	{
	    log("try get PID_LIST of positions ..........");        
	    if (!varNumber(n))  {log("WARNING: N not number_value  ", n); return -1;}
    	    if (n < 1 || n > 1000)  {log("WARNING: N not correct", n); return -1;}
	    
	    log("i_start =", i_start, "   n =", n);

	    const calls = [];
	    let pid_list = [];
	    for (let i = 0; i < n; i++) 
	    {
		let k = i + i_start
		calls.push(this.contract.tokenOfOwnerByIndex(this.wallet.address, k));
	    }
	    try
	    {
		pid_list = await Promise.all(calls);
		log("done!");
	    }
	    catch(err) {log("CATCH_ERR:", err);}    
	    return pid_list;
    	}
	writePidListToFile(pid_list, is_rewrite)
	{
	    let f_size = 0;
	    if (!is_rewrite)  f_size = fs.readFileSync(PID_FILE).toString().split("\n").length - 1;
	    let fline = "";
	    log("try write PID_LIST to file ..........");      
	    for (let i=0; i<pid_list.length; i++)
	    {
		fline = (i+1+f_size).toString()+"." + " / ";
		fline += pid_list[i].toString() + " / ";
		fline += "*" + this.wallet.address.slice(-5) + " / ";
		fline += (m_base.currentChain() + '\n');
		
		if (i == 0 && is_rewrite) fs.writeFileSync(PID_FILE, fline);
		else fs.appendFileSync(PID_FILE, fline);
    	    }  
	    log("file was written!");
	}
	//переписать файл POS_DATA_FILE данными из контейнера this.pos_list
	rewritePosDataFile()
	{
	    const fname = POS_DATA_FILE;
	    log("rewrite pos data file: ", fname);
	    if (this.posEmpty()) {log("WARNING: pos data conteiner is empty!"); return false;};
	    
	    const n = this.pos_list.length;
	    for (let i=0; i<n; i++)
	    {
		const fline = this.pos_list[i].toFileLine(i);
		if (i == 0) fs.writeFileSync(fname, fline);
		else fs.appendFileSync(fname, fline);
	    }
	}
	loadPidListFromFile()
	{
               log("read PID file ....");
		this.pos_list = [];
                const data = fs.readFileSync(PID_FILE);
                let list = data.toString().split("\n");
		let p_index = 0;
                for (let i=0; i<list.length; i++)
                {
                    let fline = list[i].trim();
                    if (fline == "") continue;

            	    const chain = m_base.currentChain();        
            	    let row_list = fline.toString().split("/");
            	    if (row_list.length != 4) return;
            	    if (row_list[3].trim().toLowerCase() != chain) return;
            	    if (row_list[2].trim().slice(-5) != this.wallet.address.slice(-5)) return;                

            	    const pid = parseInt(row_list[1].trim());
		    this.pos_list[p_index] = new PosData(pid);
		    p_index++;
                }
		log("pos_list size: ",  this.posDataCount());
                log("done! \n");	    
	}



	//получить ID одной позиции по ее порядковому индексу [0..N]
	async getPosID(pos_index)
	{
	    let pid = -1;
	    log("pos_index =", pos_index);
	    log("try get pos ID ....");
	    try
	    {
		const a = await this.contract.tokenOfOwnerByIndex(this.wallet.address, pos_index);
		pid = Number(a);
		log("done!");
	    }
	    catch(err)
	    {
		log("CATCH_ERR:");
		log(err);
		pid = -1;
	    }    
	    return pid;
	}
    
	//получить данные из сети одной позиции по ее ID
	async getPosData(pid)
	{
	    log("get pos data, PID [", pid,"]  ....");
	    let data = {};
	    try
	    {
		const result = await this.contract.positions(pid);
		data = result;
		log("done!");
	    }
	    catch(err)
	    {
		log("CATCH_ERR:");
		log(err);
	    }    
	    return data;
	}	
	//запросит в сети и обновит поля указанной(индекс this.pos_list) позиции
	async updatePosData(i) 
	{
            log("try update pos data ......");
            if (i >= this.posDataCount() || i < 0) {log("Invalid pos index ", i, ", pos count: ", this.posDataCount());  return -1;}	
	    const p_data = await this.getPosData(this.pos_list[i].pid);
	    space();	
	    

	    this.pos_list[i].liq = p_data.liquidity;
	    this.pos_list[i].fee = parseInt(p_data.fee);
	    this.pos_list[i].l_tick = p_data.tickLower;
	    this.pos_list[i].u_tick = p_data.tickUpper;
	    this.pos_list[i].token0 = p_data.token0;
	    this.pos_list[i].token1 = p_data.token1;
	    this.pos_list[i].out();
	    log("POOL:", this.poolByPos(this.pos_list[i]));
	}
	// вернет краткую инфу о пуле для указанной позы.
	//результат - строка вида: TOKEN0/TOKEN1 (0.05%) или '?' если pos_obj нулевой или некоректные данные
	poolByPos(pos_obj)	
	{
	    if (pos_obj.invalid()) return "?";
	    const t0 = this.wallet.findAsset(pos_obj.token0);
	    const t1 = this.wallet.findAsset(pos_obj.token1);
	    if (t0.ticker == "" || t1.ticker == "") return "?";

	    let s = t0.ticker + "/" + t1.ticker;
	    s +=  " (" + (pos_obj.fee/10000).toString() + "%)"
	    return s;	    
	}

};

module.exports = {PosManager};


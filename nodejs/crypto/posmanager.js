
//классы для работы с позициями пулов ликвидности

const {space, log, curTime, varNumber} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");
const m_wallet = require("./wallet.js");
const m_pool = require("./pool.js");

const fs = require("fs");
const PID_FILE="pid_list.txt";
const POS_DATA_FILE="pos_data.txt";




//вспомогательный класс-контейнер, содержит минимальные данные о пуле в котором отчеканена поза
class PosPool
{
    constructor()
    {
	this.address = "0x0";
	this.info = "?";
    }
    invalid() {return (this.address.length < 40);}
    toStr() 
    {
	let s = "POOL: ";
	if (this.invalid()) {s += "???"; return s;}

	s += (this.address + " / " + this.info);
	return s;
    }

};



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
	this.pricesRange = {p1: -1, p2: -1, p_cur: 0};
	//this.pool_info = ""; //short pool info

	this.pool = new PosPool();
    }

    invalid() {return (this.fee <= 0 || this.pid <= 0);}
    isActive() {return (!this.invalid() && this.liq > 0);}
    
    strPricesRange()
    {
	let s = "RANGE[" + this.pricesRange.p1.toFixed(4).toString() + " - " +
	    this.pricesRange.p2.toFixed(4).toString() + "]"
	return s;
    }	
    strTickRange()
    {
	return ("ticks: " + this.l_tick + "/" + this.u_tick);
    }
    toStr()
    {
	let s = ("PID=" + this.pid + "  ");
	s += (this.strTickRange() + "  ");	
	s += (this.strPricesRange() + "  ");	
	s += (this.pool.toStr());	
	return s;
    }
    out()
    {
	log("POS_DATA: PID =", this.pid);
	log("liq: ", this.liq.toString());
	const s = "[" + this.l_tick.toString() + " : " + this.u_tick.toString() + "]";
	log("tick range: ", s);
	log("token 0: ", this.token0);
	log("token 1: ", this.token1);
	log("fee: ", this.fee);
	//log("POOL: ", this.pool_info);
    }
    findOwnPool(fdata_pools)
    {
	if (this.invalid()) return;
	//this.out();
	space();
        for (let i=0; i<fdata_pools.length; i++)
        {
	    const rec = fdata_pools[i];
	//    log("REC: ", rec);
	    if ((rec.t0_addr == this.token0) && (rec.t1_addr == this.token1) && (rec.fee == this.fee))	 
	    {
//		log("find own pool!!!!!!!!!!");
		this.pool.address = rec.addr; 
		this.pool.info = rec.info;
		break;
	    }	
	}
    }
    toFileLine()
    {
	let fline = this.pid.toString();        
	if (this.invalid()) return (fline + " / invalid pos" + '\n');
	fline += (" / " + this.liq.toString() + " / " + this.l_tick.toString() + " / " + this.u_tick.toString());
	fline += (" / " + this.token0.toLowerCase() + " / " + this.token1.toLowerCase() + " / " + this.fee.toString());
	return (fline + '\n');    	
    }
    fromFileLine(fline)
    {
	let row_list = fline.toString().split("/");
        if (row_list.length != 7) return;

	let i = 0;
	this.pid = parseInt(row_list[i].trim()); i++;
	this.liq = BigInt(row_list[i].trim()); i++;
	this.l_tick = parseInt(row_list[i].trim()); i++;
	this.u_tick = parseInt(row_list[i].trim()); i++;
	this.token0 = row_list[i].trim(); i++;
	this.token1 = row_list[i].trim(); i++;
	this.fee = parseInt(row_list[i].trim()); i++;
    }
    setData(p_data)
    {
        this.liq = p_data.liquidity;
        this.fee = parseInt(p_data.fee);
        this.l_tick = p_data.tickLower;
        this.u_tick = p_data.tickUpper;
        this.token0 = p_data.token0;
        this.token1 = p_data.token1;    
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
	activeCount() //количество открытых поз, т.е. у которых добавлена ликвидность
	{
	    let n = 0;
	    this.pos_list.forEach((item) => {if (item.isActive()) n++;});		
	    return n;
	}
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
	//начиная с индекса позы i_start, n шт
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
	//загрузить данные позиций в контейнер this.pos_list из файла  POS_DATA_FILE.
	// контейнер this.pos_list полностью перезаписывается.
	//перед выполнением этой функции желательно один раз выполнить  updateArrPosData.
	loadPosDataFromFile()
	{
	    log("read POS_DATA file ....");
	    log("file:", POS_DATA_FILE);
	    
	    this.pos_list = [];
            const data = fs.readFileSync(POS_DATA_FILE);
            let list = data.toString().split("\n");

            for (let i=0; i<list.length; i++)
            {
                let fline = list[i].trim();
                if (fline == "") continue;
		
		let pos_obj = new PosData(-1);
		pos_obj.fromFileLine(fline);
		if (!pos_obj.invalid())
	    	{
		    //const np = this.pos_list.length;
		    //this.pos_list[i] = pos_obj;
		    this.recalcPosRange(pos_obj);
		    this.pos_list.push(pos_obj);
		}
	    }	
	    const np = this.posDataCount();
	    log("posDataCount: ", np, ", active: ", this.activeCount());
	    this.outActive();

	    this.syncByPoolsFile();
	    return np;	    
	}
	//загрузить файл pools.txt и синхронизировать данные поз с данными пулов, т.е. найти для каждой позы свой пул
	syncByPoolsFile()
	{
	    const fdata = m_pool.PoolObj.lookPoolsFile();
	    for (var i=0; i<this.pos_list.length; i++)
		this.pos_list[i].findOwnPool(fdata);	    
	}
	outPIDList()
	{
	    log("----------PID list of positions---------");
	    for (var i=0; i<this.pos_list.length; i++)
		log(i+1, ".  ", this.pos_list[i].pid);
	}
	outFull() //вывести все данные о позициях
	{
	    log("----------data list of positions---------");
	    for (var i=0; i<this.pos_list.length; i++)
	    {
		let s = (i+1).toString() + ".  ";
		log(s, this.pos_list[i].toStr());
		//log(this.pos_list[i].out());
	    }
	}
	outActive()
	{
	    const a = this.activeCount();
	    space();
	    log("Active positions: ", a);
	    if (a == 0) return;
	    	
	    this.pos_list.forEach((p) => 
	    {
		if (p.isActive())
		{	
		    let s = p.pid.toString() + "  " +this.poolByPos(p) + "  " + p.strPricesRange();	
		    log(s);    
		}
	    });		
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

	//запрашивает данные всех позиций из цепи. предварительно уже должен быть подготовлен файл PID_FILE.
	// а также предварительно необходимо выполнить loadPidListFromFile(), т.е. загрузить все PID поз.
	//после получения всех данных перезапишет файл POS_DATA_FILE.
	async updateArrPosData(n_sep = 8)
	{
	    log("try update arr_pos data .....");
	    const n_pos = this.posDataCount();
	    if (n_pos <= 0) {log("WARNING: pos data is empty"); return false;}
	    
	    let i =0;
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
		log("n_sep = ", n_sep);


		const calls = [];
		for (i = i_start; i < (i_start+n_sep); i++) 
		{
		    calls.push(this.getPosData(this.pos_list[i].pid));
		}
		try
		{
		    const call_resp = await Promise.all(calls);
		    if (Array.isArray(call_resp)) 
		    {
			space();
			log("is Array, size ", call_resp.length);
			//log("callResponses:", call_resp);
			for (i = i_start; i < (i_start+n_sep); i++) 
			{
			    space();
			    this.pos_list[i].setData(call_resp[i - i_start]);
			    //this.pos_list[i].out();
			    log("POOL: ", this.poolByPos(this.pos_list[i]));
			}
		    }
		    log("done!");
		}
		catch(err) {log("CATCH_ERR:", err); break;}    

		if (remainder < 0) break; //получили все POS_DATA		

		i_start += n_sep;
		remainder -= n_sep;		
		if (i_start > (n_pos-1)) break; //получили все POS_DATA				
		if (remainder == 0) break; //получили все POS_DATA				

		log("fraction fetched, remainder =", remainder);
	    }
	    log("//////////FINISHED ALL!/////////////////");	
	    this.rewritePosDataFile();
	    return true;

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
	//пересчитать значения диапазона pricesRange для указанной позы по номерам тиков
	recalcPosRange(pos_obj)
	{
	    let p1 = m_base.TICK_QUANTUM ** (pos_obj.l_tick);
	    let p2 = m_base.TICK_QUANTUM ** (pos_obj.u_tick);
	    const t0 = this.wallet.findAsset(pos_obj.token0);
	    const t1 = this.wallet.findAsset(pos_obj.token1);
	    let f_dec = 1;
	    f_dec = 10 ** ((t0.decimal - t1.decimal));
	    p1 *= f_dec; p2 *= f_dec;

//	    pos_obj.pricesRange.p_cur = 

	    if (t0.ticker.slice(0, 3) == "USD" && t0.ticker != "USDT")
	    {
		pos_obj.pricesRange.p1 = 1/p2;
		pos_obj.pricesRange.p2 = 1/p1;		
	    }
	    else
	    {
		pos_obj.pricesRange.p1 = p1;
		pos_obj.pricesRange.p2 = p2;
	    }
	}	

};

module.exports = {PosManager};


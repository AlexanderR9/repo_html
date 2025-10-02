
//standart utils funcs
const { space, log, jsonFromFile, hasField, jsonKeys, isInt } = require("./../utils.js");

// my class objects
const { ChainObj } = require("./chain_class.js");
const { ContractObj } = require("./contract_class.js");
const { WalletObj } = require("./wallet_class.js");
const { PositionObj } = require("./position_class.js");

const fs = require("fs");
const POS_LIST_FILE="positions.txt";
const SEPARATE_PART_DEFAULT = 8; // коэффициент прореживания запросов


//класс для работы с позициями пулов для текущей цепи и указанного кошелька.
class PosManagerObj
{
        //при создании экземпляра необходимо сразу передать объект кошелька
        constructor(w_obj)
        {
	    this.wallet = w_obj;
            this.contract = ContractObj.getPosManagerContract(this.wallet.pv);
	    this.pid_list = []; // список PID всех поз кошелька
            log("Created PosManager for wallet: ", this.wallet.address);
        }


	//загрузить данные позиций в промежуточный контейнер pos_arr из файла  POS_DATA_FILE.
	//будут загружен только те записи, PID которых просутствует в this.pid_list
	_loadPosDataFromFile(pos_arr, pool_addrs)
	{
	    log("read POS_DATA file ....");
	    log("file:", POS_LIST_FILE);	    
            const data = fs.readFileSync(POS_LIST_FILE);
            let list = data.toString().split("\n");
            for (let i=0; i<list.length; i++)
            {
                let fline = list[i].trim();
                if (fline == "") continue;		
		let pos_obj = new PositionObj(-1);
		pos_obj.fromFileLine(fline);

		// check readed pos
		const i_pid = this.pid_list.indexOf(pos_obj.pid.toString());
		if (i_pid >= 0)
		{
		    space();
		    pos_obj.pool_addr = pool_addrs[i_pid];
		    if (!pos_obj.invalid()) {pos_arr.push(pos_obj); pos_obj.out();}
		    else pos_obj = null;
		}
		else pos_obj = null;
	    }	
	}
	//получить текущее состояние для выборочного набора позиций,
	//функция возвращает json в который вложены  json-состояние с ключем pid по каждой позе
	async getPosState(pool_addrs)
	{
	    let result = {code: 0};
	    let pos_arr = [];
	    this._loadPosDataFromFile(pos_arr, pool_addrs);
	    log("loaded success pos: ", pos_arr.length);
	    if (pos_arr.length <= 0) {log("WARNING: pos_arr is empty"); result.code = -1; return result;}	    

	    // подготавливаем множественный запрос
	    let req_arr = [];
            const n = pos_arr.length;
            for (let i=0; i<n; i++) 
		req_arr[i] = pos_arr[i].updateState(this);

	    // отправляем множественный запрос
            const data = await Promise.all(req_arr);
            if (!Array.isArray(data)) {log("WARNING: invalid result, data is not array"); result.code = -2; return result;}
            if (n != data.length) {log("WARNING: invalid result, data.length != n_assets"); result.code = -3; return result;}

	    // запрос успешно выполнился, формируем итоговый результат json
    	    result.code = 0; // OK
            for (let i=0; i<n; i++) 
	    {
		let pos_result = {};
		pos_result.price0 = pos_arr[i].state.current_price.toString();
		pos_result.tick = pos_arr[i].state.pool_tick.toString();
		pos_result.range_p1 = pos_arr[i].state.price_range.p1.toString();
		pos_result.range_p2 = pos_arr[i].state.price_range.p2.toString();
		pos_result.asset0 = pos_arr[i].state.assets.amount0.toString();
		pos_result.asset1 = pos_arr[i].state.assets.amount1.toString();
		pos_result.reward0 = pos_arr[i].state.rewards.amount0.toString();
		pos_result.reward1 = pos_arr[i].state.rewards.amount1.toString();
		
		const s_pid = pos_arr[i].pid.toString();
		result[s_pid] = pos_result;
	    }	    
	    //log("GETIING POS STATES FINISHED!!!");
	    space();
	    return result;
	}

	/////////////////////////////////PROTECTED//////////////////////////////////////////////////////

	_isEmpty() {return ((this.pid_list.length == 0) ? true : false);}
	//получить список идентификаторов всех поз(открытых/закрытых) , начиная с индекса позы i_start, n шт
	async _pidListAt(i_start, n)
	{
	    log("_pidListAt:  i_start =", i_start, "   n =", n);
	    const calls = [];
	    let pid_list = [];
	    for (let i = 0; i < n; i++) 
		calls.push(this.contract.tokenOfOwnerByIndex(this.wallet.address, i+i_start));

	    try
	    {
		pid_list = await Promise.all(calls);
		pid_list.forEach((pid) => {this.pid_list.push(pid.toString());});				
		//log("done!");
	    }
	    catch(err) {log("CATCH_ERR:", err); return false;}    
	    return true;
    	}
	//получить из сети данные только одной позиции по ее PID
	async _getPosData(pid)
	{
	    log("get pos data by PID [", pid,"]  ....");
	    let data = {};
	    try {data = await this.contract.positions(pid);}
	    catch(err) {log("CATCH_ERR:", err);}    
	    return data;
	}
	//переписать файл POS_DATA_FILE данными из обновленного  контейнера 
	async _rewritePosDataFile(pos_data)
	{
	    log("rewrite pos data file: ", POS_LIST_FILE);
	    if (!Array.isArray(pos_data)) {log("WARNING: pos data is not array!"); return false;};
	    if (pos_data.length == 0) {log("WARNING: pos data container is empty!"); return false;};
	    
	    const n = pos_data.length;
	    for (let i=0; i<n; i++)
	    {
		const fline = (pos_data[i] + '\n');
		if (i == 0) fs.writeFileSync(POS_LIST_FILE, fline);
		else fs.appendFileSync(POS_LIST_FILE, fline);
	    }
	    log("FILE has been over written");
	    return true;
	}
	
	
	///////////////////////////////////////////////////////////////////////////////////////

	//получить количество всех позиций для текущего кошелька (открытых/закрытых) из сети
	async getPosCount() 
	{
	    log("get pos count ....");
	    let n_pos = -1;
	    try
	    {
		const n = await this.contract.balanceOf(this.wallet.address);
		n_pos = Number.parseInt(n);
		log("done!");
	    }
	    catch(err) {log("CATCH_ERR:", err);}
	    return n_pos;
	}
	//функция предварительно запрашивает getPosCount,
	//затем в цикле запрашивает все идентифекаторы поз по n_sep шт пока не получит все N_pos.
	//в процессе выполнения функция полностью перезапишет this.pid_list ,
	//в случае возникновения ошибки функция прервется и вернет false. 
	async updatePidList(n_sep = SEPARATE_PART_DEFAULT)
	{
	    log("try get PID list .......");
	    this.pid_list = []; // reset PID array
	    const n_pos = await this.getPosCount();
	    if (n_pos <= 0) return false;
	    log("Wallet positions count: ", n_pos);
	    
	    let i_start = 0;
	    let remainder = n_pos;
	    while (2 > 1)
	    {
		if ((n_pos - i_start) < n_sep) {n_sep = (n_pos - i_start); remainder = -1;} //it is last iteration
		const res = await this._pidListAt(i_start, n_sep);		
		if (!res) {log("ERROR: can't get _pidListAt"); return false;}
		log("PID count: ", this.pid_list.length, "    remainder: ", remainder);
		if (remainder < 0) break; //получили все ID		

		i_start += n_sep;
		remainder -= n_sep;		
		if (remainder == 0) break; //получили все ID		
	    }
	    log("getting pid_list finished.");
	    return true;
	}	
	//запрашивает данные всех позиций из цепи. предварительно запрашивает PID_LIST.
	//после успешного получения всех данных перезапишет файл POS_LIST_FILE.
	async updatePosData(n_sep = SEPARATE_PART_DEFAULT)
	{
	    log("try update arr_pos data .....");
	    const res = await this.updatePidList(n_sep);
	    if (!res) {log("WARNING: invalid updating PID_LIST"); return false;}
	    const n_pos = this.pid_list.length;
	    if (n_pos <= 0) {log("WARNING: PID_LIST is empty"); return false;}
	    
	    let pdata = []; // итоговый результат
	    let i_start = 0;
	    let remainder = n_pos;
	    while (2 > 1)
	    {
		space();
		log("try get next fraction, i_start", i_start, ".........");
		if ((n_pos - i_start) < n_sep) {n_sep = (n_pos - i_start); remainder = -1;} //it is last iteration

		// prepare request
		const calls = [];
		for (var i=0; i<n_sep; i++) 
		    calls.push(this._getPosData(this.pid_list[i+i_start]));

		try
		{
		    const call_resp = await Promise.all(calls);
		    if (Array.isArray(call_resp)) 
		    {
			space();
			log("is Array, size ", call_resp.length);
			for (var i=0; i<n_sep; i++) 
			{
			    let fline = (this.pid_list[i+i_start] + " / ");
			    fline += (call_resp[i].liquidity.toString() + " / " + call_resp[i].fee.toString() + " / ");
			    fline += (call_resp[i].tickLower.toString() + " / " + call_resp[i].tickUpper.toString() + " / ");
			    fline += (call_resp[i].token0.toLowerCase() + " / " + call_resp[i].token1.toLowerCase());
			    pdata.push(fline);
			}
		    }
		    log("done!");
		}
		catch(err) {log("CATCH_ERR:", err); break;}    
		if (remainder < 0) break; //получили все POS_DATA		

		i_start += n_sep;
		remainder -= n_sep;		
		if (remainder == 0) break; //получили все POS_DATA				
		log("fraction fetched, remainder =", remainder);
	    }
	    log("//////////FINISHED ALL!/////////////////");	
	    const fres = await this._rewritePosDataFile(pdata);
	    return res;	
	}

/*
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
*/

/*
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
//	    space();
	    log("Active positions: ", a);
	    if (a == 0) return;
	    	
	    var i = 1;
	    this.pos_list.forEach((p) => 
	    {
		if (p.isActive())
		{	
		    let s = i.toString() + ". PID=" + p.pid.toString() + "  ";
		    s += (p.strPricesRange() + "    POOL: " + this.poolByPos(p));	
		    log(s);    
		    i++;
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
	    //цены считаются для token0
	    let p1 = m_base.TICK_QUANTUM ** (pos_obj.l_tick);
	    let p2 = m_base.TICK_QUANTUM ** (pos_obj.u_tick);
	    const t0 = this.wallet.findAsset(pos_obj.token0);
	    const t1 = this.wallet.findAsset(pos_obj.token1);
	    let f_dec = 1;
	    f_dec = 10 ** ((t0.decimal - t1.decimal));
	    p1 *= f_dec; p2 *= f_dec;


	    //если token0 стейбл то цены конвертируются для token1
	    if (t0.ticker.slice(0, 3) == "USD" && t1.ticker != "USDT")
	    {
		pos_obj.pricesRange.p1 = 1/p2;
		pos_obj.pricesRange.p2 = 1/p1;		
	    }
	    else
	    {
		pos_obj.pricesRange.p1 = p1;
		pos_obj.pricesRange.p2 = p2;
	    }

	    if (pos_obj.pricesRange.p1 < 0.01 && pos_obj.pricesRange.p2 < 0.01)
	    {
		p1 = pos_obj.pricesRange.p1;
		p2 = pos_obj.pricesRange.p2;
		pos_obj.pricesRange.p1 = 1/p2;
		pos_obj.pricesRange.p2 = 1/p1;		
	    }

	}	

*/



};

module.exports = {PosManagerObj};



//классы для работы с 1 экзепляром позиции ликвидности

const {space, log, curTime, varNumber, priceToStr} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");
//const m_wallet = require("./wallet.js");
const {PoolObj} = require("./pool.js");

//const fs = require("fs");
//const PID_FILE="pid_list.txt";
//const POS_DATA_FILE="pos_data.txt";


//класс, содержит данные по одной позе
class PositionObj
{
    constructor(pid, pm_contract)
    {
	this.pid = -1;
	if (varNumber(pid)) this.pid = pid; // ID of position
	this.liq = 0;
	this.l_tick = 0;
	this.u_tick = 0;
	this.fee = -1;
	this.token0 = ""; //adress of contract
	this.token1 = ""; //adress of contract

	//contracts obj
	this.pool = null;
	this.pm_contract = pm_contract; //PosManagerContract

	//prices object of range, fields: l_p0, u_p0, l_p1, i_p1
	this.rangePrices = {};
	this._initRangePrices();
    }

    invalid() {return (this.fee <= 0 || this.pid <= 0 || this.pm_contract == null);}
    isActive() {return (!invalid() && this.liq > 0);} // в позе есть ликвидность, т.е. она открыта (может находится вне диапазона)
    ready() {return (this.pm_contract != null && this.pool != null);}	//объект полностью инициализирован и готов к любым запросам
    reset() 
    {
	this.pool = null;
	this.liq = this.l_tick = this.u_tick = 0;
	this.fee = -1;
	this.token0 = this.token1 = "";
    }
    //init object this.rangePrices	
    _initRangePrices() //protected metod
    {
	this.rangePrices.l_p0 = -1;
	this.rangePrices.u_p0 = -1;
	this.rangePrices.l_p1 = -1;
	this.rangePrices.u_p1 = -1;
    }
    //пересчитать поля объекта this.rangePrices
    _recalcRangePrices() //protected metod
    {
	if (!this.ready()) {log("WARNING: invalid pool object, can't recalc prices"); return;}
	this.rangePrices.l_p0 = this.pool.priceByTick(this.l_tick);
	this.rangePrices.u_p0 = this.pool.priceByTick(this.u_tick);
	if (this.rangePrices.l_p0 > 0) this.rangePrices.l_p1 = 1/this.rangePrices.l_p0;
	if (this.rangePrices.u_p0 > 0) this.rangePrices.u_p1 = 1/this.rangePrices.u_p0;
    }
    //признак того что поза находится в диапазоне, перед вызовов необходимо выполнить updateData()
    isInRange() 
    {
	if (!this.ready()) return false;
	const t = this.pool.state.tick;
	return ((t >= this.l_tick) && (t < this.u_tick));
    }

    //получить данные из сети одной позиции по ее ID
    async updateData()
    {
	this.reset();
	log("get pos data, PID [", this.pid,"]  ....");
	try
	{
	    const data = await this.pm_contract.positions(this.pid);	    
	    this._setData(data);
	    log("done!");	    
	}
	catch(err) {log("CATCH_ERR:"); log(err); return false;}    

        this._findPool();
	const result = this._updatePoolData();
	return result;
    }	
    // запросить текущее состояние пула в сети
    async _updatePoolData() //protected metod
    {
	if (!this.ready()) {log("WARNING: invalid pool object"); return false;}
	try {await this.pool.updateData();}
	catch(err) {log("CATCH_POOL_ERR:"); log(err); return false;}    

	this._recalcRangePrices();
	return true;
    }
    //установить значения полей позы полученные из сети
    _setData(data) //protected metod
    {
	this.token0 = data.token0.trim().toLowerCase();
	this.token1 = data.token1.trim().toLowerCase();
	this.liq = data.liquidity;
	this.fee = data.fee;
	this.l_tick = data.tickLower;
	this.u_tick = data.tickUpper;
    }
    //найти по текущим значения позы подходящий адрес пула и инициализировать переменную this.pool
    _findPool() //protected metod
    {
	const fdata = PoolObj.lookPoolsFile();
	fdata.forEach((rec) => {
	//    log("REC:", rec.addr);
	    if ((rec.t0_addr == this.token0) && (rec.t1_addr == this.token1) && (rec.fee == this.fee))
	    {
		this.pool = new PoolObj(rec.addr);
		return;
	    }	   
	});
    }    
    strTickRange()
    {
	let s = ("ticks: " + this.l_tick + "/" + this.u_tick);
	s += (",  current tick of pool: " + this.pool.state.tick);
	return s;
    }
    strPriceRange(t_index = 0)
    {
	let s = "RANGE_PRICES T"+t_index.toString()+": ";
	if (t_index == 1)  s += ("[" + priceToStr(this.rangePrices.l_p1) + " / " + priceToStr(this.rangePrices.u_p1) + "]");
	else s += ("[" + priceToStr(this.rangePrices.l_p0) + " / " + priceToStr(this.rangePrices.u_p0) + "]");
	s += (this.isInRange() ? "  IN_RANGE" : "  OUT_OF_RANGE");
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
	space();
	log("POOL: ", (this.pool ? this.pool.address : "NULL"));
	if (this.pool)
	{
	    this.pool.showPrices();
	    log("current tick: ", this.pool.state.tick);
	}
    }

};


module.exports = {PositionObj};


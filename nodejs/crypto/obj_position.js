
//классы для работы с 1 экзепляром позиции ликвидности
//const ethers = require("ethers");
const {space, log, curTime, varNumber, priceToStr, amountToStr} = require("./utils.js");
const m_base = require("./base.js");
const w_liq = require("./liq_worker.js");

const {poolData, poolState, tokenData} = require("./asyncbase.js");
//const m_wallet = require("./wallet.js");
const {PoolObj} = require("./pool.js");
const JSBI= require("jsbi");

//const fs = require("fs");
//const PID_FILE="pid_list.txt";
//const POS_DATA_FILE="pos_data.txt";


//класс, содержит данные по одной позе
class PositionObj
{
    //в конструкторе необходимо передать PID позиции и ссылку на объект PosManagerContract
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

	//------------------CALC PARAMS----------------------
	this.assetsVolume = {asset0: -1, asset1: -1};  // current assets volume
	this.deposited = {asset0: -1, asset1: -1}; // deposited assets volume
	this.unclaimedFees = {asset0: 0, asset1: 0}; // current unclaimedFees
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
	if (this.pid < 0) {log("WARNING: invalid PID value."); return false;}

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
    //пересчитать невостребованные комиссии
    async updateUnclaimedFees()
    {
	log("try update unclaimed fees ....");
	this.unclaimedFees.asset0 = this.unclaimedFees.asset1 = 0.0;
	if (!this.ready()) {log("WARNING: invalid pool object, can't recalc unclaimed"); return false;}

	const encoded = {
	    tokenId: this.pid,
	    recipient: process.env.WA2,  // owner wallet
	    amount0Max: m_base.MAX_BIG128,
	    amount1Max: m_base.MAX_BIG128
	};

	try
	{
	    const trx = await this.pm_contract.callStatic.collect(encoded);
	    //log("RESULT:", trx); //for diag
	    const str_fee0 = m_base.toReadableAmount(trx.amount0, this.pool.T0.decimal);
	    const str_fee1 = m_base.toReadableAmount(trx.amount1, this.pool.T1.decimal);
	    this.unclaimedFees.asset0 = parseFloat(str_fee0);
	    this.unclaimedFees.asset1 = parseFloat(str_fee1);
	}
	catch(err) {log("CATCH_ERR:"); log(err); return false;}    

	return true;	
    }


    ///////////////////// PROTECTED FUNCS ////////////////////////////////

    // запросить текущее состояние пула в сети
    async _updatePoolData() //protected metod
    {
	if (!this.ready()) {log("WARNING: invalid pool object"); return false;}
	try {await this.pool.updateData();}
	catch(err) {log("CATCH_POOL_ERR:"); log(err); return false;}    

	this._recalcRangePrices();
	this._recalcAssets();
	return true;
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
    //пересчитать вложенные объемы активов
    _calcDeposited()
    {
        const jsbi_liq = JSBI.BigInt(this.liq.toString());
        const jsbi_pcur = JSBI.BigInt(this.pool.state.sqrtPrice.toString());
        const jsbi_p1 = JSBI.BigInt(l_priceX96.toString());
        const jsbi_p2 = JSBI.BigInt(u_priceX96.toString());


	// to do
	// ?????	
    }
    //пересчитать текущие объемы активов
    _recalcAssets()
    {
	if (!this.ready()) {log("WARNING: invalid pool object, can't recalc assets"); return;}
	const l_priceX96 = this.pool.priceQ96ByTick(this.l_tick);
	const u_priceX96 = this.pool.priceQ96ByTick(this.u_tick);
       //to JSBI
        const jsbi_p1 = JSBI.BigInt(l_priceX96.toString());
        const jsbi_p2 = JSBI.BigInt(u_priceX96.toString());
        const jsbi_pcur = JSBI.BigInt(this.pool.state.sqrtPrice.toString());
        const jsbi_liq = JSBI.BigInt(this.liq.toString());	

	//calculation
	const t = this.pool.state.tick;
	if (t < this.l_tick) //under range
	{
	    this.assetsVolume.asset0 = w_liq.LiqWorker.getAmount0Mint(jsbi_p1, jsbi_p2, jsbi_liq);
	    this.assetsVolume.asset1 = w_liq.LiqWorker.jsbiZero();
	}
	else if (t >= this.u_tick) //upper range
	{
	    this.assetsVolume.asset0 = w_liq.LiqWorker.jsbiZero();
	    this.assetsVolume.asset1 = w_liq.LiqWorker.getAmount1Mint(jsbi_p1, jsbi_p2, jsbi_liq);
	}
	else //in range
	{
	    this.assetsVolume.asset0 = w_liq.LiqWorker.getAmount0Mint(jsbi_pcur, jsbi_p2, jsbi_liq);
	    this.assetsVolume.asset1 = w_liq.LiqWorker.getAmount1Mint(jsbi_p1, jsbi_pcur, jsbi_liq);
	}

	//transform to normal values
	this.assetsVolume.asset0 = this._normalizeAssetVolume(this.assetsVolume.asset0, 0);
	this.assetsVolume.asset1 = this._normalizeAssetVolume(this.assetsVolume.asset1, 1);
    }
    //преобразование объема актива, у которого тип JSBI в обычный float вид	
    _normalizeAssetVolume(jsbi_amount, t_index)
    {
	if (jsbi_amount == w_liq.LiqWorker.jsbiZero()) return 0.0;
	const dec = ((t_index == 1) ? this.pool.T1.decimal : this.pool.T0.decimal);
	if (dec == 18)
	{
	    const dec_factor = 10 ** 9;
	    const mid_jsbi = JSBI.divide(jsbi_amount, JSBI.BigInt(dec_factor));
	    const f_mid = parseFloat(mid_jsbi.toString());
	    return (f_mid/dec_factor);
	}

        const dec_factor = 10 ** dec;
	const f_mid = parseFloat(jsbi_amount.toString());
	return (f_mid/dec_factor);
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



    
    ////////////////////////DEBUG FUNCS///////////////////////
    strUnclaimedFees()
    {
	let s = "UNCLAIMED_FEES: " + this.pool.T0.ticker + " " + amountToStr(this.unclaimedFees.asset0);
	s += (" / "  + this.pool.T1.ticker + " " + amountToStr(this.unclaimedFees.asset1));
	return s;
    }
    strAssetsAmount()
    {
	let s = "ASSETS_AMOUNT: " + amountToStr(this.assetsVolume.asset0);
	s += (" / " + amountToStr(this.assetsVolume.asset1));
	return s;
    }
    strDepositedAssets()
    {
	let s = "DEPOSITED_ASSETS: " + amountToStr(this.deposited.asset0);
	s += (" / " + amountToStr(this.deposited.asset1));
	return s;
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


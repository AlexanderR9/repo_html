
//standart utils funcs
const { space, log, jsonFromFile, hasField, jsonKeys, isInt } = require("./../utils.js");

// my class objects
//const { ChainObj } = require("./chain_class.js");
const { ContractObj } = require("./contract_class.js");
const { WalletObj } = require("./wallet_class.js");
const { PoolObj } = require("./pool_class.js");
const { JSBIWorker } = require("./calc_class.js");

const MAX_BIG = "1000000000000000000000000";
const AMOUNTS_PRECISION = 6;		


//вспомогательная структура для хранения текущего состояния позы
class PosState
{
    constructor()
    {
	this.price_range = {p1: -1, p2: -1}; // цены диапазона в нормальных пользовательских единицах, всегда для token0
	this.current_price = -1; // текущая цена в пуле в нормальных пользовательских единицах, всегда для token0
	this.pool_tick = 0; //текущий тик пула
	this.assets = {amount0: 0, amount1: 0}; // текущее количество токенов в позе в нормальных пользовательских единицах
	this.rewards = {amount0: 0, amount1: 0}; // текущее количество заработанных токенов(с комиссий) в позе в нормальных пользовательских единицах	
    }
    reset()
    {
	this.price_range.p1 = this.price_range.p2 = -1;
	this.current_price = -1;
	this.pool_tick = 0;
	this.assets.amount0 = this.assets.amount1 = 0;
	this.rewards.amount0 = this.rewards.amount1 = 0;
    }
    invalid()
    {
	if (this.current_price <= 0) return true;
	if (this.price_range.p1 <= 0 || this.price_range.p2 <= 0) return true;
	if (this.price_range.p1 >= this.price_range.p2) return true;
	return false;
    }
    out()
    {
        log("POS_STATE: price0:", this.current_price, " pool_tick =", this.pool_tick);    
        let s = "[" + this.price_range.p1.toString() + " : " + this.price_range.p2.toString() + "]";
        log("range (price0): ", s);
        s = this.assets.amount0.toString() + " / " + this.assets.amount1.toString();
        log("assets: ", s);
        s = this.rewards.amount0.toString() + " / " + this.rewards.amount1.toString();
        log("rewards: ", s);

    }
}

//объект для работы с одной конкретной позицией
class PositionObj
{
    constructor(pid)
    {
	this.pid = pid;
	this.token0_addr = "0x0";
	this.token1_addr = "0x0";
	this.pool_addr = "0x0";
	this.fee = 0;
	this.tick1 = 0;
	this.tick2 = 0;
	this.liq = "0";
	
	this.state = new PosState();
    }
    // валидность полей объекта
    invalid() 
    {
	if (this.fee <= 0 || this.pid <= 0) return true;
	if (this.tick1 >= this.tick2)  return true;
	if (this.token0_addr.length < 20 || this.token1_addr.length < 20) return true;
	if (this.pool_addr.length < 20) return true;
	if (this.liq.length < 1) return true;
	return false;
    }
    hasLiq()
    {
	if (this.invalid()) return false;
	if (this.liq.length == 1 || Number(this.liq.length) == 0) return false;
	return true;
    }
    // при инициализации член this.state всегда невалиден, следует вызывать эту функцию после updateState()
    invalidState()
    {
	return this.state.invalid();
    }
    fromFileLine(fline)
    {
        let row_list = fline.toString().split("/");
        if (row_list.length != 7) return;

        let i = 0;
        this.pid = parseInt(row_list[i].trim()); i++;
        this.liq = row_list[i].trim(); i++;
        this.fee = parseInt(row_list[i].trim()); i++;
        this.tick1 = parseInt(row_list[i].trim()); i++;
        this.tick2 = parseInt(row_list[i].trim()); i++;
        this.token0_addr = row_list[i].trim(); i++;
        this.token1_addr = row_list[i].trim(); i++;
    }
    out()
    {
        log("POS_DATA: PID =", this.pid);
        log("liquidity: ", this.liq);
        const s = "[" + this.tick1.toString() + " : " + this.tick2.toString() + "]";
        log("tick range: ", s);
        log("token 0: ", this.token0_addr);
        log("token 1: ", this.token1_addr);
        log("fee: ", this.fee);
        log("pool: ", this.pool_addr);
    }
    // создать объект пула где размещена эта поза для получения текущего состояния
    _createPoolObj(w_obj)
    {
	space();
	log("INIT_POOL_OBJECT_STAGE");
	let pool_obj = new PoolObj(this.pool_addr);
	pool_obj.fee = this.fee;
	pool_obj.updateToken0(w_obj.findAsset(this.token0_addr));
	pool_obj.updateToken1(w_obj.findAsset(this.token1_addr));
	return pool_obj;
    }
    //пересчитать текущие объемы активов
    _recalcAssets(pool_obj)
    {
	space();
	log("RECALC_ASSET_STAGE");
	if (!this.hasLiq()) {log("POSITION HAS't LIQ, pid:", this.pid); return;}
	if (pool_obj.invalidState()) return;
//	log("POS_TICK_RANGE:", `[${this.tick1} : ${this.tick2}]`);
//	log("POOL_TICK:", pool_obj.state.tick);
	const r_tick = {tick1: this.tick1, tick2: this.tick2};
	const data = JSBIWorker.recalcAssetsPosition(pool_obj.state.sqrtPrice, this.liq, r_tick);
//	log("result:");
//	log("amount0:", data.amount0.toString());
//	log("amount1:", data.amount1.toString());
	this.state.assets.amount0 = JSBIWorker.weisToFloat(data.amount0, pool_obj.token0.decimal, AMOUNTS_PRECISION);
	this.state.assets.amount1 = JSBIWorker.weisToFloat(data.amount1, pool_obj.token1.decimal, AMOUNTS_PRECISION);	
    }
    //получить невостребованные комиссии
    async _getCurrentRewards(pm_parent, pool_obj)
    {
	space();
	log("GET_REWARDS_STAGE");
	if (pool_obj.invalid() || !pm_parent) return;
        log("try update unclaimed fees ....");
        const params = {
            tokenId: this.pid,
            recipient: pm_parent.wallet.address,  // owner wallet
            amount0Max: MAX_BIG,
            amount1Max: MAX_BIG
        };
	//log("req params:", params);	
        try
        {
            const tx = await pm_parent.contract.callStatic.collect(params);
	    this.state.rewards.amount0 = JSBIWorker.weisToFloat(tx.amount0, pool_obj.token0.decimal, AMOUNTS_PRECISION);
	    this.state.rewards.amount1 = JSBIWorker.weisToFloat(tx.amount1, pool_obj.token1.decimal, AMOUNTS_PRECISION);
        }
        catch(err) {log("ERR:"); log(err);}        
    }
    //запросить текущее состояние пула
    async _getPoolState(pool_obj)
    {
	if (pool_obj.invalid()) {log("WARNING: invalid pool_obj, addr: ", pool_obj.address); return;}
	pool_obj.outShort();    

        await pool_obj.updateState();
	pool_obj.outState();
	if (pool_obj.invalidState()) {log("invalid state pool object"); return;}
	this.state.current_price = pool_obj.state.price0;
	this.state.pool_tick = pool_obj.state.tick;
	this.state.price_range.p1 = pool_obj.priceByTick(this.tick1);
	this.state.price_range.p2 = pool_obj.priceByTick(this.tick2);
    }
    // запросить текущее состояние позы, после нее надо проверить invalidState(), и если ОК, то читать поля this.state
    async updateState(pm_parent)
    {
	// init pool obj
	this.state.reset();
	if (this.invalid()) {log("WARNING: invalid pos_obj"); return;}
	let pool_obj = this._createPoolObj(pm_parent.wallet);
	//get pool state
	await this._getPoolState(pool_obj)
	//recalc assets
	this._recalcAssets(pool_obj);	
	//get rewards
	await this._getCurrentRewards(pm_parent, pool_obj);
    }

};


module.exports = {PositionObj};


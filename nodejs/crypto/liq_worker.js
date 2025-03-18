

//классы для совершения операций с позициями пулов ликвидности
const m_base = require("./base.js");
const {space, log, curTime, varNumber, isInt} = require("./utils.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");
const m_wallet = require("./wallet.js");
const m_pool = require("./pool.js");
const JSBI= require("jsbi");

const JSBI_Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
const JSBI_ZERO = JSBI.BigInt(0);


//класс для добавления/удаления ликвидности в позах uniswap с  указанного кошелька.
class LiqWorker
{
	//передать объект WalletObj, активы которого будут задействованы.
	//передать адрес пула, с которым предстоит работать
	//примечание: для выполнения опрераций tryDecrease и tryCollect объект пула не нужен.
        constructor(w_obj, pool_addr = "")
        {
    	    log("Create LiqWorker: ");
    	    this.wallet = w_obj; //WalletObj instance
            this.pm_contract = m_base.getPosManagerContract(this.wallet.pv);

	    this.pool = null;
	    if (pool_addr.length > 20) this.pool = new m_pool.PoolObj(pool_addr);

	    //признак того что все опрерации будутвыполняться в режиме эмуляции (поумолчанию режим включен), 
	    // т.е. когда будет доходить дело в отправки реальной транзакции будет происходить выход из функции.
	    //для вкл/откл режма надо выполнить функцию setSimulateMode
	    this.simulate_mode = true;

	    //время отведенное для выполнения операции
	    this.dead_line = 150; //secs

        }
	setSimulateMode(m) {this.simulate_mode = m;} //set simulate_mode value
	setDeadLine(n_sec) {this.dead_line = n_sec;} //set dead_line value

	//--------------------protected metods------------------------------

	//incorrect state object
	_invalid(need_check_pool = true)
	{
	    if (need_check_pool)
	    {
		if (this.pool == undefined || this.pool == null) {log("ERROR: this.pool object is NULL"); return true;}
	    }
	    if (this.pm_contract == undefined || this.pm_contract == null) {log("ERROR: this.pm_contract object is NULL"); return true;}
	    if (this.wallet == undefined || this.wallet == null) {log("ERROR: this.wallet object is NULL"); return true;}
	    if (!this.wallet.isSigner()) {log("WARNING: wallet object is not SIGNER"); return true;}
	    if (this.wallet.nativeDecimal() <= 0) {log("WARNING: wallet object is not loaded assets!!!"); return true;}
	    return false;
	}	
	//обновить данные пула
	async _poolUpdate() //protected metod
	{
	    await this.pool.updateData(false); 
	    this.pool.out();
	}
	//расчет значения поля deadline при выполнении операции в текущий момент
	_deadLine() //protected metod
	{
	    const cur_dt = Math.floor(Date.now()/1000);
	    return (cur_dt + this.dead_line);
	}


/*
	//расчет долей активов для указания их в параметрах при чеканке новой позы.
	//вернет результат в виде объекта с сдвумя полями: t0_size, t1_size, а также еще добавит 2 значения - минимальные объемы t0_min, t1_min
	//подразумевается что все входные данные корректны. т.е. были проверены заранее
	_calcMintAmounts(ticks, liq, range_location) //protected metod
	{

	    const bi_liq = m_base.fromReadableAmount(liq, this.wallet.nativeDecimal());
	    const p1X96 = this.pool.priceQ96ByTick(ticks.tick1);
	    const p2X96 = this.pool.priceQ96ByTick(ticks.tick2);

	    //to JSBI
	    const jsbi_p1 = JSBI.BigInt(p1X96.toString());
	    const jsbi_p2 = JSBI.BigInt(p2X96.toString());
	    const jsbi_pcur = JSBI.BigInt(this.pool.state.sqrtPrice.toString());
	    const jsbi_liq = JSBI.BigInt(bi_liq.toString());

	    space();
	    const cur_tick = this.pool.state.tick;
	    log("pool.tick", cur_tick);
	    log("range.tick1", ticks.tick1);
	    log("range.tick2", ticks.tick2);
	    log("jsbi_p1: ", jsbi_p1, "/", jsbi_p1.toString());
	    log("jsbi_p2: ", jsbi_p2, "/", jsbi_p2.toString());
	    log("jsbi_pcur: ", jsbi_pcur, "/", jsbi_pcur.toString());
	    log("jsbi_liq: ", jsbi_liq, "/", jsbi_liq.toString());
	    log("-----------------------------------------")
	    
	    //calc
	    if (cur_tick < ticks.tick1)
	    {
		log("current tick BELOW range");
		result.t0_size = this.getAmount0Mint(jsbi_p1, jsbi_p2, jsbi_liq);
		result.t1_size = JSBI_ZERO;		
	    }
	    else if (cur_tick < ticks.tick2)
	    {
		log("current tick INSIDE range");
		result.t0_size = this.getAmount0Mint(jsbi_pcur, jsbi_p2, jsbi_liq);
		result.t1_size = this.getAmount1Mint(jsbi_p1, jsbi_pcur, jsbi_liq);
	    }
	    else
	    {
		log("current tick UPPER range");
		result.t0_size = JSBI_ZERO;		
		result.t1_size = this.getAmount1Mint(jsbi_p1, jsbi_p2, jsbi_liq);
	    }

	    //calc min
	    if (result.t0_size > 0) result.t0_min = JSBI.multiply(JSBI.divide(result.t0_size, JSBI.BigInt(100)), JSBI.BigInt(98));
	    else result.t0_min = 0;
	    if (result.t1_size > 0) result.t1_min = JSBI.multiply(JSBI.divide(result.t1_size, JSBI.BigInt(100)), JSBI.BigInt(98));
	    else result.t1_min = 0;
	
	    return result;
	}
*/

	//определяет где находится текущих тик пула относительно указанного диапазона
	//возвращает следующие значения: out_left, within, out_right, invalid(если диапазон некорректно задан)
	_locationRange(ticks)
	{
	    if (!isInt(ticks.tick1) || !isInt(ticks.tick2)) {log("invalid_int"); return "invalid";}
	    const d_tick = ticks.tick2 - ticks.tick1;
	    if (d_tick <= 0) {log("invalid_dTick"); return "invalid";}
	    if ((d_tick % this.pool.tick_space) != 0) {log("invalid_tickSpacing"); return "invalid";}

	    if (this.pool.state.tick < ticks.tick1) return "out_left";
	    if (this.pool.state.tick >= ticks.tick2) return "out_right";
	    return "within";
	}
	_checkLiqSizeObj(liq_size)
	{
	    if (!varNumber(liq_size.token0)) return "liq token0 value is not number";
	    if (!varNumber(liq_size.token1)) return "liq token1 value is not number";
	    if (liq_size.token0 != -1 && liq_size.token1 != -1 ) return "one of the token_sizes must be -1 value";
	    if (liq_size.token0 < 0.01 && liq_size.token1 < 0.01 ) return "token_sizes too small";
	    return "";	    
    	}

	//static funcs
	static getAmount0Mint(jsbi_p1, jsbi_p2, jsbi_liq)	
	{
    	    const d_price = JSBI.subtract(jsbi_p2, jsbi_p1);
	    const numerator1 = JSBI.leftShift(jsbi_liq, JSBI.BigInt(96));
	    const numerator2 = JSBI.multiply(numerator1, d_price);
	    return JSBI.divide(JSBI.divide(numerator2, jsbi_p2), jsbi_p1);
	}
	static getAmount1Mint(jsbi_p1, jsbi_p2, jsbi_liq)	
	{
    	    const d_price = JSBI.subtract(jsbi_p2, jsbi_p1);
	    return JSBI.divide(JSBI.multiply(jsbi_liq, d_price), JSBI_Q96);
	}
	static jsbiZero() {return JSBI_ZERO;}
	static jsbiQ96() {return JSBI_Q96;}
	

	

        //расчет долей активов для указания их в параметрах при чеканке новой позы.
        //вернет результат в виде объекта с сдвумя полями: t0_size, t1_size, а также еще добавит 2 значения - минимальные объемы t0_min, t1_min
        //подразумевается что все входные данные корректны. т.е. были проверены заранее
        //массив p_arr это реальные пользовательские цены, содержит 3 элемента, p_arr[0] текущая,  p_arr[1] и p_arr[2] диапазон позы
        _calcMintAmounts(liq, range_location, p_arr) //protected metod
        {
            let result = {t0_size: JSBI_ZERO, t0_min: JSBI_ZERO, t1_size: JSBI_ZERO, t1_min: JSBI_ZERO};
            if (range_location == "out_left") //текущая цена ниже всего диапазона
            {
                result.t0_size = JSBI.BigInt(liq.token0 * this.pool.T0.decimalFactor());
            }
            else if (range_location == "out_right") //текущая цена выше всего диапазона
            {
                result.t1_size = JSBI.BigInt(liq.token1 * this.pool.T1.decimalFactor());
            }
            else  //curret price within range
	    {
                if (liq.token1 > 0)
		{
                    result.t1_size = JSBI.BigInt(liq.token1 * this.pool.T1.decimalFactor());
                    const L = liq.token1/(Math.sqrt(p_arr[0]) - Math.sqrt(p_arr[1])); //p_arr[0] - current price
                    const size0 = L*(1/Math.sqrt(p_arr[0]) - 1/Math.sqrt(p_arr[2]));
                    result.t0_size = JSBI.BigInt(Math.round(size0 * this.pool.T0.decimalFactor()));
                    log(` TOKENS_SIZE: ${size0.toFixed(1)} / ${liq.token1}`, `  L: ${L}`);
		}
		else
		{
                    result.t0_size = JSBI.BigInt(liq.token0 * this.pool.T0.decimalFactor());
                    const L = liq.token0*Math.sqrt(p_arr[0]*p_arr[2])/(Math.sqrt(p_arr[2]) - Math.sqrt(p_arr[0])); //p_arr[0] - current price
                    const size1 = L*(Math.sqrt(p_arr[0]) - Math.sqrt(p_arr[1]));
                    result.t1_size = JSBI.BigInt(Math.round(size1 * this.pool.T1.decimalFactor()));
                    log(` TOKENS_SIZE: ${liq.token0} / ${size1.toFixed(1)}`, `  L: ${L}`);
		}
	    }
                                        ///L = (t_size*qSqrt(cp*p2))/(qSqrt(p2) - qSqrt(cp));
                                        ///token1_size = out_params.L*(qSqrt(cp) - qSqrt(p1));
            
            //calc min sizes
            if (liq.token1 > 0) result.t1_min = result.t1_size;
            else result.t0_min = result.t0_size;
            return result;
	}


	//////////////////////////////////////////////////////
	//чеканка новой позы, функция сначала обновит данные и состояние пула
	//p1, p2 - ценовой диапазон позы (реальные пользовательские значения, но только для токена 0)
	//liq_size - общая ликвидность позы, задается как объект с двумя полями {token0, token1}, один из которых должен быть -1, 
	//т.к. он будет рассчитываться взависимости от диапазона и объема 2-го токена, нужно внимательно смотреть где сейчас цена и какой размер задать.
	async tryMint(p1, p2, liq_size)
	{
	    log("try mint new pos ............");
	    if (this._invalid()) return -1;
	    if (p1 <= 0 || p1 >= p2) {log("WARNING: invalid prices values of POS_range!!!"); return -2;}
	    const liq_err = this._checkLiqSizeObj(liq_size);
	    if (liq_err != "") {log("WARNING: ", liq_err); return -2;}
	
	    log("p1 =", p1, "  p2 =", p2);
	    log("liq_size", liq_size, '\n');
	    try {await this.pool.updateData();}  //get current pool state params
	    catch(e) {log("ERROR:", e); return -2;}

	    //this.pool.showPrices();
	    //log("current tick: ", this.pool.state.tick);
	    //log("current sqrtPriceX96: ", this.pool.state.sqrtPrice, " / ", this.pool.state.sqrtPrice.toString());
	    //space();

	    //calc ticks's range
	    const ticks = this.pool.calcTickRange(p1, p2);
	    const r_loc = this._locationRange(ticks);
	    log(`TICK_RANGE: [${ticks.tick1} : ${ticks.tick2}]`, "   current tick: ", this.pool.state.tick);
	    const p1_tick = this.pool.priceByTick(ticks.tick1);
	    const p2_tick = this.pool.priceByTick(ticks.tick2);
	    log(`REAL_PRICE_RANGE: [${p1_tick.toFixed(4)} : ${p2_tick.toFixed(4)}]`,  `  current price ${this.pool.T0.ticker} : `, this.pool.T0.price.toFixed(4));
	    log("PRICE_LOCATION: ", r_loc, '\n');
	    if (r_loc == "invalid") {log("ERROR: invalid ticks range"); return -3;}

	    // prepare mint params
	    let mint_params = {token0: this.pool.T0.address, token1: this.pool.T1.address, fee: this.pool.fee};
    	    mint_params.tickLower = ticks.tick1;
	    mint_params.tickUpper = ticks.tick2;

	    //calc token's sizes
	    const p_arr = [this.pool.T0.price, p1_tick, p2_tick];
            const amounts = this._calcMintAmounts(liq_size, r_loc, p_arr);
	    if (amounts.t0_size < 0 || amounts.t1_size < 0) {log("ERROR: invalid calculation amounts token"); return -3;}
	    mint_params.amount0Desired = amounts.t0_size.toString();
	    mint_params.amount1Desired = amounts.t1_size.toString();
	    mint_params.amount0Min = amounts.t0_min.toString();
	    mint_params.amount1Min = amounts.t1_min.toString();
	    mint_params.recipient = this.wallet.address;
            mint_params.deadline = this._deadLine();
	    log("MINT_PARAMS:", mint_params, '\n');

	    /////////////////////SEND TX///////////////////////////////////
	    const result = await this._sendTx(mint_params, "mint");
	    return result;
	}
	//добавление ликвидности в указанную позу(уже существующую). 
	//в папаметрах нужно указать PID позы и размер добавляемой ликвидности.
	//liq_size - добавляемая ликвидность, задается как объект с двумя полями {token0, token1}, один из которых должен быть -1, 
	//перед добавлением ликвидности функция сначала обновит данные и состояние пула для точного определения 2-го размера токена.
	async tryIncrease(pid, ticks, liq_size)
	{
	    log("try increase liquidity to pos", pid, " ............");
	    if (this._invalid()) return -1;
    	    if (!varNumber(pid) || pid <= 0)  {log("WARNING: position PID is not correct, PID: ", pid); return -2;}
	    const liq_err = this._checkLiqSizeObj(liq_size);
	    if (liq_err != "") {log("WARNING: ", liq_err); return -2;}

	    log("adding liquidity size: ", liq_size);
	    try {await this.pool.updateData();}  //get current pool state params
	    catch(e) {log("ERROR:", e); return -2;}

	    //определения нахождения текущей цены относительно диапазона существующей позы
	    const r_loc = this._locationRange(ticks);
	    log(`POSITION TICK_RANGE: [${ticks.tick1} : ${ticks.tick2}]`, "   current tick: ", this.pool.state.tick);
	    const p1_tick = this.pool.priceByTick(ticks.tick1);
	    const p2_tick = this.pool.priceByTick(ticks.tick2);
	    log(`REAL_PRICE_RANGE: [${p1_tick.toFixed(4)} : ${p2_tick.toFixed(4)}]`,  `  current price ${this.pool.T0.ticker} : `, this.pool.T0.price.toFixed(4));
	    log("PRICE_LOCATION: ", r_loc, '\n');
	    if (r_loc == "invalid") {log("ERROR: invalid ticks range"); return -3;}

	    //calc token's sizes
	    const p_arr = [this.pool.T0.price, p1_tick, p2_tick];
            const amounts = this._calcMintAmounts(liq_size, r_loc, p_arr);
	    if (amounts.t0_size < 0 || amounts.t1_size < 0) {log("ERROR: invalid calculation amounts token"); return -3;}

	    //prepare params		    
    	    let add_params = {tokenId: pid};
	    add_params.amount0Desired = amounts.t0_size.toString();
	    add_params.amount1Desired = amounts.t1_size.toString();
	    add_params.amount0Min = amounts.t0_min.toString();
	    add_params.amount1Min = amounts.t1_min.toString();
            add_params.deadline = this._deadLine();;
	    log("INCREASE_PARAMS:", add_params);
	    space();

	    /////////////////////SEND TX///////////////////////////////////
	    const result = await this._sendTx(add_params, "increase");
	    return result;
	}
	

	//удаление ликвидности из указанной позы, текущая ликвидность в позе должна быть > 0. 
	//в папаметрах нужно указать PID позы и размер удаляемой ликвидности из этой позы.
	//можно удалять всю ликвидность и только часть, в этом случае в liq_size нужно указать требуемый размер(долю от полной ликвидности позы).
	//из опыта выяснилось что удаленная ликвидность переходит в невостребованные комиссии(добавляется к ним), а не на кошелек,
	//поэтому после этой функции нужно выполнить tryCollect() чтобы вывести все токены (включая комиссии на кошелек).
	async tryDecrease(pid, liq_size)
	{
	    log("try decrease liquidity from pos", pid, " ............");
	    log("removing liquidity size:, ", liq_size);
	    if (this._invalid(false)) return -1;
    	    if (!varNumber(pid) || pid <= 0)  {log("WARNING: position PID is not correct, PID: ", pid); return -2;}

	    //prepare params		    
    	    let remove_params = {tokenId: pid};
	    remove_params.liquidity = m_base.toBig(liq_size);
	    remove_params.amount0Min = 0;
	    remove_params.amount1Min = 0;
            remove_params.deadline = this._deadLine();;
	    log("REMOVE_PARAMS:", remove_params);
	    space();

	    /////////////////////SEND TX///////////////////////////////////
	    const result = await this._sendTx(remove_params, "decrease");
	    return result;
	}
	//вывод токенов-комиссий у заданной позы на кошелек.
	async tryCollect(pid)
	{
	    log("try collect liquidity from pos", pid, " to own wallet ............");
	    if (this._invalid(false)) return -1;
    	    if (!varNumber(pid) || pid <= 0)  {log("WARNING: position PID is not correct, PID: ", pid); return -2;}

	    //collect params		    
    	    let collect_params = {tokenId: pid};
	    collect_params.recipient = this.wallet.address;
	    collect_params.amount0Max = m_base.MAX_BIG128;
	    collect_params.amount1Max = m_base.MAX_BIG128;	    
            collect_params.deadline = this._deadLine();
	    log("COLLECT_PARAMS:", collect_params);
	    space();

	    /////////////////////SEND TX///////////////////////////////////
	    const result = await this._sendTx(collect_params, "collect");
	    return result;
	}
        /////////////////////SEND TX///////////////////////////////////
	async _sendTx(operation_params, operation_name) //protected metod
	{
    	    //prepare fee params
    	    let fee_params = {};
    	    this.wallet.gas.setFeeParams(fee_params);
	    log("fee_params:", fee_params, '\n');
    
	    log("send transaction .................................................");
	    if (this.simulate_mode)  {log("simulate_mode: ON"); return 9999;}

	    // send tx
	    let tx_reply = {};
	    const pm_conn = this.pm_contract.connect(this.wallet.signer);
	    if (operation_name == "mint")
	    {
		try { tx_reply = await pm_conn.mint(operation_params, fee_params); }
                catch(e) {log("ERROR:", e); return -4;}		
	    }
	    else if (operation_name == "increase")
	    {
		try { tx_reply = await pm_conn.increaseLiquidity(operation_params, fee_params); }
                catch(e) {log("ERROR:", e); return -4;}		
	    }
	    else if (operation_name == "decrease")
	    {
		try { tx_reply = await pm_conn.decreaseLiquidity(operation_params, fee_params); }
                catch(e) {log("ERROR:", e); return -4;}		
	    }
	    else if (operation_name == "collect")
	    {
		try { tx_reply = await pm_conn.collect(operation_params, fee_params); }
                catch(e) {log("ERROR:", e); return -4;}		
	    }
	    else {log("ERROR: invalid operation_name ", operation_name); return -99;}

	    //result operation OK
            log("TX_REPLY:", tx_reply);
	    return {code: true, tx_hash: tx_reply.hash};
	}

};


module.exports = {LiqWorker};


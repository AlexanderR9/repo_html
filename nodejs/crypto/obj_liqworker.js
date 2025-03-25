

//классы для совершения операций с позициями пулов ликвидности
const m_base = require("./base.js");
const {space, log, delay, varNumber, isInt, hasField, isJson} = require("./utils.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");
const m_wallet = require("./obj_wallet.js");
const m_pool = require("./obj_pool.js");
const JSBI= require("jsbi");
const {TxWorkerObj} = require("./obj_txworker.js");


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

	    
            this.tx_worker = null; //объект для отправки подготовленных транзакций в сеть
	    if (w_obj.isSigner()) this.tx_worker = new TxWorkerObj(w_obj);


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
	//умножение числа JSBI на вещественное положительное число , вернет результат умножения, float_b must > 0
	static jsbiMulFloat(jsbi_a, float_b)
	{
	    if (float_b <= 0) return JSBI_ZERO;

	    const int_part = Math.floor(float_b);	    
	    const f_part = float_b - int_part; // f_part >= 0 and < 1
	    //log(`int_part=${int_part}  f_part=${f_part}`);
	    let result = JSBI_ZERO;
	    //log("result: ", result.toString());
	    if (int_part > 0) result = JSBI.multiply(jsbi_a, JSBI.BigInt(int_part)); 
	    //log("result: ", result.toString());
	    if (f_part > 0)
	    {
		let degree = 100;		
		for (var i=0; i<10; i++)
		{
		    if (isInt(f_part*degree)) break;
		    degree *= 10;		    
		}	
		const f_int = Math.round(f_part*degree);
		log("degree: ", degree, "  f_int: ", f_int);
		let ja = JSBI.multiply(jsbi_a, JSBI.BigInt(f_int)); 
		//log("ja after mul f_int: ", ja.toString());
		ja = JSBI.divide(ja, JSBI.BigInt(degree)); 
		//log("ja after divide degree: ", ja.toString());
		result = JSBI.add(result, ja); 
	    }
	    return result;
	}
	//для выполнения опрераций с позициями необходимо задавать ценовой диапазон в виде 2-х значений p1, p2.
	//эти значения цен должны быть указаны для Токена_0 в единицах Токена_1,
	//эта функция придназначена для того чтобы иметь возможность задавать диапазон в для Токена_1.
	//т.е. если у нас есть такой диапазон, то эта функция конвертирует его в диапазон для Токена_0, после чего уже можно вызывать например 'tryMint'.
	//на вход подается объект с двумя полями {p1, p2}, и возвращает такой же объект, но уже инвертированный приведенный к Токена_0.
	static invertPrices(p_range)
	{
	    let result = {p1: -1, p2: -1};
	    const p1 = p_range.p1;
	    const p2 = p_range.p2;
	    if (!varNumber(p1) || !varNumber(p2)) return result;
	    if (p1 <= 0 || p2 <= 0) return result;
	    
	    result.p1 = 1/p2;
	    result.p2 = 1/p1;
	    return result;
	}

	

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
            
            //calc min sizes
	    const f_mul = 0.994;
            if (liq.token1 > 0) 
	    {
		if (this.pool.T1.decimal == 6) result.t1_min = result.t1_size;
		else result.t1_min = LiqWorker.jsbiMulFloat(result.t1_size, f_mul)
	    }
            else 
	    {
		if (this.pool.T0.decimal == 6) result.t0_min = result.t0_size;
		else result.t0_min = LiqWorker.jsbiMulFloat(result.t0_size, f_mul)
	    }
            return result;
	}


	/////////////////////////transaction funcs /////////////////////////////


	//TX_1. чеканка новой позы, функция сначала обновит данные и состояние пула
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
	    this.pool.showPrices();

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
	//TX_2. добавление ликвидности в указанную позу(уже существующую). 
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
	//TX_3. удаление ликвидности из указанной позы, текущая ликвидность в позе должна быть > 0. 
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
	//TX_4. вывод токенов-комиссий у заданной позы на кошелек.
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
	//данная функция просто сочетает в себе 2 фунции tryDecrease и tryCollect (что бы не делать 2 вызова скрипта по очереди).
	//функция выполняет последовательно tryDecrease и tryCollect, в случае ошибки 1-й итерации прерывается.
	async takeFull(pid, liq_size)
	{
	    let tx_reply = null;
    	    try { tx_reply = await this.tryDecrease(pid, liq_size); }
            catch(e) {log("ERROR:", e); return -11;}		
	
	    if (!hasField(tx_reply, "tx_hash")) {log("STAGE_1: result fault"); return -12;}
	    log("STAGE_1: TX sended, tx_hash =", tx_reply.tx_hash);
	
	    
	    // check hash of TX stage1
	    let can_collect = false;	    
	    for (var i=0; i<5; i++)
	    {
		log("wait delay ..");
    		await delay(7000);	
		const tx_res = await this.tx_worker.checkTxByHash(tx_reply.tx_hash);
		if (isInt(tx_res))
		{
		    if (tx_res == 0) {log("STAGE_1: transaction was fail"); return -13;}
		    if (tx_res == 1) {log("STAGE_1: transaction SUCCESSED"); can_collect=true; break;}
		}
	    }
	    if (!can_collect) {log("STAGE_1: transaction over timeout"); return -14;}
	    space();	

	    //go to next stage, collect
    	    await delay(2000);	
	    log("go to next stage [COLLECT] ..........");
    	    await delay(3000);	
	    let result = {code: true, tx_hash1: tx_reply.tx_hash};
	    tx_reply = null;
    	    try { tx_reply = await this.tryCollect(pid); }
            catch(e) {log("ERROR:", e); return -15;}		

	    if (!hasField(tx_reply, "tx_hash")) {log("STAGE_2: result fault"); return -16;}
	    log("STAGE_2: TX sended, tx_hash =", tx_reply.tx_hash);
	    result.tx_hash2 = tx_reply.tx_hash;
	    return result;

	}	
        /////////////////////SEND TX///////////////////////////////////
	async _sendTx(operation_params, operation_name) //protected metod
	{
    	    //prepare fee params
	    if (this.simulate_mode)
	    {
    		let fee_params = {};
    		this.wallet.gas.setFeeParams(fee_params);
		log("fee_params:", fee_params, '\n');
		log("send transaction .................................................");
	        log("simulate_mode: ON"); 
		return 9999;
	    }

            operation_params.tx_kind = operation_name;
            /////////////////////SEND TX///////////////////////////////////
            const result = await this.tx_worker.sendTx(operation_params);
            return result;
	}

};


module.exports = {LiqWorker};


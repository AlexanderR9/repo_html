const { space, log, jsonFromFile, hasField, jsonKeys, isInt, decimalFactor } = require("./../utils.js");

// my class objects
const { ChainObj } = require("./chain_class.js");
const { ContractObj } = require("./contract_class.js");
const { JSBIWorker } = require("./calc_class.js");
const { WalletAsset } = require("./wallet_class.js");

//const JSBI= require("jsbi");


const PRICE0_PRECISION = 10;


//класс для работы с выборочным пулом.
//при создании экземпляра необходимо указать адрес пула.
//вызвав функцию updateData() можно получить информацию о токенах и текущие  цены пула
class PoolObj
{
	//при создании экземпляра необходимо сразу передать адрес пула
	constructor(addr) 
	{	
		log("Create pool object: ", addr);
		this.address = addr; //адрес пула, обязательный параметр
		this.token0 = new WalletAsset("?"); //пустой объект
		this.token1 = new WalletAsset("?");
		this.fee = 0;

		// контракты ethres
		this.pv = ContractObj.getProvider();	
		this.contract = ContractObj.getPoolContract(this.address, this.pv);

		// объект для хранения текущего состояния пула.
		// price0 это цена токена0 в нормальных пользовательских единицах, пересчитывается при обновлении состояния => func updateState() 
		this.state = {liq: 0, sqrtPrice: 0, tick: 0, price0: -1}; 
  	}
	_resetState()
	{
	    this.state.liq = 0;
	    this.state.sqrtPrice = 0;
	    this.state.tick = 0;
	}
	// поправочный кеф между decimals
	_decimalScaleFactor() 
	{
	    return decimalFactor(this.token0.decimal, this.token1.decimal);
	} 
	// посчитать реальную текущую цену (token0) для текущего тика пула (предварительно нужно выполнить updateState() )
	_recalcPrice0()
	{
	    const p_user = JSBIWorker.priceBySqrtPriceQ96(this.state.sqrtPrice, this.token0.decimal, this.token1.decimal);
	    this.state.price0 = p_user.toFixed(PRICE0_PRECISION);
	    //const p96 = Number(this.state.sqrtPrice);
	    //if (p96 == 0) return;
	    //let p = ((p96 / (2 ** 96)) ** 2);		
	    //p /= this._decimalScaleFactor();
	    //this.state.price0 = p.toFixed(PRICE0_PRECISION);
	}


	// признак того что параметры пула заданы некорректно
	invalid() 
	{
	    if (this.address.length < 10) return true;
	    if (this.fee <= 0) return true;
	    if (this.token0.invalid() || this.token1.invalid()) return true;
	    return false;
	}
	// признак того что требуется запросить из сети текущее состояние пула (объект state не обновлен)
	invalidState() 
	{
	    if (this.state.liq <= 0) return true;
	    if (this.state.sqrtPrice <= 0) return true;
	    if (this.state.price0 <= 0) return true;
	    return false;
	}
	// процент комиссии пула в вещественном виде
    	floatFee() {return (this.fee/10000);}
	//получить реальную цену(token0) по указанному тику
	priceByTick(tick) 
	{
	    const sqrtPriceQ96 = JSBIWorker.sqrtPriceQ96ByTick(tick);
	    const p_user = JSBIWorker.priceBySqrtPriceQ96(sqrtPriceQ96, this.token0.decimal, this.token1.decimal);
    	    return p_user.toFixed(PRICE0_PRECISION);


    	    //const a = ContractObj.tickQuantum() ** tick;
    	    //const real_price = a/this._decimalScaleFactor();
    	    //return  real_price.toFixed(PRICE0_PRECISION);
	}
	//обновить поля token0
	updateToken0(data)
	{
	    this.token0.name = data.ticker;
	    this.token0.address = data.address;
	    this.token0.decimal = data.decimal;
	}
	//обновить поля token1
	updateToken1(data)
	{
	    this.token1.name = data.ticker;
	    this.token1.address = data.address;
	    this.token1.decimal = data.decimal;
	}
	// diag debug
	out()
	{
    	    log("PoolObj: ", this.address, "   fee =", this.fee);
	    log("Token 0:");
	    this.token0.out();
	    log("Token 1:");
	    this.token1.out();
	}
	outShort()
	{
    	    log("Pool info: ", this.address);
	    log(`TOKEN_PAIR: ${this.token0.name}/${this.token1.name},  FEE = ${this.floatFee()}%`);
	}
	outState()
	{
	    space();
    	    log("Pool_State: ");
	    log("tick: ", this.state.tick);
	    log("sqrt_price: ", this.state.sqrtPrice.toString());
	    log("liquidity: ", this.state.liq.toString());
	    log("price0: ", this.state.price0);
	    log("price1: ", (1/this.state.price0).toFixed(PRICE0_PRECISION));
/*
	    log("///////////////JSBI////////////////")
	    const sqrtPriceQ96 = JSBIWorker.sqrtPriceQ96ByTick(this.state.tick);
	    log("sqrt_price", sqrtPriceQ96.toString());
	    const p_user = JSBIWorker.priceBySqrtPriceQ96(sqrtPriceQ96, this.token0.decimal, this.token1.decimal);
	    log("p_user: ", p_user);
*/
	}
	//  запросить в сети текущее состояние пула, обновить объект this.state
	async updateState()
	{
	    log("PoolObj: try state update ...........");
	    this._resetState();
	    try
	    {
    		const [liq, slot0] = await Promise.all([this.contract.liquidity(), this.contract.slot0()]);
    		this.state.liq = liq;
    		this.state.sqrtPrice = slot0[0];
    		this.state.tick = slot0[1];

		//calc normal price0
		this._recalcPrice0()
	    }
	    catch(e) {log("ERR: ", e); this._resetState();} 
	    log("state updated!");
	}	
	//функция извлекает текущий TVL каждого из пары токенов в пуле.
	async updateTVL()
	{
	    log("PoolObj: try get TVL ...........");
            const t_obj0 = ContractObj.getTokenContract(this.token0.address, this.pv);
            const t_obj1 = ContractObj.getTokenContract(this.token1.address, this.pv);
	    const [tvl0, tvl1] = await Promise.all([ t_obj0.balanceOf(this.address), t_obj1.balanceOf(this.address) ]);
	    this.token0.balance = JSBIWorker.weisToFloat(tvl0, this.token0.decimal, 1);
	    this.token1.balance = JSBIWorker.weisToFloat(tvl1, this.token1.decimal, 1);

	    log("T0.tvl=", tvl0, this.token0.ticker);
	    log("T1.tvl=", tvl1, this.token1.ticker);
	    log("done!");
	}

/*
	//вернет цену одного из токенов пула(более привычную для пользователя), какую - зависит от типов токенов.
	//если один из токен стайбл, то вернет цену НЕ стейбла.
	//если пул состоит из обоих стейблов и при этом один из них USDT, то вернет цену другого токена.
	//в остальных случаях всегда возвращает цену первого токена из пары.
	userPrice()
	{
	    if (this.invalidPoolData()) return -1;

	    if (!this.T0.isStable() && this.T1.isStable()) return this.T0.price;		
	    if (this.T0.isStable() && !this.T1.isStable()) return this.T1.price;		
	    if (this.isStable())
	    {
		if (this.T0.ticker == "USDT") return this.T1.price;
		if (this.T1.ticker == "USDT") return this.T0.price;
	    }
	    return this.T0.price;
	}

	


    //возвращает предполагаемую сумму обмена выходного токена при заданных входных параметрах.
    //функция только проводит предварительный расчет, никаких изменений не вносит.      
    //перед расчетом функция выполнит updateState(); 
    //sum_in - сумма выделенная на обмен входного токена.
    //t_in - индекс входного токена в паре пула, может принимать значения 0 и 1, поумолчанию 0 .
    async tokenSizeBySwapping(sum_in, t_in = 0, need_update_state = true) //getting out_sum(t1) by in_sum(t0) from object quotesContract
    {
        log("Try calc out token by swap ...");
        if (!varNumber(sum_in))  {log("WARNING: input SUM is not number_value, sum: ", sum_in); return -1;}
        if (sum_in < 0.01 || sum_in > 100000)  {log("WARNING: input SUM is not correct, sum:", sum_in); return -1;}

	if (this.invalidPoolData())
	{
	    await this.updateData();
	    //this.out();
	}
	else if (need_update_state) { await this.updateState(); }

	let s = "TOKEN_IN: " + ((t_in == 0) ? this.T0.ticker : this.T1.ticker) + ";";
	s += "  SUM_IN = " + sum_in;
	log("Swap conditionals: ", s);
	
	this.recalcPrices();
	const price =  ((t_in == 0) ? this.T1.price : this.T0.price);
        if (price < 0.00000001)  {log("WARNING: out_token price is not correct, price:", price); return -1;}
	s = "TOKEN_OUT: " + ((t_in == 0) ? this.T1.ticker : this.T0.ticker) + ";";
	s += "  QUOTE = " + ((t_in == 0) ? this.T1.strPrice() : this.T0.strPrice());
	log("Waiting result: ", s);
	
	const p_factor = (100-this.floatFee())/100;
	log("Percent factor:", p_factor);
	const result = (sum_in*p_factor)/price;
	log("Result: ", result.toFixed(4));
	return result;
    }

    //получить номера тиков для открытия позы по реальным значениям цен (внимательно: цена указывается для токена0 в ед. токена1).
    //вернет объект с двумя полями tick1, tick2 (c учетом tickSpacing, причем значения будут притянуты к нижним границам интервалов tickSpacing).
    //предварительно должна быть вызвана функция update.
    calcTickRange(p1, p2)
    {
        log("try get ticks range ......");
        let result = {};
        let f_dec = decimalFactor(this.T0.decimal, this.T1.decimal);

	//log("prices: p1 =", p1, "  p2 =", p2);
	
        p1 *= f_dec;
        p2 *= f_dec;

	const qp = m_base.TICK_QUANTUM;
        result.tick1 = Math.floor(uLog(qp, p1));
        result.tick2 = Math.floor(uLog(qp, p2));
	//log("raw_result:", result);    	
	
	
	const t_space = m_base.tickSpacingByFee(this.fee);
	//find ticks nearest tickSpacing
	let mod = result.tick1 % t_space;
	if (mod < 0) {mod += t_space; result.tick1 -= mod;}
	else if (mod > 0) result.tick1 -= mod;

	mod = result.tick2 % t_space;
	if (mod < 0) {mod += t_space; result.tick2 -= mod;}
	else if (mod > 0) result.tick2 -= mod;

        return result;
    }

    //получить цену вида Q96 но номеру тика (внимательно: цена указывается для токена0 в ед. токена1).
    //предварительно должна быть вызвана update, возвращает BigInt
    priceQ96ByTick(tick)
    {
        //log("try get price Q96 by tick range ......");
	//log("tick: ", tick);
        let f_dec = decimalFactor(this.T0.decimal, this.T1.decimal);

	//--------------stage 1----------------------------
	const a = m_base.TICK_QUANTUM ** tick;
    	const real_price = a/f_dec;
	//log("real_price: ", real_price);

	//--------------stage 2----------------------------
	const price_raw = real_price*f_dec;
	let sqrtPrice = Math.sqrt(price_raw);
	sqrtPrice = Math.round(sqrtPrice*(2 ** 96));
	const biX96 = BigInt(sqrtPrice);
	//log("sqrtPriceX96: ", biX96, " / ", biX96.toString());
	    
	return biX96;
    }
    priceByTick(tick) //получить реальную цену(token0) по указанному тику
    {
        //log("try get real price by tick", tick, " ......");
        let f_dec = decimalFactor(this.T0.decimal, this.T1.decimal);
	const a = m_base.TICK_QUANTUM ** tick;
    	const real_price = a/f_dec;
	//log("price: ", real_price);
	return 	real_price;
    }
    

    //получить объем одного из токенов для внесения в позу при следующих условиях:
    //prices - объект с тремя ценами {p1, p2, p_current}. ВНИМАНИЕ: цены должны быть указаны для TOKEN_0.
    //t_amount - принудительный объем одного из токенов (любой).
    //t_index - индекс (0/1) токена t_amount для которого мыуказываем принудительно.
    //функция рассчитывает объем 2-го токена для внесения (вернет именно это значение, float).
    //при некоректных данных вернет -1.
    //все значения параметров и возвращаемое значение - это обычные пользовательныкие float
    calcPosAssetAmount(prices, t_amount, t_index)
    {
	space();
	//log("calcPosAssetAmount .......");
	log("PRICES:", prices);
	const p1 = prices.p1;
	const p2 = prices.p2;
	const p_cur = prices.p_current;
	if (!isFloat(p1) || !isFloat(p2) || !isFloat(p_cur)) {log("ERROR: invalid prices values!"); return -1;}
	if (!isFloat(t_amount) || t_amount < 0.001) {log("ERROR: invalid t_amount value!"); return -1;}
	if (!isInt(t_index) || t_index < 0 || t_index > 1) {log("ERROR: invalid t_index value!"); return -1;}
	if (p1<=0 || p2<=0 || p_cur<=0) {log("ERROR: prices must > 0"); return -1;}
	if (p2 <= p1) {log("ERROR: p2 must > p1"); return -1;}
	log(`INPUT_AMOUNT TOKEN ${t_amount}`, `  TOKEN INDEX ${t_index}`);
	
	//stage_1 (p_cur < p_low)
	if (p_cur < p1) 
	{
	    if (t_index == 1) {log("ERROR: invalid t_index, (p_cur < p_low) all liq must in TOKEN_0!"); return -1;}
	    return 0;
	}
	//stage_2 (p_cur > p_high)
	if (p_cur > p2) 
	{
	    if (t_index == 0) {log("ERROR: invalid t_index, (p_cur > p_high) all liq must in TOKEN_1!"); return -1;}
	    return 0;
	}

	//stage_3 (p_cur within range [p_low; p_high])
	var qp1 = Math.sqrt(p1);
	var qp2 = Math.sqrt(p2);
	var qp_cur = Math.sqrt(p_cur);
	//calc LIQ value
	var L = t_amount/(qp_cur-qp1); // by t_index == 1
	if (t_index == 0) L = (t_amount*qp_cur*qp2)/(qp2 - qp_cur); // by t_index == 0
	log("Liquidity value: ", L.toFixed(4));

	//calc other amount
	if (t_index == 0) return L*(qp_cur-qp1); // calc amount for T1
	return L*(qp2 - qp_cur)/(qp_cur*qp2); // calc amount for T0
    }

*/

};

module.exports = {PoolObj};


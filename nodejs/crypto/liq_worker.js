

//классы для совершения операций с позициями пулов ликвидности

const m_base = require("./base.js");
const {space, log, curTime, varNumber} = require("./utils.js");
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
        constructor(w_obj, pool_addr)
        {
    	    log("Create LiqWorker: ");
    	    this.wallet = w_obj; //WalletObj instance
            this.pm_contract =  m_base.getPosManagerContract(this.wallet.pv);
	    this.pool = new m_pool.PoolObj(pool_addr);

        }
	//incorrect state object
	invalid()
	{
	    if (this.pool == undefined || this.pool == null) {log("ERROR: this.pool object is NULL"); return true;}
	    if (this.pm_contract == undefined || this.pm_contract == null) {log("ERROR: this.pm_contract object is NULL"); return true;}
	    if (this.wallet == undefined || this.wallet == null) {log("ERROR: this.wallet object is NULL"); return true;}
//	    if (!this.wallet.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return true;}
	    if (this.wallet.nativeDecimal() <= 0) {log("WARNING: wallet object is not loaded assets!!!"); return true;}
	    return false;
	}	
	//обновить данные пула
	async poolUpdate() 
	{
	    await this.pool.updateData(false); 
	    this.pool.out();
	}

/*
	//получить номера тиков для открытия позы по реальным значениям цен.
	//вернет объект с двумя полями tick1, tick2 (c учетом tickSpacing).
	//предварительно должна быть вызвана функция poolUpdate.
	calcTickRange(p1, p2)
	{
	    log("try get ticks range ......");
	    let result = {};
            let f_dec = 1;
            f_dec = 10 ** ((this.pool.T0.decimal - this.pool.T1.decimal));
            p1 /= f_dec; 
	    p2 /= f_dec;

	    result.tick1 = Math.floor(log(p1, 1.0001));
	    result.tick2 = Math.floor(log(p2, 1.0001));
	    return result;
	}
*/	

	//расчет долей активов для указания их в параметрах при чеканке новой позы.
	//вернет результат в виде объекта с сдвумя полями: t0_size, t1_size, а также еще добавит 2 значения - минимальные объемы t0_min, t1_min
	calcMintAmounts(ticks, liq)
	{
	    let result = {t0_size: -1, t1_size: -1};
	    if (ticks.tick1 >= ticks.tick2) {log("WARNING: invalid ticks values of POS_range!!!"); return result;}
//	    const bi_liq = ethers.utils.parseUnits(liq.toString(), this.wallet.nativeDecimal());
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
	getAmount0Mint(jsbi_p1, jsbi_p2, jsbi_liq)	
	{
    	    const d_price = JSBI.subtract(jsbi_p2, jsbi_p1);
	    const numerator1 = JSBI.leftShift(jsbi_liq, JSBI.BigInt(96));
	    const numerator2 = JSBI.multiply(numerator1, d_price);
	    return JSBI.divide(JSBI.divide(numerator2, jsbi_p2), jsbi_p1);
	}
	getAmount1Mint(jsbi_p1, jsbi_p2, jsbi_liq)	
	{
    	    const d_price = JSBI.subtract(jsbi_p2, jsbi_p1);
	    return JSBI.divide(JSBI.multiply(jsbi_liq, d_price), JSBI_Q96);
	}


	//////////////////////////////////////////////////////
	//чеканка новой позы, функция сначала обновит данные и состояние пула
	//p1, p2 - ценовой диапазон позы (реальные пользовательские значения)
	//pos_liq - общая ликвидность позы, двух активов в сумме, задается - как количество нативных токенов цени
	async tryMint(p1, p2, pos_liq)
	{
	    log("try mint new pos ............");
	    if (this.invalid()) return -1;
	    if (p1 <= 0 || p1 >= p2) {log("WARNING: invalid prices values of POS_range!!!"); return -1;}
	    if (pos_liq < 0.01) {log("WARNING: invalid liquidity value of POS!!!"); return -1;}
	
	    log("p1 =", p1, "  p2 =", p2);
	    log("liq =", pos_liq);
	    space();

	    try {await this.pool.updateData();}
	    catch(e) {log("ERROR:", e); return -2;}
	    space();
	    this.pool.showPrices();
	    log("current tick: ", this.pool.state.tick);
	    log("current sqrtPriceX96: ", this.pool.state.sqrtPrice, " / ", this.pool.state.sqrtPrice.toString());
	    space();

	    // init mint params
	    log("prepare mint params ........");
	    let mint_params = {token0: this.pool.T0.address, token1: this.pool.T1.address, fee: this.pool.fee};
	    const ticks = this.pool.calcTickRange(p1, p2);
	    log(`TICK_RANGE: [${ticks.tick1} : ${ticks.tick2}]`)
	    mint_params.tickLower = ticks.tick1;
	    mint_params.tickUpper = ticks.tick2;
	    const amounts = this.calcMintAmounts(ticks, pos_liq);
	    if (amounts.t0_size < 0 || amounts.t1_size < 0) return -3;
	    mint_params.amount0Desired = amounts.t0_size.toString();
	    mint_params.amount1Desired = amounts.t1_size.toString();
	    mint_params.amount0Min = amounts.t0_min.toString();
	    mint_params.amount1Min = amounts.t1_min.toString();
	    mint_params.recipient = this.wallet.address;
            mint_params.deadline = Math.floor(Date.now()/1000) + 120;
	    log("MINT_PARAMS:", mint_params);
	    space();

    	    //prepare fee params
    	    log("set FEE  params .....");
    	    let fee_params = {};
    	    this.wallet.gas.setFeeParams(fee_params);
    	    log("fee_params:", fee_params);
    	    space();
 
	    return true;


	}

};

module.exports = {LiqWorker};


//include modules
const {space, log, isInt, mergeJson, isJson, hasField, fileExist, charRepeat, removeField} = require("./../utils.js");
    
const { ContractObj } = require("./contract_class.js");
const { PoolObj } = require("./pool_class.js");
const { JSBIWorker } = require("./calc_class.js");


/*
const { DateTimeObj } = require("./../obj_dt.js");
const { TxGasObj } = require("./gas_class.js");
const { ChainObj } = require("./chain_class.js");
const { WalletObj } = require("./wallet_class.js");
        
//including
//const ethers = require("ethers");
*/        
        
const MAX_BIG128 = "1000000000000000000000000000";        
     
//класс для совершения транзакций связанных с позициями пулов (burn; mint; increase; decrease; collect; take_away;).
//предварительно требуется создать объект, передав в конструктор object Signer.
//затем установить параметры газа (метод setFeeParams()).
//для выполнения транзакции необходимо вызвать соответствующую функцию, передав ей объект json, (параметры TX),
//параметры должны содержать обязательные поля: deadline и is_simulate (true/false).
class PmTxObj
{
    constructor(wallet_obj)
    {
	this.encoder = ContractObj.posManagerEncodeIface(); // инициализируем интерфейс для кодирования функций PosManager
	this.pm_contract = ContractObj.getPosManagerContract(wallet_obj.signer); // инициализируем объект для отправки транзакций в сеть
	this.recipient = wallet_obj.address;
	this.fee_params = {};
	this.wallet = wallet_obj;
    }
    setFeeParams(fp) {this.fee_params = fp;}


    // increase liq to position
    /*
	struct IncreaseLiquidityParams {
    	    uint256 PID;
    	    uint256 amount0Desired;
    	    uint256 amount1Desired;
    	    uint256 amount0Min;
    	    uint256 amount1Min;
    	    uint256 deadline; }
    */
    async tryIncrease(params)
    {
        log("PmTxObj executing: TX_KIND = increase");
	log(params);

	return -151;
    }



    // mint new position, parameters:
    /*    
	struct MintParams {
    	    address token0;
    	    address token1;
    	    uint24 fee;
    	    int24 tickLower;
    	    int24 tickUpper;
    	    uint256 amount0Desired;
    	    uint256 amount1Desired;
    	    uint256 amount0Min;
    	    uint256 amount1Min;
    	    address recipient;  // my wallet.address
    	    uint256 deadline; }
    */
    async tryMint(params)
    {
	space();space();space();space();space();
        log("PmTxObj executing: TX_KIND = mint");
	log("PARAMS:", params); space();

	//STAGE_1: update pool state
	let pool_obj = new PoolObj(params.pool_address);
	pool_obj.fee = params.fee;
	pool_obj.updateToken0(this.wallet.findAsset(params.token0_address));
	pool_obj.updateToken1(this.wallet.findAsset(params.token1_address));
	pool_obj.outShort();
	if (pool_obj.invalid()) {req_result.error="invalid pool object"; return -157;}
	space();
	await pool_obj.updateState();
	pool_obj.outState();
	if (pool_obj.invalidState()) {req_result.error="invalid state pool object"; return -158;}
        space();

	//STAGE_2: calculation params
	//calc tick range
	const p1 = Number.parseFloat(params.p1);
	const p2 = Number.parseFloat(params.p2);
	const tick_range = pool_obj.calcTickRangeByPrices(p1, p2);
	log("tick_range: ", tick_range);
	//calc assets amounts of liq pos
	const user_sizes = {size0: Number.parseFloat(params.token0_amount), size1: Number.parseFloat(params.token1_amount)};
	const amounts = pool_obj.calcMintAmountsByTickRange(user_sizes, tick_range);
	log("amount0: ", amounts.amount0.toString());
	log("amount1: ", amounts.amount1.toString());
	// calc min assets amounts
	const f = 0.9985;
	var amount0_min = JSBIWorker.biZero();
	if (amounts.amount0 != JSBIWorker.biZero()) amount0_min = JSBIWorker.biMulFloat(amounts.amount0, f);
	var amount1_min = JSBIWorker.biZero();
	if (amounts.amount1 != JSBIWorker.biZero()) amount1_min = JSBIWorker.biMulFloat(amounts.amount1, f);

        //STAGE_3: prepare ehters mint params                
        let mint_params = {token0: params.token0_address, token1: params.token1_address};
	mint_params.fee = Number.parseInt(params.fee);
	mint_params.tickLower = tick_range.tick1;
	mint_params.tickUpper = tick_range.tick2;
	mint_params.amount0Desired = amounts.amount0.toString();
	mint_params.amount1Desired = amounts.amount1.toString();
	mint_params.amount0Min = amount0_min.toString();
	mint_params.amount1Min = amount1_min.toString();
        mint_params.recipient = this.recipient;
        mint_params.deadline = params.deadline;
	log("MINT_PARAMS:", mint_params);

	//STAGE_4 prepare result
	let tx_reply = {tick1: tick_range.tick1.toString(), tick2: tick_range.tick2.toString()};
	tx_reply.p1 = pool_obj.priceByTick(tick_range.tick1).toString();
	tx_reply.p2 = pool_obj.priceByTick(tick_range.tick2).toString();
	tx_reply.amount0 = JSBIWorker.weisToFloat(amounts.amount0, pool_obj.token0.decimal).toString();
	tx_reply.amount1 = JSBIWorker.weisToFloat(amounts.amount1, pool_obj.token1.decimal).toString();
	tx_reply.pool_tick = pool_obj.state.tick.toString();
	tx_reply.pool_price = pool_obj.state.price0.toString();


        //STAGE_5: send MINT TX                
        try 
	{ 
    	    if (params.is_simulate) 
	    {
		const estimated_gas = await this.pm_contract.estimateGas.mint(mint_params);		
		tx_reply.estimated_gas = estimated_gas.toString();
	    }
    	    else 
	    {
		const tx_reply_chain = await this.pm_contract.mint(mint_params, this.fee_params);
		tx_reply.hash = tx_reply_chain.hash;
	    }
    	    return tx_reply;
	}
        catch(e) {log("ERROR:", e); return -155;}
		
	return -159;
    }
    

    // полный забор ликвидности и rewards у выбранной позиции на кошелек
    async tryTakeaway(params)
    {
	//space();space();space();space();space();
        log("PmTxObj executing: TX_KIND = take_away");
	log("INPUT+PARAMS:", params); space();
        //prepare ehters decrease params                
        let decrease_params = {tokenId: params.pid, liquidity: params.liq, deadline: params.deadline};
	decrease_params.amount0Min = 0;
	decrease_params.amount1Min = 0;
        log("DECREASE_PARAMS:", decrease_params);
        space();
        //prepare ehters collect params                
        let collect_params = {tokenId: params.pid, deadline: params.deadline};
        collect_params.recipient = this.recipient;
        collect_params.amount0Max = MAX_BIG128;
        collect_params.amount1Max = MAX_BIG128;
        log("COLLECT_PARAMS:", collect_params);
        space();
	//  prepare multi_data
	const multi_data = [];
	multi_data.push(this.encoder.encodeFunctionData("decreaseLiquidity", [decrease_params]));
	multi_data.push(this.encoder.encodeFunctionData("collect", [collect_params]));
	log("multicall_data: ", multi_data);	    
	space();

	//send multicast TX
        try 
	{ 
    	    let tx_reply = null;
    	    if (params.is_simulate) tx_reply = await this.pm_contract.estimateGas.multicall(multi_data);
    	    else tx_reply = await this.pm_contract.multicall(multi_data, this.fee_params);
    	    return tx_reply;
	}
        catch(e) {log("ERROR:", e); return -161;}

	return -163;
    }


    // удаление ликвидности у выбранной позиции (перенос в зону reward)
    /*
    struct DecreaseLiquidityParams {
        uint256 PID;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;  }
    */
    async tryDecrease(params)
    {
        log("PmTxObj executing: TX_KIND = decrease");
	log(params);

        //prepare ehters decrease params                
        let decrease_params = {tokenId: params.pid, liquidity: params.liq, deadline: params.deadline};
	decrease_params.amount0Min = 0;
	decrease_params.amount1Min = 0;
        log("DECREASE_PARAMS:", decrease_params);
        space();

	//send simple TX
        try 
	{ 
    	    let tx_reply = null;
    	    if (params.is_simulate) tx_reply = await this.pm_contract.estimateGas.decreaseLiquidity(decrease_params);
    	    else tx_reply = await this.pm_contract.decreaseLiquidity(decrease_params, this.fee_params);
    	    return tx_reply;
	}
        catch(e) {log("ERROR:", e); return -168;}

	return -169;
    }


    // сбор комиссий у выбранной позиции
    /*
     struct CollectParams {
        uint256 PID;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;  }
    */
    async tryCollect(params)
    {
        log("PmTxObj executing: TX_KIND = collect");
	log(params);

        //prepare ehters collect params                
        let collect_params = {tokenId: params.pid, deadline: params.deadline};
        collect_params.recipient = this.recipient;
        collect_params.amount0Max = MAX_BIG128;
        collect_params.amount1Max = MAX_BIG128;
        log("COLLECT_PARAMS:", collect_params);
        space();

	//send simple TX
        try 
	{ 
    	    let tx_reply = null;
    	    if (params.is_simulate) tx_reply = await this.pm_contract.estimateGas.collect(collect_params);
    	    else tx_reply = await this.pm_contract.collect(collect_params, this.fee_params);
    	    return tx_reply;
	}
        catch(e) {log("ERROR:", e); return -188;}

	return -189;
    }


    // сжигание одной или несколько позиций (без ликвидности)
    async tryBurn(params)
    {
        log("PmTxObj executing: TX_KIND = burn");
	if (hasField(params, "pid_arr")) // need multicast
	{
	    log("detect field - pid_arr:", params.pid_arr); 
	    //  prepare multi_data
	    const multi_data = [];
	    for (const pid of params.pid_arr) 
	    {
		log("encode PID ", pid);
		const encoded = this.encoder.encodeFunctionData("burn", [pid]);
		multi_data.push(encoded);
	    }
	    log("multicall_data: ", multi_data);	    
	    space();

	    //send multi TX
	    let tx_reply = null;
	    if (params.is_simulate) 
	    {
    		log("simulate mode");
		try {tx_reply = await this.pm_contract.estimateGas.multicall(multi_data);}
		catch(e) {log("ERROR:", e); return -171;}
	    }
	    else 
	    {
		log("REAL_TX");
		try {tx_reply = await this.pm_contract.multicall(multi_data, this.fee_params);}
		catch(e) {log("ERROR:", e); return -172;}
	    }
	    return tx_reply;
	}
	else if (hasField(params, "pid")) // simple tx
	{
	    log("SIMPLE_BURN_TX");
            try 
	    { 
        	let tx_reply = null;
        	if (params.is_simulate) tx_reply = await this.pm_contract.estimateGas.burn(params.pid);
        	else tx_reply = await this.pm_contract.burn(params.pid, this.fee_params);
        	return tx_reply;
	    }
            catch(e) {log("ERROR:", e); return -173;}
	}
	else log("WARNING: invalid burn params:");
	return -179;
    }

};

module.exports = {PmTxObj};



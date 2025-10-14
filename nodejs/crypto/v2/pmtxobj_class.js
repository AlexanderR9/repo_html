//include modules
const {space, log, isInt, mergeJson, isJson, hasField, fileExist, charRepeat, removeField} = require("./../utils.js");
    
const { ContractObj } = require("./contract_class.js");


/*
const { DateTimeObj } = require("./../obj_dt.js");
const { TxGasObj } = require("./gas_class.js");
const { ChainObj } = require("./chain_class.js");
const { WalletObj } = require("./wallet_class.js");
const { JSBIWorker } = require("./calc_class.js");
        
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
    }
    setFeeParams(fp) {this.fee_params = fp;}

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



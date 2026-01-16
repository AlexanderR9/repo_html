
const {space, log, isFloat, jsonFromFile, hasField, varNumber} = require("./../utils.js");
const { ChainObj } = require("./chain_class.js");
const { JSBIWorker } = require("./calc_class.js");


// define user const
const MIN_GAS_LIMIT = 85000; // единиц газа за транзакцию
const MIN_FEE_PRIORITY = 130; // пожертвование за приоритет, gwei   
const MIN_GAS_PRICE = 0.07; // цена одной единицы газа, gweis

// for layer-2 chains
const MAX_FEE_ARBITRUM = 0.022; // max цена одной единицы газа для сети arbitrum, gwei   
const MAX_FEE_OPTIMISM = 0.00002; // max цена одной единицы газа для сети optimism, gwei   


// класс для утановки параметров газа при совершении любой транзакции.
// параметры газа принимают разную комбинацию полей взависимости от сети.
class TxGasObj
{
    //настройки по умолчанию: установлены  минимальные значения, но этого хватает чтобы например сделать approve or wrap/unwrap
    constructor()
    {	
	//максимально количество единиц газа за транзакцию, которое мы готовы потратить.
	//это поле присутствует для всех сетей в параметрах газа.
        this.gas_limit = MIN_GAS_LIMIT; 

	// эти поля участвуют при сети polygon
        this.max_fee = -1; //максимальная цена за единицу газа, в gweis
        this.priority = MIN_FEE_PRIORITY; //пожертвование за приоритет, gwei  
        
        //дополнительное поле, используется при сети BNB в паре с gas_limit
        this.gas_price = MIN_GAS_PRICE; // цена единицы газа, gweis

	// универсальный паарметр для всех сетей, получаемы из файла входных параметров транзакции (json)
	this.gas_price_external = -1; // цена единицы газа, gweis 
    }
    setPriceExternal(egp)
    {
	if (varNumber(egp))
	{    
    	    this.gas_price_external = Number.parseFloat(egp);
	    log("was set up PriceExternal, ", this.gas_price_external.toString());
	}
	else log("WARNING PriceExternal is not float");
    }


    //установить в объект транзакции текущие значения комиссий
    setFeeParams(txp)
    {
        txp.gasLimit = this.gas_limit;   // этот параметр участвует для всех сетей
	if (this.gas_price_external > 0) {this._setFeeParamsByExternal(txp); return;}
              
        if (ChainObj.isPolygonChain())
        {
	    const maxf = ((this.max_fee > 0) ? this.max_fee : this.priority*2);
            txp.maxFeePerGas = JSBIWorker.floatToWeis(maxf, 9).toString();
            txp.maxPriorityFeePerGas = JSBIWorker.floatToWeis(this.priority, 9).toString();
        }
        else if (ChainObj.isBnbChain())
        {
            txp.gasPrice = JSBIWorker.floatToWeis(this.gas_price, 9).toString();
        }
        else if (ChainObj.isArbitrumChain())
        {
	    this.max_fee =  MAX_FEE_ARBITRUM;
	    txp.maxFeePerGas = JSBIWorker.floatToWeis(this.max_fee, 9).toString();
	    txp.maxPriorityFeePerGas = "0";
        }
        else if (ChainObj.isOptimismChain())
        {
	    this.max_fee = MAX_FEE_OPTIMISM;
	    txp.maxFeePerGas = JSBIWorker.floatToWeis(this.max_fee, 9).toString();
	    txp.maxPriorityFeePerGas = JSBIWorker.floatToWeis((this.max_fee/2), 9).toString();
        }
    }
    _setFeeParamsByExternal(txp)
    {
	log("GAS_OBJ: execute _setFeeParamsByExternal(),  gas_price_external =", this.gas_price_external.toString());
        if (ChainObj.isPolygonChain())
        {
            txp.maxFeePerGas = JSBIWorker.floatToWeis(this.gas_price_external, 9).toString();
            txp.maxPriorityFeePerGas = JSBIWorker.floatToWeis(this.gas_price_external*0.2, 9).toString();
        }
        else if (ChainObj.isBnbChain())
        {
            txp.gasPrice = JSBIWorker.floatToWeis(this.gas_price_external, 9).toString();
        }
        else if (ChainObj.isArbitrumChain())
        {
	    txp.maxFeePerGas = JSBIWorker.floatToWeis(this.gas_price_external, 9).toString();
	    txp.maxPriorityFeePerGas = "0";
        }
        else if (ChainObj.isOptimismChain())
        {
	    txp.maxFeePerGas = JSBIWorker.floatToWeis(this.gas_price_external, 9).toString();
	    txp.maxPriorityFeePerGas = JSBIWorker.floatToWeis((this.gas_price_external/2), 9).toString();
        }
    }
    

    // сброс всех полей в дефолтное состояние
    reset()
    {
        this.gas_limit = MIN_GAS_LIMIT; 
        this.max_fee = -1;
        this.priority = MIN_FEE_PRIORITY;
        this.gas_price = MIN_GAS_PRICE;
    }
    //установить параметры газа взависимости от типа транзакции
    setKindFactor(tx_kind)
    {
	this.reset();
	if (tx_kind == "swap")
	{
	    this.gas_limit = Math.floor(2.8*this.gas_limit);
	}
	else if (tx_kind == "burn")
	{
	    this.gas_limit = Math.floor(4.7*this.gas_limit);
	}
	else if (tx_kind == "mint")
	{
	    this.gas_limit = Math.floor(8.5*this.gas_limit);
	}
	else if (tx_kind == "collect" || tx_kind == "decrease")
	{
	    this.gas_limit = Math.floor(3.5*this.gas_limit);
	}
	else if (tx_kind == "take_away" || tx_kind == "increase")
	{
	    this.gas_limit = Math.floor(5.8*this.gas_limit);
	}

    }

}


module.exports = {TxGasObj};



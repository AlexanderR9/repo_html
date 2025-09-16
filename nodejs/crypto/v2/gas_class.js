
const {space, log, jsonFromFile, hasField} = require("./../utils.js");
const { ChainObj } = require("./chain_class.js");
const { JSBIWorker } = require("./calc_class.js");


// класс для утановки параметров газа при совершении любой транзакции.
// параметры газа принимают разную комбинацию полей взависимости от сети.
class TxGasObj
{
    //настройки по умолчанию: установлены  минимальные значения, но этого хватает чтобы например сделать approve or wrap/unwrap
    constructor()
    {	
	//максимально количество единиц газа за транзакцию, которое мы готовы потратить.
	//это поле присутствует для всех сетей в параметрах газа.
        this.gas_limit = 95000; 

	// эти поля участвуют при сети polygon
        this.max_fee = -1; //максимальная цена за единицу газа, в gweis
        this.priority = 45; //пожертвование за приоритет, gwei  
        
        //дополнительное поле, используется при сети BNB в паре с gas_limit
        this.gas_price = 0.12; // цена единицы газа, gweis
    }
    update(g, m, p = -1, gp = -1)
    {
        this.gas_limit = g;
        this.max_fee = m;
        if (p > 0) this.priority = p;
        if (gp > 0) this.gas_price = gp;
    }
    //установить в объект транзакции текущие значения комиссий
    setFeeParams(txp)
    {
        txp.gasLimit = this.gas_limit;                
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
    }


}


module.exports = {TxGasObj};



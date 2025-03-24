const {space, log, curTime, varNumber, charRepeat} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData, balanceAt} = require("./asyncbase.js");
const m_wallet = require("./obj_wallet.js");
const m_pool = require("./obj_pool.js");
const {TxWorkerObj} = require("./obj_txworker.js");


//класс для совершения обмена токенов в кошельке, используя пулы
class SwapperObj
{
    //передать объект WalletObj, активы которого будут меняться друг на друга.
    constructor(w_obj, p_addr = "")
    {
        log("Create swapper object: ");
	this.wallet = w_obj; //WalletObj instance
	this.router_contract = m_base.getRouterContract(this.wallet.pv); //swap router contract object
	this.quoter_contract = m_base.getQuoterContract(this.wallet.pv); //quoter contract object
	this.pool_addr = p_addr; //current pool address
	log("ROUTER_CONTRACT: ", this.router_contract.address); 
	log("QOUTER_CONTRACT: ", this.quoter_contract.address); 

        this.tx_worker = null; //объект для отправки подготовленных транзакций в сеть
        if (w_obj.isSigner()) this.tx_worker = new TxWorkerObj(w_obj);


        //признак того что все опрерации будутвыполняться в режиме эмуляции (поумолчанию режим включен), 
        // т.е. когда будет доходить дело в отправки реальной транзакции будет происходить выход из функции.
        //для вкл/откл режма надо выполнить функцию setSimulateMode
        this.simulate_mode = true;
    }
    setPoolAddr(p_addr) {this.pool_addr = p_addr;}
    setSimulateMode(m) {this.simulate_mode = m;} //set simulate_mode value


    //возвращает предполагаемую сумму обмена выходного токена при заданных входных параметра.
    //функция только проводит предварительный расчет, никаких изменений не вносит.	
    //sum_in - сумма выделенная на обмен входного токена.
    //input_t - индекс входного токена в паре пула, может принимать значения 0 и 1, поумолчанию 0 .
    //this.pool_addr предварительно уже должен быть установлен.
    async tokenSizeBySwapping(sum_in, input_t = 0) //getting out_sum(t1) by in_sum(t0) from object quotesContract
    {
	log("Try calc out token by swap ...");
	if (this.pool_addr.length < 10) {log("WARNING: invalid pool_address:", this.pool_addr); return -1;}
        if (!varNumber(sum_in))  {log("WARNING: input SUM is not number_value, sum: ", sum_in); return -1;}
        if (sum_in < 0.01 || sum_in > 100000)  {log("WARNING: input SUM is not correct, sum:", sum_in); return -1;}


	log(curTime(), "try get pool data", ".....");
	log("POOL ADDRESS:", this.pool_addr);
	const pool = m_base.getPoolContract(this.pool_addr, this.wallet.pv);
	const p_data = await poolData(pool);
        log("INFO: ", p_data);
        space();

	log("get tokens data .....");
	const t0 = await this.wallet.findAsset(p_data.t0_addr);
	//log("T0:", t0);
	const t1 = await this.wallet.findAsset(p_data.t1_addr);
	//log("T1:", t1);
	if (t0.decimal <= 0 || t1.decimal <= 0) {log("WARNING: can't token data on wallet"); return -1;}

	
        const t_in = ((input_t == 0) ? t0 : t1);
        const t_out = ((input_t == 1) ? t0 : t1);
	let s = "Conditional: " + " TOKEN_IN T" + input_t + "=" + t_in.ticker + "; SUM_IN=" + sum_in;
	s += "; TOKEN_OUT=" + t_out.ticker;
	log(s);
	space();

	log("prepare sum ...")
        const bi_sum = m_base.fromReadableAmount(sum_in, t_in.decimal).toString();
        log("input sum ", sum_in, " | BIG: ", bi_sum);       
	space();

	//calc
	log("calculation ......");
        const bi_sum_out = await this.quoter_contract.callStatic.quoteExactInputSingle(t_in.addr, t_out.addr, p_data.fee, bi_sum, 0);
	const sum_out = m_base.toReadableAmount(bi_sum_out, t_out.decimal);
        log("output sum ", sum_out, " | BIG: ", bi_sum_out);       	
	return sum_out;
    }

        /////////////////////////////TRANSACTIONS FUNCS//////////////////////////////////////////
 	
    //функция меняет в кошельке один токен на другой используя пул this.pool_addr.	
    //sum_in - сумма выделенная на обмен входного токена.
    //input_t - индекс входного токена в паре пула, может принимать значения 0 и 1, поумолчанию 0 .
    //this.pool_addr предварительно уже должен быть установлен.
    async trySwap(sum_in, input_t = 0, dead_line = 120) //dead_line - seconds unit
    {
	log("try swap .........");
	if (this.pool_addr.length < 10) {log("WARNING: invalid pool_address:", this.pool_addr); return -1;}
        if (!this.wallet.isSigner()) {log("WARNING: wallet object is not SIGNER!!!"); return -1;}
        if (!varNumber(sum_in))  {log("WARNING: swapping SUM is not number_value, sum: ", sum_in); return -2;}
        if (sum_in < 0.01 || sum_in > 100000)  {log("WARNING: input SUM is not correct, sum:", sum_in); return -1;}

	//get pool data
	log(curTime(), "try get pool data", ".....");
	log("POOL ADDRESS:", this.pool_addr);
	let p_obj = new m_pool.PoolObj(this.pool_addr);
	try 
	{
	    await p_obj.updateData(); 
	    //p_obj.out(); 
	    p_obj.showPrices();
	}
	catch(e) {log("ERROR:", e); return -3;}

	//get pool tokens data
	log("get tokens data .....");
	const t0 = await this.wallet.findAsset(p_obj.T0.address);
	const t1 = await this.wallet.findAsset(p_obj.T1.address);
	if (t0.decimal <= 0 || t1.decimal <= 0) {log("WARNING: can't token data on wallet"); return -1;}	
        const t_in = ((input_t == 0) ? t0 : t1);
        const t_out = ((input_t == 1) ? t0 : t1);
	let s = "Conditional: " + " TOKEN_IN T" + input_t + "=" + t_in.ticker + "; SUM_IN=" + sum_in;
	s += "; TOKEN_OUT=" + t_out.ticker + ";  dead_line " + dead_line + " secs";
	log(s);
	space();

	p_obj.tokenSizeBySwapping(sum_in, input_t, false);
	log(charRepeat("-", 50));
	space();

	log("prepare sum ...")
        const bi_sum = m_base.fromReadableAmount(sum_in, t_in.decimal);
        log("input sum ", sum_in, " | BIG: ", bi_sum.toString());       
	space();

/*
	//prepare TX params
        log("set TX option params .....");
        let tx_params = {};
        this.wallet.gas.setFeeParams(tx_params);
        const tx_count = await this.wallet.txCount();
        log("tx_count:", tx_count);
        tx_params.nonce = tx_count;
        log("tx_params:", tx_params);
        space();

*/

        //prpare swap params
        const swap_params = {tx_kind: "swap", tokenIn: t_in.addr, tokenOut: t_out.addr, fee: p_obj.fee};
        swap_params.recipient = this.wallet.address;
        swap_params.deadline = Math.floor(Date.now()/1000) + dead_line;
        swap_params.amountIn = bi_sum;
        swap_params.amountOutMinimum = 0;
        swap_params.sqrtPriceLimitX96 = 0;
        log("SWAP PARAMS:", swap_params);
        space();

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

        /////////////////////SEND TX///////////////////////////////////
        const result = await this.tx_worker.sendTx(swap_params);
        return result;



/*


        log("try swap ......");
       ////////////////TX///////////////
        const router_conn = this.router_contract.connect(this.wallet.signer);
        log("send transaction ....");
        try
        {
    	    const tx = await router_conn.exactInputSingle(swap_params, tx_params);
            log("TX:", tx);
        }
        catch(e) {log("ERROR:", e); return -5;}
        return true;
*/
    }
        
};


module.exports = {SwapperObj};

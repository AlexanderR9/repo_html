
//desc of script
//getting poolData by pool address, then getting quotes(cur price) token0/token1

//including
const m_const = require("./const.js");
const ethers = require("ethers");
const m_base = require("./base.js");
const JSBI =  require("jsbi");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {tokenData, poolData, poolState, chainInfo, txCount} = require("./asyncbase.js");


//const { Token, CurrencyAmount, TradeType } = require("@uniswap/sdk-core");
//const { Pool, Route, SwapQuoter, Trade } = require("@uniswap/v3-sdk");
//const {AlphaRouter, ChainId} = require("@uniswap/smart-order-router");
//const {AlphaRouter} = require("@uniswap/smart-order-router");


//const vars
//const IExact = TradeType.EXACT_INPUT;

const POOL_ADDR = m_const.POOL_WMATIC_USDC;
const INPUT_SUM = 1.2; // T0

const GAS_LIMIT = 265000; //единиц газа за транзакцию
const MAX_FEE = 420;  //Gweis
const PRIOR_FEE = 80;  //Gweis



//proj func
function setFeeParams(txp)
{
        txp.gasLimit = GAS_LIMIT;
        txp.maxFeePerGas = m_base.toGwei(MAX_FEE);
        txp.maxPriorityFeePerGas = m_base.toGwei(PRIOR_FEE);
}
async function main(pool_obj, w_obj)
{
	//get pool data/state
	log("get pool params ...");	
	const p_immutables = await poolData(pool_obj)
	log(p_immutables);
	space();
	log("get pool state ...");	
	const p_state = await poolState(pool_obj)
	log(p_state);
	space();

	//get input token properties
	const t0_obj = m_base.getTokenContract(p_immutables.t0_addr, w_obj);
	log("get token params ..........")
	const t_data = 	await tokenData(t0_obj.address, w_obj.provider);
	log(t_data);
	space();

	//prepare sum
	const sr_obj = m_base.getRouterContract(w_obj.provider);
	log("swapRouterContract: ", sr_obj.address);
	log("Token0 ", t_data.ticker, ", input sum: ", INPUT_SUM);
        const bi_sum = m_base.fromReadableAmount(INPUT_SUM, t_data.decimal);
	log("BI sum format (T0): ", bi_sum, " | ", bi_sum.toString());
  	space();	


        log("set option params .....");
        let tx_fee_params = {};
        setFeeParams(tx_fee_params);
        const tx_count = await txCount(w_obj);
        log("tx_count:", tx_count);
        tx_fee_params.nonce = tx_count;
        log("tx_fee_params:", tx_fee_params);
        space();
 

	//return;
	///////////////////////////////TX//////////////////////////////////////////

	//prpare swap params
	const swap_params = {tokenIn: p_immutables.t0_addr, tokenOut: p_immutables.t1_addr, fee: p_immutables.fee};
	swap_params.recipient = w_obj.address;
	swap_params.deadline = Math.floor(Date.now()/1000) + 120;
	swap_params.amountIn = bi_sum;
	swap_params.amountOutMinimum = 0;
	swap_params.sqrtPriceLimitX96 = 0;
	log("SWAP PARAMS:", swap_params);
	space();

	
	log("try swap ......");
	const router = sr_obj.connect(w_obj);
	const tx = await router.exactInputSingle(swap_params, tx_fee_params);
	log(tx);

/*

  log("set swap sum ...");
  let swap_sum = 0.6; //usdt
  const in_sum = m_base.fromReadableAmount(swap_sum, 6);
  log("swap_sum =", swap_sum, "  in format: ", in_sum);	

  //connet token1 to wallet
  space();	
  log("connect token1 contract to wallet ...");
  const t1_obj = m_base.getTokenContract(immutables.t1_addr, w_obj.provider);  	
  const t1_connected = await t1_obj.connect(w_obj);
  log("connected!");	
  
	
  //stage APPROVE
  space();	
  const approvalAmount = (in_sum * 2).toString();
  log("approvalAmount: ", approvalAmount);
  log("check allowance .....");
  log("wallet:", w_obj.address, "TO", "swapRouterContract:", swapRouterContract.address)
  const alw = await t1_connected.allowance(w_obj.address, swapRouterContract.address);
  log("allowance NOW: ", alw, " | ", m_base.toReadableAmount(alw, 6));
  
  
  log("try approve .....");
  const approvalResponse = await t1_connected.approve(swapRouterContract.address, approvalAmount);
  log("approvalResponse:", approvalResponse);	 
  space();	
  log("start wait ....");	 
  const result = await approvalResponse.wait();
  log("result: ", result);	 
  */  

}


// body
const pv = m_base.getProvider();
log("---------------------------------");
log("TRY SWAP OPERATION, POOL: ", POOL_ADDR);
const wallet = m_base.getWallet(process.env.WKEY, pv);
const pool = m_base.getPoolContract(POOL_ADDR, pv);

//start
main(pool, wallet);


//const router = getRouterObj(pv);

//let sum_in = 0.8422;
//const rawTokenAmountIn = JSBI_fromReadableAmount(sum_in, 6);
//log("sum_in: ", sum_in.toString(), "   rawTokenAmountIn =", rawTokenAmountIn, "countDecimals: ", countDecimals(0.12).toString());


//const t_in = new Token(m_const.CHAIN_ID, m_const.USDT_ADDR, 6, 'USDT');
//log("TOKEN_IN:", t_in);
//const t_out = new Token(CHAIN_ID, m_const.USDC_ADDR, 6, 'USDC');
//const cur_a = CurrencyAmount.fromRawAmount(t_in, sum_in);
//const b_in = m_base.toBig(sum_in);
//log("sum_in: ", sum_in.toString(), "cur_a:", cur_a, "   b_in =", b_in);
//log("sum_in: ", sum_in.toString(), "   b_in =", b_in);
//log("sum_in: ", sum_in);


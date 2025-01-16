
//desc of script
//getting poolData by pool address, then getting quotes(cur price) token0/token1

//including
const m_const = require("./const.js");
const ethers = require("ethers");
const m_base = require("./base.js");
const JSBI =  require("jsbi");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {balance, balanceAt, feeGas, poolData, poolState, chainInfo} = require("./asyncbase.js");


const { Token, CurrencyAmount, TradeType } = require("@uniswap/sdk-core");
const { Pool, Route, SwapQuoter, Trade } = require("@uniswap/v3-sdk");
//const {AlphaRouter, ChainId} = require("@uniswap/smart-order-router");
//const {AlphaRouter} = require("@uniswap/smart-order-router");


//const vars
const IExact = TradeType.EXACT_INPUT;

//test debug
log("chain_id:", m_const.CHAIN_ID);
log("INFURA RPC_URL:", process.env.RPC_URL );
log("WALLET ADDRESS:", process.env.WA2 );
log("FACTORY ADDRESS:", m_const.FACTORY_CONTRACT_ADDRESS);
log("QUOTER_CONTRACT_ADDRESS:", m_const.QUOTER_CONTRACT_ADDRESS);
log(`NATIVE_TOKEN (${m_const.CHAIN_TOKEN})`);
log(curTime());


//proj func
async function getPoolQuote(qc, pool_data, sum_in, dec_in, dec_out) //getting out_sum(t1) by in_sum(t0) from object quotesContract
{
	const t0 = pool_data.token0;
	const t1 = pool_data.token1;
	const fee = pool_data.fee;
	const sum = m_base.fromReadableAmount(sum_in, dec_in).toString();
	const quotedAmountOut = await qc.callStatic.quoteExactInputSingle(t0, t1, fee, sum, 0);
	return m_base.toReadableAmount(quotedAmountOut, dec_out);
}

//возвращает в 16-ном формате сумму на выходе 2-го токена при обмене в заданном пуле
async function getOutputQuote(provider, router, t_in) 
{
	const sum_in = m_base.fromReadableAmount(0.5, 6).toString();
	const cur_a = CurrencyAmount.fromRawAmount(t_in, sum_in);
	const { calldata } = await SwapQuoter.quoteCallParameters(router, cur_a, IExact,  {useQuoterV2: true});
	const q_param = {to: m_const.QUOTER_CONTRACT_ADDRESS_T, data: calldata};
 	const quoteCallReturnData = await provider.call(q_param);
  	return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData);
}
async function getTokenTransferApproval(provider, t_in)
{
	try 
	{
		const taa = fromReadableAmount(2.2, 6).toString();
    		const tokenContract = new ethers.Contract(t_in.address,  ERC20_ABI, provider);
    		const transaction = await tokenContract.populateTransaction.approve(SWAP_ROUTER_ADDRESS, taa);

		const send_p = {...transaction, from: process.env.WA2};
    		return sendTransaction(send_p);
  	} 
	catch (e) 
	{
    		console.error(e)
    		return "Failed";
  	}
}
async function txCount(w)
{
	log("TRY GET Tx COUNT ....");
	const result = await w.getTransactionCount();
	return result;
}
async function sendToken(w, to_addr)
{
	log("TRY TRANSFER NATIVE TOKEN");
	const sum = 0.2;
	const a = m_base.fromReadableAmount(sum);
	log("send token ....");
	log("sum: ", sum, "|", a);
	const params = {to: to_addr, value: a};

//	const e_gas = await w.estimateGas(params);
//	log("estimateGas: ", e_gas, m_base.hexToGwei(e_gas));
//	let p_gas = 100*m_base.hexToGwei(e_gas);
	let gas_lim = 200000;
	params.gasLimit = gas_lim;
//	params.gasLimit = ethers.utils.hexlify(gas_lim);
//  rams.gasPrice = 60;
//	params.deadLine = Math.floor(Date.now()/1000) + 90;
//	params.gasLimit = m_base.fromReadableAmount(gas_lim);
//deadline : Date.now() + 1000 * 60 * 3 //3 minutes
	log("tx_params:", params);

	log("transaction ....");
	const tx = await w.sendTransaction(params);
//	log(tx);	
	log("2. tx prepared, feegas ", m_base.toReadableAmount(tx.maxPriorityFeePerGas));
//	const result = await tx.wait();
	return tx;
}
async function send_usdt(w_obj, to_addr)
{
	log("TRY TRANSFER USDT TOKEN");
	const sum = 0.5;
	const amount = m_base.fromReadableAmount(sum, 6);
	log("send USDT  ....");
	log("sum: ", sum, "|", amount);


        const t_obj = m_base.getTokenContract(m_const.USDT_ADDR, w_obj);
	const t_signer = t_obj.connect(w_obj);
	const result = await t_signer.transfer(to_addr, amount);

/*
        const t_obj = m_base.getTokenContract(m_const.USDT_ADDR, w_obj);
 	const params = t_obj.interface.encodeFunctionData("transfer", [to_addr, amount]);

	const v = ethers.utils.parseUnits("0.000", "ether");
	const tx_params = {to: m_const.USDT_ADDR, from: w_obj.address, value: v, data: params};
	log("Send transaction...");
	const tx = await w_obj.sendTransaction(tx_params);
	log("Mining transaction...");
	const result = await tx.wait();
*/


	return result;

}
function f()
{

}
// body
const pv = m_base.getProvider();
log("provider info:", pv.connection);
//chainInfo(pv).then((data) => log("CHAIN:", data));
log("---------------------------------");

//log(curTime(), "try get pool data", ".....");
//log("POOL ADDRESS:", m_const.POOL_WMATIC_USDC);
//const poolContract = m_base.getPoolContract(m_const.POOL_WMATIC_USDC, pv);
//poolData(poolContract).then((data) => printPoolData(data));
//poolState(poolContract).then((data) => log("STATE:", data));



//get wallet object
const wallet = m_base.getWallet(process.env.WKEY, pv);
sendToken(wallet, process.env.WA1).then((data) => log(data));
//send_usdt(wallet, process.env.WA1).then((data) => log(data));

//await pv.getSigner().then((data) => log(data));
//txCount(wallet).then((data) => log(data));


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


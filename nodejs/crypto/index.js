
//test script

//including
//const ethers = require("ethers");
const m_base = require("./base.js");
const m_pool = require("./pool.js");
const m_wallet = require("./wallet.js");
const m_posManager = require("./posmanager.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");


//const { Token, CurrencyAmount, TradeType } = require("@uniswap/sdk-core");
//const { Pool, Route, SwapQuoter, Trade } = require("@uniswap/v3-sdk");
//const {AlphaRouter, ChainId} = require("@uniswap/smart-order-router");
//const {AlphaRouter} = require("@uniswap/smart-order-router");


//const vars
//const IExact = TradeType.EXACT_INPUT;

//test debug
//log("chain_id:", m_const.CHAIN_ID);
log("INFURA RPC_URL:", m_base.RPC_URL() );
log("Current chain:", m_base.currentChain());
log(`NATIVE_TOKEN (${m_base.nativeToken()})`);
log(curTime());


//proj func

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

// body
//const pv = m_base.getProvider();
//log("provider info:", pv.connection);
//chainInfo(pv).then((data) => log("CHAIN:", data));
log("---------------------------------");

//POOL DATA
//let p_obj = new m_pool.PoolObj("0x167384319b41f7094e62f7506409eb38079abff8"); // WMATIC / WETH 
//let p_obj = new m_pool.PoolObj("0xdac8a8e6dbf8c690ec6815e0ff03491b2770255d"); // USDC/USDT 
//let p_obj = new m_pool.PoolObj("0x2aceda63b5e958c45bd27d916ba701bc1dc08f7a");
//let p_obj = new m_pool.PoolObj("0x0a28c2f5e0e8463e047c203f00f649812ae67e4f");
//let p_obj = new m_pool.PoolObj("0x2db87c4831b2fec2e35591221455834193b50d1b");  // WPOL/USDC
//p_obj.updateData().then(() => {p_obj.out(); p_obj.showPrices();});
//return 0;

//WALLET DATA
//let w_obj = new m_wallet.WalletObj(process.env.WA2 /* , process.env.WKEY*/);
//w_obj.out();
//w_obj.outAssets();
//w_obj.updateBalance().then(() => w_obj.showBalances());

//POS MANAGER
let pm = new m_posManager.PosManager(process.env.WA1);
//pm.getPosData("2417171").then((data) => log("POS_DATA:", data));
//pm.getPosCount().then((n) => log("POS_COUNT:", n));
/*
pm.updatePosCount().then(() => {
    space();
    pm.updatePosData().then((data) => {
	log("PID_LIST:", data);
	space();
	log("finished")
    });
});
*/
//pm.updatePosData().then((data) => log("PID_LIST:", data));
//pm.getPosID(0).then((data) => log("PID:", data));
pm.getPosData(2417180).then((data) => log("POS_DATA:", data));





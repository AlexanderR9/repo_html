
//desc of script
//скрипт проводит обмен одного токена на другой по текущим котировка в пуле.
// скрипт запускается с одним обязательным аргументом(сумма на входе) и вторым необязательным аргументом,
// который указывает какой из токенов в паре  входной, принимает значение 0/1 (поумолчанию 0).
// POOL_ADDR, DEAD_LINE задан константой  в коде.
// предварительно актив должен быть одобрен контракту который будет его списывать при обмене.



const m_base = require("./base.js");
const m_wallet = require("./wallet.js");
const m_swapper = require("./swapping.js");
const m_pool = require("./pool.js");

const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 265000; //единиц газа за транзакцию
const MAX_FEE = 320;  //Gweis
const PRIOR_FEE = 60;  //Gweis


let INPUT_SUM = -1;
let INPUT_T = 0;
let DEAD_LINE = 90; //seconds, время выполнения

//read args
const a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {log("You need set amount of swapping tokens"); return;}
if (!a_parser.isNumber(0)) {log("WARNING: invalid argument, amount is not number."); return;}
else INPUT_SUM = Number.parseFloat(a_parser.first()); // amount of input token
if (a_parser.count() > 1) INPUT_T = a_parser.at(1);
log("INPUT_SUM:", INPUT_SUM, "   INPUT_TOKEN:", INPUT_T);

//const
//const POOL_ADDR = "0xdac8a8e6dbf8c690ec6815e0ff03491b2770255d"; // USDT/USDC 0.01%
//const POOL_ADDR = "0x3d0acd52ee4a9271a0ffe75f9b91049152bac64b"; // USDC/LDO 0.3%
//const POOL_ADDR = "0x2db87c4831b2fec2e35591221455834193b50d1b"; // WPOL/USDC 0.3%
const POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb"; // WPOL/USDC 0.05%
    


// BODY SCRIPT
//by SwapperObj
log("//////////////////WITH SWAPPER_OJ/////////////////////////");
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);

let s_obj = new m_swapper.SwapperObj(w_obj);
s_obj.setPoolAddr(POOL_ADDR);
s_obj.trySwap(INPUT_SUM, INPUT_T, DEAD_LINE);


/*

//including
const m_const = require("./const.js");
const ethers = require("ethers");
const m_base = require("./base.js");
const JSBI =  require("jsbi");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {tokenData, poolData, poolState, chainInfo, txCount} = require("./asyncbase.js");


//use vars
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

*/
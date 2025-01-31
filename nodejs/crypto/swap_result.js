
//desc of script
// скрип определяет сумму выходных токенов при заданной входной сумме других токенов в определенном пуле.
// скрипт запускается с одним обязательным аргументом(сумма на входе) и вторым необязательным аргументом,
// который указывает какой из токенов в паре  входной, принимает значение 0/1 (поумолчанию 0).
// POOL_ADDR, T0_DECIMAL, T1_DECIMAL так же необходимы для вычислений, они заданы константыми прямо в коде.


//including
const m_const = require("./const.js");
const m_base = require("./base.js");
const {poolData, poolState, chainInfo} = require("./asyncbase.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");

//read args
const a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {log("You need set amount transfer tokens"); return;}
if (!a_parser.isNumber(0)) {log("WARNING: invalid argument, amount is not number."); return;}
        
//check amount value
let INPUT_SUM = Number.parseFloat(a_parser.first()); // amount of input token
if (INPUT_SUM < 0.01) {log("WARNING: amount too small, INPUT_SUM: ", INPUT_SUM); return;}
let INPUT_TYPE = "T0";
if (a_parser.count() > 1)
{
	if (a_parser.at(1) == "1" || a_parser.at(1) == "T1")
		INPUT_TYPE = "T1";
}
log("INPUT_SUM:", INPUT_SUM, "   INPUT_TYPE:", INPUT_TYPE);

//const
const POOL_ADDR = m_const.POOL_WMATIC_USDC;
const T0_DECIMAL = 18;
const T1_DECIMAL = 6;


//proj func
async function tokenSizeBySwapping(pv, pool_data, sum_in) //getting out_sum(t1) by in_sum(t0) from object quotesContract
{
	const t0 = (pool_data.input_token == "T0") ? pool_data.t0_addr : pool_data.t1_addr;
	const t1 = (pool_data.input_token == "T0") ? pool_data.t1_addr : pool_data.t0_addr;
	const fee = pool_data.fee;
	const dec0 = (pool_data.input_token == "T0") ? pool_data.decimal0 : pool_data.decimal1;
	const dec1 = (pool_data.input_token == "T0") ? pool_data.decimal1 : pool_data.decimal0;

	const bi_sum = m_base.fromReadableAmount(sum_in, dec0).toString();
	log("input sum ", sum_in, " | ", bi_sum);	
	log("t_in ", t0);	
	log("t_out ", t1);	


	const q_obj = m_base.getQuoterContract(m_const.QUOTER_CONTRACT_ADDRESS, pv);
	const bi_sum_out = await q_obj.callStatic.quoteExactInputSingle(t0, t1, fee, bi_sum, 0);
	return m_base.toReadableAmount(bi_sum_out, dec1);
}

// body
const pv = m_base.getProvider();
log("---------------------------------");

log(curTime(), "try get pool data", ".....");
log("POOL ADDRESS:", POOL_ADDR);
const pool = m_base.getPoolContract(POOL_ADDR, pv);
poolData(pool).then((data) => {
	data.decimal0 = T0_DECIMAL;
	data.decimal1 = T1_DECIMAL;
	data.input_token = INPUT_TYPE;
	log("INFO: ", data);
	space();
	
	log(curTime(), "try get swap result .....");
	tokenSizeBySwapping(pv, data, INPUT_SUM).then((out) => log("Sum out: ", out));	
});



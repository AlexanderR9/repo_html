
//desc of script
//transfer native token


//including
const m_const = require("./const.js");
const ethers = require("ethers");
const m_base = require("./base.js");
const {txCount} = require("./asyncbase.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");

//test debug
log("chain_id:", m_const.CHAIN_ID);
log("WALLET ADDRESS:", process.env.WA2 );
log(`NATIVE_TOKEN (${m_const.CHAIN_TOKEN})`);

//read args
const a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {log("You need set amount transfer tokens"); return;}
if (!a_parser.isNumber(0)) {log("WARNING: invalid argument, amount is not number."); return;}

//check amount value
const TRANSFER_SUM = Number.parseFloat(a_parser.first()); // amount of sending token
if (TRANSFER_SUM < 0.01) {log("WARNING: amount too small, TRANSFER_SUM: ", TRANSFER_SUM); return;}
log("TRANSFER_SUM: ", TRANSFER_SUM);

const GAS_LIMIT = 65000; //единиц газа за транзакцию
const MAX_FEE = 420;  //Gweis
const PRIOR_FEE = 80;  //Gweis

///////////////////FUNCTIONS/////////////////////////////////////
async function prepareParams(w, txp)
{
	const tx_count = await txCount(w);
	log("tx_count:", tx_count);

	log("transfer sum: ", TRANSFER_SUM);
	txp.nonce = tx_count;
	txp.value = m_base.fromReadableAmount(TRANSFER_SUM);
	log("--------------------------");
	space();
}
function setFeeParams(txp)
{
	txp.gasLimit = GAS_LIMIT;
	txp.maxFeePerGas = m_base.toGwei(MAX_FEE);
	txp.maxPriorityFeePerGas = m_base.toGwei(PRIOR_FEE);
}
//getting base gatLimit value
async function checkGas(w, tx_params) 
{
      	log("get estimate gas .....");
      	const e_gas = await w.estimateGas(tx_params);
      	log("estimateGas: ", e_gas.toNumber());
	space();	
}
async function sendNativeToken(w, to_addr)  //note: gasLimit >= 30000
{
	log("TRY TRANSFER NATIVE TOKEN");
	let tx_params = {to: to_addr};
	await prepareParams(w, tx_params);
	//await checkGas(w, tx_params); 
	setFeeParams(tx_params);
	log("tx_params:", tx_params);
	space();

	log("send transaction ....");
	const tx = await w.sendTransaction(tx_params);
	return tx;
}
async function sendUserToken(w, to_addr, token_addr) //note: gasLimit >= 60000
{
	log("TRY TRANSFER TOKEN: ", token_addr);

	//s1
        const t_obj = m_base.getTokenContract(token_addr, w);
	log("getting token params .....");
	const t_name = await t_obj.symbol(); 
	const t_dec = await t_obj.decimals(); 
	log("name: ", t_name, " decimals: ", t_dec);
	space();
	
	//s2
	log("getting sum size .....");
	const bi_sum = m_base.fromReadableAmount(TRANSFER_SUM, t_dec);
	log("transfer sum: ", TRANSFER_SUM, " |  BigNum: ", bi_sum);
	space();

	//s3
	log("set option params .....");
	let tx_fee_params = {};
	setFeeParams(tx_fee_params);
	const tx_count = await txCount(w);
	log("tx_count:", tx_count);
	tx_fee_params.nonce = tx_count;
	space();
	log("tx_fee_params:", tx_fee_params);
	space();

	log("send transaction ....");
	const tx = await t_obj.transfer(to_addr, bi_sum, tx_fee_params);
	return tx;
}

//////////////////////// EXEC BODY /////////////////////////
function printResult(data)
{
	log(data);
	log(curTime(), ".......... finished!");
}

space();
log(curTime(),"........ start");
const pv = m_base.getProvider();
const wallet = m_base.getWallet(process.env.WKEY, pv);

//send native
//sendNativeToken(wallet, process.env.WA1).then((data) =>  printResult(data));

//send usdc
//sendUserToken(wallet, process.env.WA1, m_const.USDC_ADDR).then((data) => printResult(data));

//send usdt
//sendUserToken(wallet, process.env.WA1, m_const.USDT_ADDR).then((data) => printResult(data));




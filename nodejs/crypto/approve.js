
//desc of script
//скрипт совершает approve токенов с адресом TOKEN_ADDR.
//TO_ADDR - кому дать разрешение тратить.
//сумма задается в 1-м аргументе скрипта.
//если скрипт выполнить без аргументов то он покажет текущуую уже одобренную сумму для TOKEN_ADDR.


//including
const m_const = require("./const.js");
const m_base = require("./base.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {tokenData, poolData, poolState, chainInfo, txCount} = require("./asyncbase.js");
const {ArgsParser} = require("./argsparser.js");

// user vars
let APPROVE_SUM = -1;
const TOKEN_ADDR = m_const.WPOL_ADDR; //какой актив разрешить тратить
const TO_ADDR = m_const.SWAP_ROUTER_ADDRESS; //кому одобрить (адрес контракта)
log("TOKEN_ADDR: ", TOKEN_ADDR);
log("TO_ADDR: ", TO_ADDR);

//read args
const a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) 
{
	log("CHECK CURRENT ALLOWANCE"); 
}
else
{
	if (!a_parser.isNumber(0)) {log("WARNING: invalid argument, amount is not number."); return;}

	//check amount value
	APPROVE_SUM = Number.parseFloat(a_parser.first()); // amount of input token
	if (APPROVE_SUM < 0.01) {log("WARNING: amount too small, APPROVE_SUM: ", APPROVE_SUM); return;}
	log("APPROVE_SUM:", APPROVE_SUM);
}

//gas fee
const GAS_LIMIT = 65000; //единиц газа за транзакцию
const MAX_FEE = 180;  //Gweis
const PRIOR_FEE = 45;  //Gweis


//proj func
function setFeeParams(txp)
{
        txp.gasLimit = GAS_LIMIT;
        txp.maxFeePerGas = m_base.toGwei(MAX_FEE);
        txp.maxPriorityFeePerGas = m_base.toGwei(PRIOR_FEE);
}
async function checkAllowance(w_obj)
{
	log("get allowance  ...");	
	const t_obj = m_base.getTokenContract(TOKEN_ADDR, w_obj.provider);
	const supply = await t_obj.allowance(w_obj.address, TO_ADDR);
	log("supply: ", supply.toString());	
	space();
}
async function main(w_obj)
{
	//get input token properties
	const t_obj = m_base.getTokenContract(TOKEN_ADDR, w_obj);
	log("get token params ..........")
	const t_data = 	await tokenData(t_obj.address, w_obj.provider);
	log(t_data);
	space();

	//prepare sum
        const bi_sum = m_base.fromReadableAmount(APPROVE_SUM, t_data.decimal);
	const approvalAmount = bi_sum.toString();
	log("BI sum format: ", bi_sum, "approvalAmount: ", approvalAmount);
  	space();	


        log("set option params .....");
        let tx_fee_params = {};
        setFeeParams(tx_fee_params);
        const tx_count = await txCount(w_obj);
        log("tx_count:", tx_count);
        tx_fee_params.nonce = tx_count;
        log("tx_fee_params:", tx_fee_params);
        space();
 

//	return;
	///////////////////////////////TX//////////////////////////////////////////
	log("try approve .....");
  	const approvalResponse = await t_obj.approve(TO_ADDR, approvalAmount, tx_fee_params);
  	log("approvalResponse:", approvalResponse);	 
  	space();
}


// body
const pv = m_base.getProvider();
log("---------------------------------");
const wallet = m_base.getWallet(process.env.WKEY, pv);

if (APPROVE_SUM < 0) //check approvals
{
	checkAllowance(wallet);
}
else // do approve
{
	log("TOKEN APPROVE TRANSACTION");
	main(wallet);
}


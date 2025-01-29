
//desc of script
//transfer native token


//including
const m_const = require("./const.js");
const ethers = require("ethers");
const m_base = require("./base.js");
const {txCount} = require("./asyncbase.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");

//test debug
log("chain_id:", m_const.CHAIN_ID);
log("WALLET ADDRESS:", process.env.WA2 );
log(`NATIVE_TOKEN (${m_const.CHAIN_TOKEN})`);

const MAX_FEE = 420;  //Gweis
const PRIOR_FEE = 80;  //Gweis
const TRANSFER_SUM = 0.5; // amount of sending token

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
	txp.gasLimit = 30000;
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
async function sendNativeToken(w, to_addr)
{
	log("TRY TRANSFER NATIVE TOKEN");
	let tx_params = {to: to_addr};
	await prepareParams(w, tx_params);
	//await checkGas(w, tx_params); 
	setFeeParams(tx_params);
	log("tx_params:", tx_params);

	return 0;

	space();
	log("send transaction ....");
	const tx = await w.sendTransaction(tx_params);
	return tx;
}
async function sendUserToken(w, to_addr, token_addr)
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
//	let tx_fee_params = {to: to_addr};
//	tx_fee_params.value = bi_sum;
	
	setFeeParams(tx_fee_params);
	const tx_count = await txCount(w);
	log("tx_count:", tx_count);
	tx_fee_params.nonce = tx_count;
	space();
	log("tx_fee_params:", tx_fee_params);
	space();


	return 0;

	log("send transaction ....");
	const tx = await t_obj.transfer(to_addr, bi_sum, tx_fee_params);
//	const tx = await t_obj.transfer(tx_fee_params);
	return tx;

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
}

//////////////////////// EXEC BODY /////////////////////////
async function sendUserToken2(w, to_addr, token_addr)
{
	log("getting sum size .....");
	const bi_sum = m_base.fromReadableAmount(TRANSFER_SUM, 6);
	log("transfer sum: ", TRANSFER_SUM, " |  BigNum: ", bi_sum);
	space();

	
	log("get tx token ......");
        const t_obj = m_base.getTokenContract(token_addr, w);
        const params = t_obj.interface.encodeFunctionData("transfer", [to_addr, bi_sum]);
	return params;

}
space();
log(curTime(),"........ start");
const pv = m_base.getProvider();
const wallet = m_base.getWallet(process.env.WKEY, pv);

//send native
/*
sendNativeToken(wallet, process.env.WA1).then((data) => {
	log(data);
	log(curTime(), ".......... finished!");

});
*/

//send usdc
sendUserToken(wallet, process.env.WA1, m_const.USDC_ADDR).then((data) => {
	log(data);
	log(curTime(), ".......... finished!");

});




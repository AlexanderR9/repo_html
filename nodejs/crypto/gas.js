
//desc of script
//getting balance native tokens and gas price

//include
const m_const = require("./const.js");
const m_base = require("./base.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {balance, balanceAt, feeGas, poolData, poolState} = require("./asyncbase.js");

const args = process.argv;
log("ARGS: ", args);


// body
const pv = m_base.getProvider();

//get wallet object
const wallet = m_base.getWallet(process.env.WKEY, pv);
//log("get balance of wallet ...");
//balance(wallet).then((data) => {
//	log(`Balance(${m_const.CHAIN_TOKEN}): `, data)
//	space();

	log("get gas price ...");
	feeGas(pv).then((data) => log(`Gas price (${m_const.CHAIN_TOKEN}), gwei: `, data));
//});



//desc of script
//getting balance native tokens and gas price

//include
const m_const = require("./const.js");
const m_base = require("./base.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {balance, balanceAt, feeGas, poolData, poolState} = require("./asyncbase.js");

const args = process.argv;
const args_count = args.length - 2;
const hasArgs = () => {return (args_count > 0);}
function getArg(i) 
{
	if (i>=args_count || i<0) return "?";
	return args[2+i];
}

log("ARGS: ");
if (hasArgs()) log("script received", args_count, "arguments!");
else log("Args list is empty");


const pv = m_base.getProvider();
const wallet = m_base.getWallet(process.env.WKEY, pv);

log("get balance of wallet ...");
if (!hasArgs()) //get native balance
{
	balance(wallet).then((data) => log(`Balance(${m_const.CHAIN_TOKEN}): `, data));
	return;
}

for (i=0; i<args_count; i++)
{
	let t = getArg(i).toUpperCase().trim();
	log(i+1, ":", t);
	if (t == "USDC")
		balanceAt(wallet, m_const.USDC_ADDR).then((data) => log('Balance(USDC):', data));
	else if (t == "USDT")
		balanceAt(wallet, m_const.USDT_ADDR).then((data) => log('Balance(USDT):', data));
	else if (t == "LDO")
		balanceAt(wallet, m_const.LDO_ADDR).then((data) => log('Balance(LDO):', data));
}



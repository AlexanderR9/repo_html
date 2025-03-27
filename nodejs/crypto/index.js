
//test script

//including
const ethers = require("ethers");
const {chainInfo} = require("./asyncbase.js");
const m_base = require("./base.js");
const m_pool = require("./obj_pool.js");
//const w_liq = require("./liq_worker.js");
const m_wallet = require("./obj_wallet.js");
const m_posManager = require("./obj_posmanager.js");
const {space, log, curTime, delay, countDecimals, uLog, isJson, hasField} = require("./utils.js");
const JSBI= require("jsbi");
const {PositionObj} = require("./obj_position.js");
//const params = require('./params.json');
//console.log(params);
const {TxWorkerObj} = require("./obj_txworker.js");
const {DateTimeObj} = require("./obj_dt.js");


const POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb";  // WPOL/USDC 0.5%
//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 160000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis
//const PRIOR_FEE = 50;  //Gweis


//test debug
//log("chain_id:", m_const.CHAIN_ID);
log("INFURA RPC_URL:", m_base.RPC_URL() );
log("Current chain:", m_base.currentChain());
log(`NATIVE_TOKEN (${m_base.nativeToken()})`);

let dt = new DateTimeObj;
dt.toDebug();
//log("year", dt.year(), "  month", dt.month());
log("day", dt.monthDay(), "  left_days_year", dt.leftDaysYear());
log(dt.strDate(), " / ", dt.strTime());
//dt.setDate(2006, -1,  -1);
//dt.setTime(17, -1, -1);
//log(dt.strDate(), " / ", dt.strTime(true));

const mask = "25.5.2019    18:08";
dt.fromString(mask);
log(dt.strDate(), " / ", dt.strTime(true));

space();
const dt2001 = new Date(2001, 0, 01, 03);
const dt2025 = new Date(2025, 0, 01, 03);
log(dt2001);
log(dt2025);
const d = (dt2025 - dt2001)/1000; //secs
log(d/(3600*24));






//log(dt.getFullYear());



/*
async function main()
{
    for (var i=0; i<15; i++)
    {
	await delay(1200);	
	log("i=",i);
	if (i == a) break;
    }
    log("finished");
}
*/
//main();


//return 0;


// body
//const pv = m_base.getProvider();
//log("provider info:", pv.connection);
//chainInfo(pv).then((data) => log("CHAIN:", data));
log("---------------------------------");



//const tx_obj = new TxWorkerObj(null);
//const tx_reply = {hash: "sdjkhfgdkfgjhdkfgh"};
//tx_obj.addTxLog(tx_reply, "wrap");


//let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
//w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);
//w_obj.txCount().then((data) => log("tx_count: ", data));
//w_obj.unwrapNative(2.55).then((result) => log("result: ", result));
//w_obj.wrapNative(4.0).then((result) => log("result: ", result));



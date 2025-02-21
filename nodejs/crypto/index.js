
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


// body
//const pv = m_base.getProvider();
//log("provider info:", pv.connection);
//chainInfo(pv).then((data) => log("CHAIN:", data));
log("---------------------------------");



//POS MANAGER
let pm = new m_posManager.PosManager(process.env.WA1);
pm.loadPidListFromFile();
pm.rewritePosDataFile();
//pm.getPosData("2417171").then((data) => log("POS_DATA:", data));
//pm.getPosCount().then((n) => log("POS_COUNT:", n));
//pm.fullUpdatePidList(15);
//pm.updatePosCount();
//pm.updatePosData(47);
//pm.updatePosData(48);

/*
pm.getPidList(45, 15).then((list) => 
{
    log("PID_LIST:", list.toString()); 
    //pm.writePidListToFile(list, true); //rewrite full
    pm.writePidListToFile(list, false);
    log("finished");
});
*/


//pm.getPosData(2417180).then((data) => log("POS_DATA:", data));





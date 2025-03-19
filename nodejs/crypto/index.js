
//test script

//including
const ethers = require("ethers");
const {chainInfo} = require("./asyncbase.js");
const m_base = require("./base.js");
const m_pool = require("./pool.js");
const w_liq = require("./liq_worker.js");
const m_wallet = require("./wallet.js");
const m_posManager = require("./posmanager.js");
const {space, log, curTime, delay, countDecimals, uLog} = require("./utils.js");
const JSBI= require("jsbi");
const {PositionObj} = require("./position.js");


const POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb";  // WPOL/USDC 0.5%
//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 160000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis
const PRIOR_FEE = 50;  //Gweis


//test debug
//log("chain_id:", m_const.CHAIN_ID);
log("INFURA RPC_URL:", m_base.RPC_URL() );
log("Current chain:", m_base.currentChain());
log(`NATIVE_TOKEN (${m_base.nativeToken()})`);


//const cur_dt = Math.floor(Date.now()/1000);
//dl = cur_dt + 150;
//log("cur_dt = ", cur_dt, "  dl = ", dl);

const a = 20;
const df = Math.pow(10, 9);
log("a = ", a, "  df = ", df);
let ja = JSBI.BigInt(a * df);
ja = JSBI.multiply(ja , JSBI.BigInt(df));
log("ja = ", ja.toString());

let jb = w_liq.LiqWorker.jsbiMulFloat(ja, 0.99);
log("jb = ", jb.toString());





return 0;


// body
//const pv = m_base.getProvider();
//log("provider info:", pv.connection);
//chainInfo(pv).then((data) => log("CHAIN:", data));
log("---------------------------------");





let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
//w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);
//w_obj.txCount().then((data) => log("tx_count: ", data));
//w_obj.unwrapNative(10.0).then((result) => log("result: ", result));
//w_obj.wrapNative(10.0).then((result) => log("result: ", result));



/*
let p_obj = new m_pool.PoolObj(POOL_ADDR);  // WPOL/USDC 0.5%
p_obj.updateData().then(() => {

    const t_range = p_obj.calcTickRange(0.22, 0.25);
    log("TICK_RANGE: ", t_range);    

    space();
    const p96 = p_obj.priceQ96ByTick(-289044);
    log("p96 by tick: ", p96);
    log("cur pool priceX96: ", p_obj.state.sqrtPrice, "/",  p_obj.state.sqrtPrice.toString());
    log("finished!!!");

});

*/



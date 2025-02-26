
//test script

//including
//const ethers = require("ethers");
const {chainInfo} = require("./asyncbase.js");
const m_base = require("./base.js");
const m_pool = require("./pool.js");
const w_liq = require("./liq_worker.js");
const m_wallet = require("./wallet.js");
const m_posManager = require("./posmanager.js");
const {space, log, curTime, delay, countDecimals, uLog} = require("./utils.js");


const POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb";  // WPOL/USDC 0.5%

//test debug
//log("chain_id:", m_const.CHAIN_ID);
log("INFURA RPC_URL:", m_base.RPC_URL() );
log("Current chain:", m_base.currentChain());
log(`NATIVE_TOKEN (${m_base.nativeToken()})`);
log(curTime());


/*
const a = uLog(2, 128);
log("log = ", a);
const t = -291467;
const mod = t%10;
log("tick", t, " mod = ", mod);
log("tick_next", t-mod);
*/    




//proj func


// body
//const pv = m_base.getProvider();
//log("provider info:", pv.connection);
//chainInfo(pv).then((data) => log("CHAIN:", data));
log("---------------------------------");

/*
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
let liq_worker = new w_liq.LiqWorker(w_obj, POOL_ADDR);
liq_worker.poolUpdate().then(() => {
    const t_range = liq_worker.calcTickRange(0.22, 0.45);
    log("TICK_RANGE: ", t_range);    
    log("finished!!!");
});
*/


let p_obj = new m_pool.PoolObj(POOL_ADDR);  // WPOL/USDC 0.5%
p_obj.updateData(false).then(() => {

    const t_range = p_obj.calcTickRange(0.22, 0.25);
    log("TICK_RANGE: ", t_range);    
    log("finished!!!");

});




//POS MANAGER
/*
let pm = new m_posManager.PosManager(process.env.WA1);

//update pos data and rewrite pos_data.txt
//pm.loadPidListFromFile();
//pm.updateArrPosData();

pm.loadPosDataFromFile();
//pm.rewritePosDataFile();
//pm.getPosCount().then((n) => log("POS_COUNT:", n));
//pm.fullUpdatePidList(15);

//pm.getPosData(2417180).then((data) => log("POS_DATA:", data));
//pm.getPosData("2417171").then((data) => log("POS_DATA:", data));
*/







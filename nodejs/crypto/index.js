
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
const GAS_LIMIT = 360000; //единиц газа за транзакцию
const MAX_FEE = 320;  //Gweis
const PRIOR_FEE = 60;  //Gweis


//test debug
//log("chain_id:", m_const.CHAIN_ID);
log("INFURA RPC_URL:", m_base.RPC_URL() );
log("Current chain:", m_base.currentChain());
log(`NATIVE_TOKEN (${m_base.nativeToken()})`);
//log("Q96");
log(curTime());


//let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
//let w_obj = new m_wallet.WalletObj(process.env.WA2);
//w_obj.txCount().then((data) => log("tx_count: ", data));
//w_obj.txHistory().then((data) => log("tx_history: ", data));


//return 0;


// body
const pv = m_base.getProvider();
//log("provider info:", pv.connection);
//chainInfo(pv).then((data) => log("CHAIN:", data));
log("---------------------------------");





///получение полной инфы о заданной позе
const pid = 2453392;
const pm =  m_base.getPosManagerContract(pv);
const pos = new PositionObj(pid, pm);
pos.updateData().then((result) => {
    log("result: ", result);
    space();
    pos.out();
    space();
    log(pos.strTickRange());
    log(pos.strPriceRange(0));
    log(pos.strAssetsAmount());
    log(pos.strDepositedAssets());

    space();
    pos.updateUnclaimedFees().then((result) => {
	log("result: ", result);
	log(pos.strUnclaimedFees());
	log("finished!!!");
    });
});

return;


/*
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);


//LIQ_WORKER
let liq_worker = new w_liq.LiqWorker(w_obj);
let pm = new m_posManager.PosManager(w_obj.address);
pm.loadPosDataFromFile();
const pos = pm.posAt(0);
if (!pos) {log("WARNING: posAt(0) is null"); return;}
log("POS_0 DATA:", pos.out());
log("-----------------------------------")
*/

//DECREACE
//liq_worker.tryDecrease(pos.pid, pos.liq).then((code) => { log("removing pos result: ", code); log("finished!!!"); });


//COLLECT
//liq_worker.tryCollect(pos.pid).then((code) => {  log("collection pos result: ", code);  log("finished!!!"); });


//MINT
/*
let liq_worker = new w_liq.LiqWorker(w_obj, POOL_ADDR);
const p1 = 0.22;
const p2 = 0.32;
const liq = 8.5;
liq_worker.tryMint(p1, p2, liq).then((code) => {
    log("minting pos result: ", code);
    log("finished!!!");
});
*/






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



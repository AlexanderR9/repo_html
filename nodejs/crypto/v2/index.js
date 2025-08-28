
//test script



//including
//const m_chain = require("./chain.js");
const { space, log, hasField, removeField } = require("./../utils.js");
const { ChainObj } = require("./chain_class.js");
const { WalletObj } = require("./wallet_class.js");
const { JSBIWorker } = require("./calc_class.js");



/*
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
const {tokenData} = require("./asyncbase.js");
const {StringListObj} = require("./obj_stringlist.js");
const {FileObj} = require("./obj_file.js");
*/


/*
const POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb";  // WPOL/USDC 0.5%
//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 160000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis
//const PRIOR_FEE = 50;  //Gweis
*/

//test debug
//log("chain_id:", m_const.CHAIN_ID);
//log("INFURA RPC_URL:", m_chain.rpcUrl() );
//log("Current chain:", m_chain.currentChain());
//log(`NATIVE_TOKEN (${m_chain.nativeToken()})`);


space();
let w_obj = new WalletObj(process.env.WA2, process.env.WKEY);




//return 1;
let s = "8723280330653418920";
let a = 65;
let bi = JSBIWorker.toBI(a);
let bi2 = JSBIWorker.toBI(s);
//log("bi: ", bi, "   bi2:", bi2);

//let f = JSBIWorker.fromWeiToFloat(s);
//log("fromWeiToFloat: ", f, " / ", f.toString());

let json = {name: "sdfs", age: 17, tall: 170};
log(json);
removeField(json, "age");
log("after remove:", json);


//log(JSBIWorker.isBI(a), "  / ", JSBIWorker.isBI(bi));
//log("types a/bi : ", JSBIWorker.isBI(a), " / ", JSBIWorker.isBI(bi))

/*
let k = 1.5;
let bi3 = JSBIWorker.invertSign(bi);
log("invert sign ", bi3)
let bi4 = JSBIWorker.biMulFloat(bi, k);
log("mul_float ", bi4)
*/

//log("bi: ", bi, "   bi2:", bi2);

return 1;
async function main()
{
    space();
    log("exe main");
//    w_obj.out();
    w_obj.outAssets();
//    w_obj.showBalances();

//    const v = await w_obj.balance(3);
//    log("balance: ", v, " / ", v.toString());
    space();
//    await w_obj.updateBalances();
//    w_obj.showBalances();

//    const ntx = await w_obj.txCount();
//    log("tx count: ", ntx);

//    const apr = await w_obj.checkApproved(1, '0xE592427A0AEce92De3Edee1F18E0157C05861564');
//    log("approved: ", apr);

    const gp = await w_obj.currentGasPrice();
    log("Gas: ", gp);
    const cid = await w_obj.chainId();
    log("Chain ID: ", cid);

}


main();


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



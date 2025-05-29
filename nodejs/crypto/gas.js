
//desc of script
//getting  gas price

//include
//const m_const = require("./const.js");
const m_base = require("./base.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {feeGas} = require("./asyncbase.js");


// body
const pv = m_base.getProvider();

//get wallet object
//const wallet = m_base.getWallet(process.env.WKEY, pv);
log("get gas price ...");
//feeGas(pv).then((data) => log(`Gas price: `, data));
pv.getGasPrice().then((gp) => {

    log(`Gas price: `, gp.toString(), "wei")
    const gpf = Number.parseInt(gp.toString());
    log(`Gas price: `, m_base.fromGwei(gpf).toFixed(3), "gwei")
    


});


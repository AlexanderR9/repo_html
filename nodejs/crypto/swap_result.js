
//desc of script
// скрип определяет сумму выходных токенов при заданной входной сумме других токенов в определенном пуле.
// скрипт запускается с одним обязательным аргументом(сумма на входе) и вторым необязательным аргументом,
// который указывает какой из токенов в паре  входной, принимает значение 0/1 (поумолчанию 0).
// POOL_ADDR задан константой  в коде.


//including
const m_base = require("./base.js");
const m_wallet = require("./obj_wallet.js");
const m_swapper = require("./obj_swapper.js");
const m_pool = require("./obj_pool.js");

const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");


let INPUT_SUM = -1;
let INPUT_T = 0;

//read args
const a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {log("You need set amount of swapping tokens"); return;}
if (!a_parser.isNumber(0)) {log("WARNING: invalid argument, amount is not number."); return;}
else INPUT_SUM = Number.parseFloat(a_parser.first()); // amount of input token
if (a_parser.count() > 1) INPUT_T = a_parser.at(1);
log("INPUT_SUM:", INPUT_SUM, "   INPUT_TOKEN:", INPUT_T);

//const
//const POOL_ADDR = "0xdac8a8e6dbf8c690ec6815e0ff03491b2770255d"; // USDT/USDC 0.01%
//const POOL_ADDR = "0x3d0acd52ee4a9271a0ffe75f9b91049152bac64b"; // USDC/LDO 0.3%
//const POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb"; // WPOL/USDC 0.05%
const POOL_ADDR = "0x6fe9e9de56356f7edbfcbb29fab7cd69471a4869" // USDT:WBNB:0.05%; 


// BODY SCRIPT
//by SwapperObj
log("//////////////////WITH SWAPPER_OJ/////////////////////////");
let w_obj = new m_wallet.WalletObj(process.env.WA2);
let s_obj = new m_swapper.SwapperObj(w_obj, POOL_ADDR);
s_obj.tokenSizeBySwapping(INPUT_SUM, INPUT_T).then((out_sum) => {
    log("out_sum =", out_sum);
    log("calc finished!")
});


//by PoolObj
//log("//////////////////WITH POOL_OJ/////////////////////////");
//let p_obj = new m_pool.PoolObj(POOL_ADDR);
//p_obj.tokenSizeBySwapping(INPUT_SUM, INPUT_T).then((out_sum) => log("calc finished!"));


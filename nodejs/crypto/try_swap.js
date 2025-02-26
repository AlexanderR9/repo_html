//desc of script
//скрипт проводит обмен одного токена на другой по текущим котировка в пуле.
// скрипт запускается с одним обязательным аргументом(сумма на входе) и вторым необязательным аргументом,
// который указывает какой из токенов в паре  входной, принимает значение 0/1 (поумолчанию 0).
// POOL_ADDR, DEAD_LINE задан константой  в коде.
// предварительно актив должен быть одобрен контракту который будет его списывать при обмене.
const m_base = require("./base.js");
const m_wallet = require("./wallet.js");
const m_swapper = require("./swapping.js");
const m_pool = require("./pool.js");

const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 265000; //единиц газа за транзакцию
const MAX_FEE = 320;  //Gweis
const PRIOR_FEE = 60;  //Gweis

//params of exchange
let INPUT_SUM = -1;
let INPUT_T = 0;
let DEAD_LINE = 90; //seconds, отведенное время выполнения

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
//const POOL_ADDR = "0x2db87c4831b2fec2e35591221455834193b50d1b"; // WPOL/USDC 0.3%
const POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb"; // WPOL/USDC 0.05%
    
// BODY SCRIPT
//by SwapperObj
log("//////////////////WITH SWAPPER_OJ/////////////////////////");
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);

let s_obj = new m_swapper.SwapperObj(w_obj);
s_obj.setPoolAddr(POOL_ADDR);
s_obj.trySwap(INPUT_SUM, INPUT_T, DEAD_LINE);


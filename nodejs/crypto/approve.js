
//desc of script
//скрипт совершает approve токенов с указанным индексом в списке активов кошелька TOKEN_INDEX (0..N).
//TO_ADDR - кому одобрить разрешение тратить.
//сумма задается в 1-м аргументе скрипта.
//если скрипт выполнить без аргументов то он покажет текущуую уже одобренную сумму для TOKEN_ADDR.
//параметры TOKEN_INDEX и TO_ADDR прописаны жестко в теле скрипта.

//including
const m_base = require("./base.js");
const m_wallet = require("./wallet.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");

// user vars
let APPROVE_SUM = -1;
const TOKEN_INDEX = 7;
const TO_ADDR = m_base.SWAP_ROUTER_ADDRESS; //кому одобрить (адрес контракта)

//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty())  APPROVE_SUM = a_parser.first();

//WALLET DATA
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
if (a_parser.isEmpty()) w_obj.checkApproved(TOKEN_INDEX, TO_ADDR).then((data) => log("supplied: ", data));
else w_obj.tryApprove(TOKEN_INDEX, TO_ADDR, APPROVE_SUM).then((data) => log("result: ", data));


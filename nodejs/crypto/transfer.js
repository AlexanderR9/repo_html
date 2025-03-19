
//desc of script
//скрипт совершает передачу TRANSFER_SUM токенов с указанным индексом в списке активов кошелька TOKEN_INDEX (0..N).
//W_TO_ADDR - адрес-получатель, кому отправить. W_OWN_ADDR - адрес отправитель.
//сумма актива задается в 1-м аргументе скрипта.
//индекс актива во 2-м аргументе скрипта.
//эти 2 аргумента обязательны, если скрипт выполнить без аргументов, скрипт просто выведет список активов кошелька.
//параметры W_TO_ADDR и W_OWN_ADDR прописаны жестко в теле скрипта.
/////////////////////ВАЖНО//////////////////////////////////
//необходимо предварительно разобраться с размерами комиссий и 
//прописать соответствующие(адекватные) значения для переменных:
// GAS_LIMIT, MAX_FEE, PRIOR_FEE


//including
const m_base = require("./base.js");
const m_wallet = require("./wallet.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 165000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis
//const PRIOR_FEE = 60;  //Gweis

// user vars
let TRANSFER_SUM = -1;
let TOKEN_INDEX = -1;
let W_TO_ADDR = process.env.WA1; //кому отправить (адрес кошелька)
let W_OWN_ADDR = process.env.WA2; //с какого кошелька отправить (адрес кошелька)
log("Send asset: ", W_OWN_ADDR, "=>", W_TO_ADDR);

//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.count() == 2)  
{
    TRANSFER_SUM = a_parser.first();
    TOKEN_INDEX = a_parser.at(1);
    log("SUM asset: ", TRANSFER_SUM, ",  Asset index: ", TOKEN_INDEX);
}
else 
{
    let w_obj = new m_wallet.WalletObj(W_OWN_ADDR);
    w_obj.outAssets();    
    log("WARNING: you must enter token sum and his index for sending!"); 
    return;
}


//WALLET DATA
let w_obj = new m_wallet.WalletObj(W_OWN_ADDR, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE);
w_obj.trySend(TOKEN_INDEX, W_TO_ADDR, TRANSFER_SUM).then((data) => log("result: ", data));



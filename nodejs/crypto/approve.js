
//desc of script
//скрипт совершает approve токенов с указанным индексом в списке активов кошелька TOKEN_INDEX (0..N).
//TO_ADDR - кому одобрить разрешение тратить.
//сумма задается в 1-м аргументе скрипта.
//индекс актива задается во 2-м аргументе (0..N-1), присваивается переменной TOKEN_INDEX, индексация с 0.
//если 2-й аргумент не задать то TOKEN_INDEX принимается поумолчанию, тот который задан в коде скрипта.
//если 1-аргумент задать 0, а 2-й  индекс актива то скрипт выведет текущуую уже одобренную сумму этого актива для контракта TO_ADDR.
//если скрипт выполнить без аргументов то он покажет текущуую уже одобренную сумму для контракта TO_ADDR.
//адрес контракта TO_ADDR прописан жестко в теле скрипта.

//including
const m_base = require("./base.js");
const {space, log, curTime, delay, isInt} = require("./utils.js");
const m_wallet = require("./obj_wallet.js");
const {ArgsParser} = require("./obj_argsparser.js");

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 260000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis
const PRIOR_FEE = -1;  //Gweis


// user vars
let APPROVE_SUM = -1;
let TOKEN_INDEX = 7; //USDC
//let TOKEN_INDEX = 1; //WPOL
//const TO_ADDR = m_base.SWAP_ROUTER_ADDRESS; //кому одобрить (адрес контракта)
const TO_ADDR = m_base.POS_MANAGER_ADDRESS; //кому одобрить (адрес контракта)

//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty())  
{
    APPROVE_SUM = a_parser.first();
    if (a_parser.count() > 1)
    {
	TOKEN_INDEX = Number.parseInt(a_parser.at(1));	
	if (!isInt(TOKEN_INDEX)) {log("WARNING: asset index is not integer, ", TOKEN_INDEX); return -1;}
    }
}
log("TOKEN_INDEX: ", TOKEN_INDEX, "  CONTRACT: ", TO_ADDR);

//WALLET DATA
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);
if (APPROVE_SUM <= 0) w_obj.checkApproved(TOKEN_INDEX, TO_ADDR).then((data) => log("supplied: ", data));
else w_obj.tryApprove(TOKEN_INDEX, TO_ADDR, APPROVE_SUM).then((data) => log("result: ", data));


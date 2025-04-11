
//desc of script
//ARG_1
//скрипт совершает approve токенов с указанным адресом токена, находящимся в кошельке, 
//нативный токен апрувнуть НЕЛЬЗЯ.
//ARG_2
//токен апрувается ДЛЯ: либо SWAP_ROUTER_ADDRESS либо POS_MANAGER_ADDRESS,
//для этого во 2-м аргументе необходимо указать ключ либо 'swap_router', либо 'pos_manager' 
//ARG_3
//сумма, которую нужно апрувнуть, задается в виде числа, пример: 25.5
//LOOK_MODE: 
//если выполнить скрипт только с одним 1-м аргументом, 
//то скрит только запросит в сети текущие апрувнутые суммы для обоих контрактов 'swap_router', 'pos_manager'.
//в любых других случаях комбинации аргументов выдаст ошибку

//including
const m_base = require("./base.js");
const {space, log, curTime, delay, isInt, varNumber} = require("./utils.js");
const m_wallet = require("./obj_wallet.js");
const {ArgsParser} = require("./obj_argsparser.js");

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 260000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis
const PRIOR_FEE = -1;  //Gweis


// user vars
let TOKEN_ADDR = ""; //arg 1
let APPROVE_SUM = -1; //arg 3
let WHOM_APPROVE = "none"; //arg 2
let LOOK_MODE = true;

let result = {};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}    


//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {sendErrResult("invalid args (is empty)"); return;}

TOKEN_ADDR = a_parser.first();
if (a_parser.count() > 1)
{
    if (a_parser.count() != 3) {sendErrResult("invalid args (count)"); return;}
    if (a_parser.at(1) == "swap_router") WHOM_APPROVE = m_base.SWAP_ROUTER_ADDRESS;
    else if (a_parser.at(1) == "pos_manager") WHOM_APPROVE = m_base.POS_MANAGER_ADDRESS;
    else {sendErrResult("invalid arg_2 ("+a_parser.at(1)+")"); return;}

    APPROVE_SUM = a_parser.at(2);
    if (!varNumber(APPROVE_SUM)) {sendErrResult("invalid arg_3 (incorrect sum - "+a_parser.at(2)+")"); return;}    
    LOOK_MODE = false;
}

result.token = TOKEN_ADDR;
log("TOKEN_ADDRESS: ", TOKEN_ADDR, "  APPROVE_SUM: ", APPROVE_SUM);
log("  WHOM_APPROVE: ", WHOM_APPROVE, "   LOOK_MODE=", LOOK_MODE);

//WALLET DATA
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);
const i_asset = w_obj.assetIndexOf(TOKEN_ADDR);
if (i_asset < 0) {sendErrResult("invalid token address (not found in wallet)"); return;}    
log("token index: ", i_asset);

if (LOOK_MODE) 
{
    result.type = "update";
    w_obj.checkApproved(i_asset, m_base.SWAP_ROUTER_ADDRESS).then((res_func) => {
	if (res_func < 0) {sendErrResult("can not get supplied value for SWAP_ROUTER"); return;}    
	const s_swap = 	res_func;
	log("supplied for SWR: ", s_swap);
	
	//check POS_MANAGER
	w_obj.checkApproved(i_asset, m_base.POS_MANAGER_ADDRESS).then((res_func) => {
	    if (res_func < 0) {sendErrResult("can not get supplied value for POS_MANAGER"); return;}    
	    const s_pm = res_func;
	    log("supplied for PM: ", s_pm);
	    result.swaprouter = s_swap;
	    result.posmanager = s_pm;
	    space();
	    sendResult();
	});

    });
}
else
{
    result.type = "tx_approve";
    w_obj.tryApprove(i_asset, WHOM_APPROVE, APPROVE_SUM).then((data) => {
	log("result: ", data)

	if (data.code == true) //send TX Ok!
	{
	    result.result_code = "OK";
	    result.tx_hash = data.tx_hash;
	}
	else
	{
	    result.result_code = "FAULT";
	}

	space();
	sendResult();
    });
}



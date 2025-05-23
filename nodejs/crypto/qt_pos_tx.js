//скрипт производит различные операции с существующими позициями, а именно:
//	1. increase (добавление ликвидности в существующую позу)
//	2. decrease (перевод части/всей ликвидности указанной позы в раздел невостребованные комиссии этой позы)
//	3. collect (вывод токенов-комиссий у заданной позы на кошелек)
//
//ARG_1 - один обязательный аргумент - json file со полями для совершения транзакции.
// набор полей и их значения входного json_file зависят от типа транзакции (increase/decrease/collect).
// 1-е обязательное поле должно быть "tx_kind" со значением - тип операции (increase/decrease/collect).
// 2-е обязательное поле должно быть "pool_address", указываем с каким пулом работаем.
// 3-е "pid" : "123456", // ID нашей позиции, с которой будет идти работа
// необязательное поле  'simulate_mode' со значением 'yes'/'no' для возможности проведения TX в режиме симуляции (по умолчанию 'yes').
// необязательное поле  'dead_line' со значением количество секунд допустимое для выполнения транзакции (по умолчанию 120).

//EXAMPLE of input JSON
/*
{
    "tx_kind" : "decrease"
    "pool_address": "0x2aceda63b5e958c45bd27d916ba701bc1dc08f7a",
    "pid" : "123456", // ID позиции

    // ----------- пример полей для операции "increase" ---------------------
    "l_tick" : -2, // тиковые границы существующей позы (известны заранее)
    "h_tick" : 4, 
    "token0_amount":  -1, //размер вносимых средств задается только для одного из токенов (любого), для второго необходимо установить значение -1, скрипт автоматом его рассчитает.
    "token1_amount": 600, 

    // ----------- пример полей для операции "decrease" ---------------------
    "liq_size" : "432593485793", // значение ликвидности существующей позы (известна заранее) 

    // ----------- пример полей для операции "collect"  ---------------------
    //нужен только pid

    "dead_line": 120, //seconds
    "simulate_mode": "yes", // value: yes/no
}
*/




//including
const {space, log, curTime, isInt, isFloat, jsonFromFile, hasField, isJson} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");
const m_wallet = require("./obj_wallet.js");
const {LiqWorker} = require("./obj_liqworker.js");
const m_pool = require("./obj_pool.js");


//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 360000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis


//user vars
let PID = -1; // id of position
let POOL_ADDR = "?";
let TX_KIND = "?";
let DEAD_LINE = 120;
let IS_SIMULATE = true; 
let tx_options = {}; //набор специфических полей для конкретного типа операции


////////////////////check validity values functions///////////////////////////////////
function checkTxKind(v)
{
    if (v == "mint" || v == "increase" || v == "decrease" || v == "collect") return "ok";
    return ("invalid value of tx_kind (" + v + ")");
}
function checkPoolAddr(v)
{
    if (v.length > 30 && v.slice(0, 2) == "0x") return "ok";
    return ("invalid value of pool_address (" + v + ")");
}
function checkPID(v)
{
    if (v.length < 5) return ("invalid value of PID position (" + v + ")");
    return "ok";    
}
function checkLiqSize(v)
{
    if (v.length < 10) return ("invalid value of liquidity position (" + v + ")");
    return "ok";    
}
function checkRangeTicks(v1, v2)
{
    if (!isInt(v1))  return ("invalid value low tick of range  (" + v1 + ") it is not integer");
    if (!isInt(v2))  return ("invalid value high tick of range  (" + v2 + ") it is not integer");
    if (v2 <= v1) return ("invalid ticks of range (must tick2 > tick1)");
    return "ok";
}
function checkTokenAmounts(v1, v2)
{
    if (!isFloat(v1)) return ("invalid value of token0 amount  (" + v1 + ") it is not float");
    if (!isFloat(v2)) return ("invalid value of token1 amount  (" + v2 + ") it is not float");
    if (v1 > 0 && v2 >= 0) return ("invalid value of tokens amount  (" + v1 + " / " + v2 + ") > 0 value only one");
    if (v2 > 0 && v1 >= 0) return ("invalid value of tokens amount  (" + v1 + " / " + v2 + ") > 0 value only one");
    if (v1 <= 0 && v2 <= 0) return ("invalid value of tokens amount  (" + v1 + " / " + v2 + ") one token must > 0");
    return "ok";
}




/////////////////////////////////////////////////////////////////////////////////////

let result = {type: "pos_tx"};
const sendResult = () => {space(); log("JSON_RESULT_START", result, "JSON_RESULT_END");}
function sendErrResult(err) {result.error = err; sendResult();}


//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {sendErrResult("invalid args (is empty)"); return;}
if (a_parser.count() != 1) {sendErrResult("invalid args (parameters != 1)"); return;}

//read input JSON_FILE
const F_JSON = a_parser.first();
log("JSON-file: ", F_JSON);
const j_params  = jsonFromFile(F_JSON);
if (!isJson(j_params)) {sendErrResult("can not readed JSON data"); return;}
log("JSON parsed OK! \n\n DATA:", j_params);

//check filelds kit
if (!hasField(j_params, "pool_address")) {sendErrResult("json-params has not field <pool_address>"); return;}
if (!hasField(j_params, "tx_kind")) {sendErrResult("json-params has not field <tx_kind>"); return;}
if (!hasField(j_params, "pid")) {sendErrResult("json-params has not field <pid>"); return;}
TX_KIND = j_params.tx_kind.trim().toLowerCase();
POOL_ADDR = j_params.pool_address.trim().toLowerCase();
PID = j_params.pid.trim();

let err = checkTxKind(TX_KIND);
if (err != "ok") {sendErrResult(err); return;}
err = checkPoolAddr(POOL_ADDR);
if (err != "ok") {sendErrResult(err); return;}
err = checkPID(PID);
if (err != "ok") {sendErrResult(err); return;}


IS_SIMULATE = ((j_params.simulate_mode == "no") ? false : true);
var a = j_params.dead_line;
if (isInt(a) && a > 10) DEAD_LINE = a;



//check operation specifically options
if (TX_KIND == "decrease")
{
    if (!hasField(j_params, "liq_size")) {sendErrResult("json-params has not field <liq_size> (must be for mode decrease)"); return;}
    a = j_params.liq_size.trim();
    err = checkLiqSize(a);
    if (err != "ok") {sendErrResult(err); return;}
    tx_options.liq_size = a;
}
else if (TX_KIND == "increase")
{
    // check ticks values
    if (!hasField(j_params, "l_tick")) {sendErrResult("json-params has not field <l_tick> (must be for mode increase)"); return;}
    if (!hasField(j_params, "h_tick")) {sendErrResult("json-params has not field <h_tick> (must be for mode increase)"); return;}
    tx_options.tick1 = j_params.l_tick;
    tx_options.tick2 = j_params.h_tick;
    err = checkRangeTicks(tx_options.tick1, tx_options.tick2);
    if (err != "ok") {sendErrResult(err); return;}

    //check amounts values
    if (!hasField(j_params, "token0_amount")) {sendErrResult("json-params has not field <token0_amount> (must be for mode increase)"); return;}
    if (!hasField(j_params, "token1_amount")) {sendErrResult("json-params has not field <token1_amount> (must be for mode increase)"); return;}
    tx_options.amount0 = j_params.token0_amount;
    tx_options.amount1 = j_params.token1_amount;
    err = checkTokenAmounts(tx_options.amount0, tx_options.amount1);
    if (err != "ok") {sendErrResult(err); return;}
}


space();
log("-------------------- JSON fields kit OK! -------------------------");
log("TX_KIND:", TX_KIND);
log("POOL:", POOL_ADDR);
log("PID position:", PID);
log("IS_SIMULATE:", IS_SIMULATE);
log("DEAD_LINE:", DEAD_LINE);
space();
log("tx_options:", tx_options);


//result.tx_kind = TX_KIND;
result.type = TX_KIND;
result.pid = PID;
result.is_simulate = IS_SIMULATE.toString();
///////////////////////everything is ready to perform the operation/////////////////////////////////////
// init WalletObj
const w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE);

//init LIQ_WORKER
let liq_worker = new LiqWorker(w_obj, POOL_ADDR);
liq_worker.setSimulateMode(IS_SIMULATE); //TURN ON/OFF SIMULATE_MODE
liq_worker.setDeadLine(DEAD_LINE);
//------------------------------------------------------------------


//функция рассчитывает размер второго вносимого токена для этой позиции, с учетом тикового диапазона и текущей цены токена_0 в пуле.
//если параметры заданы не верно, функция вернет false, иначе true.
//функция используется только для режима 'increase'.
function calcAssetAmounts(pool_obj)
{
    log("Calculation asset amounts .....");
    var range_p1 = pool_obj.priceByTick(result.tick_lower);
    var range_p2 = pool_obj.priceByTick(result.tick_upper);
    let prices = {p1: range_p1, p2: range_p2};
    prices.p_current = pool_obj.T0.price;

    const am = ((tx_options.amount0 > 0) ? tx_options.amount0 : tx_options.amount1);
    const am_i = ((tx_options.amount0 > 0) ? 0 : 1);
    const am_other = pool_obj.calcPosAssetAmount(prices, am, am_i);
    if (am_other < 0) return false;
        
    if (am_i == 0)
    {
        result.token0_amount = am.toFixed(4);
        result.token1_amount = am_other.toFixed(4);
    }
    else
    {
        result.token0_amount = am_other.toFixed(4);
        result.token1_amount = am.toFixed(4);
    }
    return true;
}


// MAIN CODE
log("TX_ACTION: ", `[${TX_KIND}]`);
if (TX_KIND == "decrease")
{
    log("remove liquidity: SIZE =", tx_options.liq_size);
    result.liq_size = tx_options.liq_size;
    try 
    {
	liq_worker.tryDecrease(PID, tx_options.liq_size).then((tx_result) => { 
            log("tx_result:", tx_result);
	    if (IS_SIMULATE) {sendResult(); return;}
	
            if (!hasField(tx_result, "tx_hash")) {sendErrResult("wrong result of tx_decrease"); return;}	    

            result.tx_hash = tx_result.tx_hash;
            result.tx_code = tx_result.code;
	    sendResult();
	});	
    }
    catch(e) {const err = ("ERROR - " + e);  sendErrResult(err);}
}
else if (TX_KIND == "collect")
{
    log("collect assets from position...");
    try 
    {
	liq_worker.tryCollect(PID).then((tx_result) => { 
            log("tx_result:", tx_result);
	    if (IS_SIMULATE) {sendResult(); return;}
	
            if (!hasField(tx_result, "tx_hash")) {sendErrResult("wrong result of tx_collect"); return;}	    

            result.tx_hash = tx_result.tx_hash;
            result.tx_code = tx_result.code;
	    sendResult();
	});	
    }
    catch(e) {const err = ("ERROR - " + e);  sendErrResult(err);}
}
else if (TX_KIND == "increase")
{
    let p_obj = liq_worker.pool;
    var ok = p_obj.loadFromFile(w_obj); //грузим базовые данные пула из файла
    if (!ok) {sendErrResult("can not load pool data from file (check pool_address)"); return;}
    log("WORKING_POOL_INFO: ", p_obj.baseInfo());
    space();

    log("increase liquidity to position...");
    result.tick_lower = tx_options.tick1;
    result.tick_upper = tx_options.tick2;

    try 
    {
	// получаем текущее состояние пула
	p_obj.updateState().then(() => {

    	    p_obj.showPrices();
    	    log("current tick:", p_obj.state.tick);
    	    result.current_tick = p_obj.state.tick;

    	    if (!calcAssetAmounts(p_obj))
    	    {
        	sendErrResult("can not calc amounts (check price range and input token_amount)");
        	return;
    	    }
	    if (IS_SIMULATE) {sendResult(); return;}

	    w_obj.setGas(2*GAS_LIMIT, 2*MAX_FEE);
    	    /////////////////SEND REAL MINT_TX////////////////////
    	    const liq_size = {token0: tx_options.amount0, token1: tx_options.amount1};
    	    liq_worker.tryIncrease(PID, tx_options, liq_size, false).then((tx_result) => {
        	log("tx_result:", tx_result);
        	if (!hasField(tx_result, "tx_hash")) {sendErrResult("wrong result of tx_increase"); return;}

        	result.tx_hash = tx_result.tx_hash;
        	result.tx_code = tx_result.code;
        	sendResult();
    	    });


	}); 
    }
    catch(e) {const err = ("ERROR - " + e);  sendErrResult(err);}
}



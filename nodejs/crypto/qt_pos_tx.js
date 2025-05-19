//скрипт производит различные операции с позициями, а именно:
//	1. mint (чеканка новой позы)
//	2. increase (добавление ликвидности в существующую позу)
//	3. decrease (перевод части/всей ликвидности указанной позы в раздел невостребованные комиссии этой позы)
//	4. collect (вывод токенов-комиссий у заданной позы на кошелек)
//
//ARG_1 - один обязательный аргумент - json file со полями для совершения транзакции.
// набор полей и их значения входного json_file зависят от типа транзакции (mint/increase/decrease/collect).
// 1-е обязательное поле должно быть "tx_kind" со значением - тип операции (mint/increase/decrease/collect).
// 1-е обязательное поле должно быть "pool_address", указываем с каким пулом работаем.
// необязательное поле  'simulate_mode' со значением 'yes'/'no' для возможности проведения TX в режиме симуляции (по умолчанию 'yes').
// необязательное поле  'dead_line' со значением количество секунд допустимое для выполнения транзакции (по умолчанию 120).

//EXAMPLE of input JSON
/*
{
    "tx_kind" : "decrease"
    "pool_address": "0x2aceda63b5e958c45bd27d916ba701bc1dc08f7a",


    // ----------- пример полей для операции "mint" ---------------------
	//следующее поле указывает в чем задается диапазон, может принимать значения (price/tick).
	//для значения 'price' должны быть обязательно определены далее следующие поля: 'token_index', 'l_price', 'h_price'
	//для значения 'tick' должны быть обязательно определены далее следующие поля: 'l_tick', 'h_tick'	
	//ПРИМЕЧАНИЕ: значение 'tick' удобно использовать для пулов со стейблами.
    "range_view" : "price", 
    "token_index": 0, // индекс токена пары: либо 0 либо 1, указывает для которого актива указан ценовой диапазон
    "l_price": 1.25, // диапазон указывается двумя полями (l_price, h_price), значения должны быть > 0, и h_price > l_price
    "h_price": 1.45,
    "l_tick" : -2, // диапазон указывается в тиках при  (range_view == 'tick'), значения должны быть: h_tick > l_tick
    "h_tick" : 4, 
    "token0_amount": 120 , //размер вносимых средств задается только для одного из токенов (любого), для второго необходимо установить значение -1, скрипт автоматом его рассчитает.
    "token1_amount": -1 , 

    // ----------- пример полей для операции "increase" ---------------------
    "pid" : "123456", // ID позиции, куда добавляем ликвидность
    "l_tick" : -2, // тиковые границы существующей позы 
    "h_tick" : 4, 
    "token0_amount":  -1, //размер вносимых средств задается только для одного из токенов (любого), для второго необходимо установить значение -1, скрипт автоматом его рассчитает.
    "token1_amount": 600, 

    // ----------- пример полей для операции "decrease" ---------------------
    "pid" : "123456", // ID позиции, из которой удаляем ликвидность и переносим ее в раздел: "невостребованные комиссии"
    "liq_size" : "432593485793", // значение ликвидности существующей позы 

    // ----------- пример полей для операции "collect"  ---------------------
    "pid" : "123456", // ID позиции, в которой выводим токены из раздела: "невостребованные комиссии" на кошелек


    "dead_line": 120, //seconds
    "simulate_mode": "yes", // maybe yes/no

}
*/




//including
const {space, log, curTime, delay, isInt, varNumber, isJson, jsonFromFile, hasField} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");
const m_wallet = require("./obj_wallet.js");
const {LiqWorkerObj} = require("./obj_liqworker.js");

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 360000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis


//user vars
let POOL_ADDR = "?";
let TX_KIND = "?";
let DEAD_LINE = 120;
let IS_SUMULATE = true; 
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
function checkRangeView(v)
{
    if (v == "price" || v == "tick") return "ok";
    return ("invalid value of range_view (" + v + ")");
}
function checkTokenIndex(v)
{
    if (!isInt(v))  return ("invalid value of token_index (" + v + ") it is not integer");
    if (v == 0 || v == 1) return "ok";
    return ("invalid value of range_view (" + v + ")  must 0/1");
}

/////////////////////////////////////////////////////////////////////////////////////

let result = {type: "pos_tx"};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}

//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {sendErrResult("invalid args (is empty)"); return;}
if (a_parser.count() != 1) {sendErrResult("invalid args (parameters != 1)"); return;}

//read input JSON_FILE
const F_JSON = a_parser.first();
log("JSON-file: ", F_JSON);
const j_params  = jsonFromFile(F_JSON);
if (!isJson(j_params)) {sendErrResult("can't readed JSON data"); return;}
log("JSON parsed OK! \n\n DATA:", j_params);

//check filelds kit
if (!hasField(j_params, "pool_address")) {sendErrResult("json-params has not field <pool_address>"); return;}
if (!hasField(j_params, "tx_kind")) {sendErrResult("json-params has not field <tx_kind>"); return;}
TX_KIND = j_params.tx_kind.trim().toLowerCase();
POOL_ADDR = j_params.pool_address.trim().toLowerCase();
let err = checkTxKind(TX_KIND);
if (err != "ok") {sendErrResult(err); return;}
err = checkPoolAddr(POOL_ADDR);
if (err != "ok") {sendErrResult(err); return;}
IS_SUMULATE = ((j_params.simulate_mode == "no") ? false : true);
var a = j_params.dead_line;
if (isInt(a) && a > 10) DEAD_LINE = a;
//check operation specifically options
if (TX_KIND == "mint")
{
    if (!hasField(j_params, "range_view")) {sendErrResult("json-params has not field <range_view> (must be for TX mint)"); return;}
    a = j_params.range_view.trim().toLowerCase();
    err = checkRangeView(a);
    if (err != "ok") {sendErrResult(err); return;}
    tx_options.mode = a;
    
    

}



space();
log("-------------------- JSON fields kit OK! -------------------------");
log("TX_KIND:", TX_KIND);
log("POOL:", POOL_ADDR);
log("IS_SUMULATE:", IS_SUMULATE);
log("DEAD_LINE:", DEAD_LINE);
space();
log("tx_options:", tx_options);



/*
let TX_HASH = "";
let result = {};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}


//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {sendErrResult("invalid args (is empty)"); return;}
if (a_parser.count() != 1) {sendErrResult("invalid args (count)"); return;}
TX_HASH = a_parser.first();
if (TX_HASH.length < 30) {sendErrResult("invalid arg1 (wrong TX_HASH value)"); return;}


/////////// ARGS OK ////////////////////
log("Check TX result ..............");
log("TX_HASH:", TX_HASH);
result.hash = TX_HASH;


//body
let w_obj = new m_wallet.WalletObj(process.env.WA2);
let tx_obj = new TxWorkerObj(w_obj);

tx_obj.checkTxByHash(TX_HASH).then((res) => {

    log("HASH checking has done. STATUS: \n ", res)
    if (!isJson(res)) {sendErrResult("invalid result (is not JSON)"); return;}
    
    result.status = "?";
    result.fee = "-1";  
    result.finished = res.finished;

    if (result.finished) 
    {
	result.status = ((res.status == 1) ? "OK" : "FAULT");
        result.fee = res.fee;  
    }
    else log("tx executing else"); //tx executing else

    sendResult();	

});

*/



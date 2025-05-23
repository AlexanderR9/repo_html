//скрипт производит всего одну операцию, а именно: mint (чеканка новой позы)

//ARG_1 - один обязательный аргумент - json file со полями для совершения транзакции.
// 1-е обязательное поле должно быть "pool_address", указываем с каким пулом работаем.
// необязательное поле  'simulate_mode' со значением 'yes'/'no' для возможности проведения TX в режиме симуляции (по умолчанию 'yes').
// необязательное поле  'dead_line' со значением количество секунд допустимое для выполнения транзакции (по умолчанию 120).

//EXAMPLE of input JSON
/*
{

    // ----------- пример полей для операции "mint" ---------------------
    "pool_address": "0x2aceda63b5e958c45bd27d916ba701bc1dc08f7a",


	//следующее поле указывает в чем задается диапазон, может принимать значения (price/tick).
	//для значения 'price' должны быть обязательно определены далее следующие поля: 'token_index', 'l_price', 'h_price'
	//для значения 'tick' должны быть обязательно определены далее следующие поля: 'l_tick', 'h_tick'	
	//ПРИМЕЧАНИЕ: значение 'tick' удобно использовать для пулов со стейблами.
    "range_view" : "price", 

    // обязательные поля при (range_view == 'price')
    "token_index": 0, // индекс токена пары: либо 0 либо 1, указывает для которого актива указан ценовой диапазон
    "l_price": 1.25, // диапазон указывается двумя полями (l_price, h_price), значения должны быть > 0, и h_price > l_price
    "h_price": 1.45,

    // обязательные поля при (range_view == 'tick')
    "l_tick" : -2, // диапазон указывается в тиках при  (range_view == 'tick'), значения должны быть: h_tick > l_tick
    "h_tick" : 4, 
    //ВНИМАНИЕ: если указывать диапазон в тиках, то нужно задавать уже нормализованные значения, т.е. согласно tickSpacing это пула.	

    // объемы вносимых токенов задаются в любом случае
    "token0_amount": 120 , //размер вносимых средств задается только для одного из токенов (любого), для второго необходимо установить значение -1, скрипт автоматом его рассчитает.
    "token1_amount": -1 , 


    "dead_line": 120, //seconds
    "simulate_mode": "yes", // maybe yes/no

}
*/


//including
const {space, log, curTime, delay, isInt, isFloat, isJson, jsonFromFile, hasField} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");
const m_wallet = require("./obj_wallet.js");
const {LiqWorker} = require("./obj_liqworker.js");
const m_pool = require("./obj_pool.js");
const m_base = require("./base.js");



//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 2*360000; //единиц газа за транзакцию
const MAX_FEE = 2*220;  //Gweis


//user vars
let POOL_ADDR = "?";
let DEAD_LINE = 120;
let IS_SIMULATE = true; 
let tx_options = {}; //набор специфических полей для операции


////////////////////check validity values functions///////////////////////////////////
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
function checkRangePrices(v1, v2)
{
    if (!isFloat(v1))  return ("invalid value low price of range  (" + v1 + ") it is not float");
    if (!isFloat(v2))  return ("invalid value high price of range  (" + v2 + ") it is not float");
    if (v1 <= 0) return ("invalid value low price of range  (" + v1 + ") must be over zero");
    if (v2 <= 0) return ("invalid value high price of range  (" + v2 + ") must be over zero");
    if (v2 <= v1) return ("invalid prices of range (must p2 > p1)");
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

let result = {type: "mint_tx"};
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
POOL_ADDR = j_params.pool_address.trim().toLowerCase();
err = checkPoolAddr(POOL_ADDR);
if (err != "ok") {sendErrResult(err); return;}
IS_SIMULATE = ((j_params.simulate_mode == "no") ? false : true);
var a = j_params.dead_line;
if (isInt(a) && a > 10) DEAD_LINE = a;
//check operation specifically options
if (!hasField(j_params, "range_view")) {sendErrResult("json-params has not field <range_view>"); return;}
a = j_params.range_view.trim().toLowerCase();
err = checkRangeView(a);
if (err != "ok") {sendErrResult(err); return;}

tx_options.mode = a;
if (tx_options.mode == "price")
{
    //check token_index
    if (!hasField(j_params, "token_index")) {sendErrResult("json-params has not field <token_index> (must be for mode price)"); return;}
    a = j_params.token_index;
    err = checkTokenIndex(a); 
    if (err != "ok") {sendErrResult(err); return;}
    tx_options.index = a;
    
    //check_prices
    if (!hasField(j_params, "l_price")) {sendErrResult("json-params has not field <l_price> (must be for mode price)"); return;}
    if (!hasField(j_params, "h_price")) {sendErrResult("json-params has not field <h_price> (must be for mode price)"); return;}
    tx_options.p1 = j_params.l_price;
    tx_options.p2 = j_params.h_price;
    err = checkRangePrices(tx_options.p1, tx_options.p2);
    if (err != "ok") {sendErrResult(err); return;}
}
else //mode 'tick'
{
    if (!hasField(j_params, "l_tick")) {sendErrResult("json-params has not field <l_tick> (must be for mode tick)"); return;}
    if (!hasField(j_params, "h_tick")) {sendErrResult("json-params has not field <h_tick> (must be for mode tick)"); return;}
    tx_options.tick1 = j_params.l_tick;
    tx_options.tick2 = j_params.h_tick;
    err = checkRangeTicks(tx_options.tick1, tx_options.tick2);
    if (err != "ok") {sendErrResult(err); return;}    
}

//check token amounts
if (!hasField(j_params, "token0_amount")) {sendErrResult("json-params has not field <token0_amount>"); return;}
if (!hasField(j_params, "token1_amount")) {sendErrResult("json-params has not field <token1_amount>"); return;}
tx_options.amount0 = j_params.token0_amount;
tx_options.amount1 = j_params.token1_amount;
err = checkTokenAmounts(tx_options.amount0, tx_options.amount1);
if (err != "ok") {sendErrResult(err); return;}    



space();
log("-------------------- JSON fields kit OK! -------------------------");
log("POOL:", POOL_ADDR);
log("IS_SIMULATE:", IS_SIMULATE);
log("DEAD_LINE:", DEAD_LINE);
space();
log("tx_options:", tx_options);

result.is_simulate = IS_SIMULATE.toString();
///////////////////////everything is ready to perform the operation/////////////////////////////////////

// init WalletObj
const w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE);

//init LIQ_WORKER
let liq_worker = new LiqWorker(w_obj, POOL_ADDR);
liq_worker.setSimulateMode(IS_SIMULATE); //TURN ON/OFF SIMULATE_MODE
liq_worker.setDeadLine(DEAD_LINE);

space();
log("try mint new position ........");
//let p_obj = new m_pool.PoolObj(POOL_ADDR);
let p_obj = liq_worker.pool;
var ok = p_obj.loadFromFile(w_obj); //грузим базовые данные пула из файла
if (!ok) {sendErrResult("can not load pool data from file (check pool_address)"); return;}
log("WORKING_POOL_INFO: ", p_obj.baseInfo());
space();


//если диапазон задан в обычных ценах 1-го из активов, 
//то нужно вычислить нормализованные значения тиков(с учетом tickSpacing) которые соответствуют этим ценам.
//функция вернет объект вида: {tick1 : v1, tick2 : v2}
function findTicksRange()
{
    let t_range = {"tick1": -1, "tick2": -1};
    if (tx_options.mode == "price")
    {
	var p1 = tx_options.p1;
	var p2 = tx_options.p2;
	if (tx_options.index == 1) //приводим цены к токену_0
	{
	    p1 = 1/tx_options.p2;
	    p2 = 1/tx_options.p1;
	}
	const tr = p_obj.calcTickRange(p1, p2);
	t_range.tick1 = tr.tick1;
	t_range.tick2 = tr.tick2;
	if (tx_options.index == 1)
	{
    	    const t_space = m_base.tickSpacingByFee(p_obj.fee);
	    t_range.tick1 += t_space;
	    t_range.tick2 += t_space;
	}
    }
    else
    {
	t_range.tick1 = tx_options.tick1;
	t_range.tick2 = tx_options.tick2;
    }
    log("ticks got!");
    return t_range;
}
//функция находит реальный ценовой диапазон, т.е. который точно соответствует нормализованным тикам, рассчитанным ранее.
//диапазон запишется в поле result.real_price_range выходного результата.
//ценовые значения будут указаны для того же актива, который указан во входном JSON в поле token_index.
function calcRealPriceRange()
{
    log("Calculation real price range .....");
    var real_p1 = p_obj.priceByTick(result.tick_lower); 
    var real_p2 = p_obj.priceByTick(result.tick_upper); 
    if (tx_options.index == 1)
    {
        const real_prange = LiqWorker.invertPrices({"p1" : real_p1.toFixed(8), "p2" : real_p2.toFixed(8)});
	real_p1 = real_prange.p1.toFixed(6);
	real_p2 = real_prange.p2.toFixed(6);
    }
    result.real_price_range = ("(" + real_p1.toString() + "; " + real_p2.toString() + ")");
    log("done!");
}
//функция рассчитывает размер второго вносимого токена по текущей цене и реального диапазона.
//если параметры заданы не верно, функция вернет false, иначе true.
function calcAssetAmounts()
{
    log("Calculation asset amounts .....");
    var real_p1 = p_obj.priceByTick(result.tick_lower); 
    var real_p2 = p_obj.priceByTick(result.tick_upper); 
    let prices = {p1: real_p1, p2: real_p2};
//    prices.p_current = ((tx_options.index == 1) ? p_obj.T1.price : p_obj.T0.price);
    prices.p_current = p_obj.T0.price;

    const am = ((tx_options.amount0 > 0) ? tx_options.amount0 : tx_options.amount1);
    const am_i = ((tx_options.amount0 > 0) ? 0 : 1);
    const am_other = p_obj.calcPosAssetAmount(prices, am, am_i);
    if (am_other < 0) return false;
    
    if (am_i == 0)
    {
	result.token0_amount = am.toFixed(4);
	result.token1_amount = am_other.toFixed(4);
    }
    else 
    {
	result.token1_amount = am.toFixed(4);
	result.token0_amount = am_other.toFixed(4);
    }
    return true;
}


// MAIN CODE
log("------------------CURRENT STATE--------------------------------");
try 
{
    // получаем текущее состояние пула
    p_obj.updateState().then(() => {
 
	//p_obj.out();
	p_obj.showPrices();
	log("current tick:", p_obj.state.tick);
	result.current_price = ((tx_options.index == 1) ? p_obj.T1.strPrice() : p_obj.T0.strPrice());
	result.current_tick = p_obj.state.tick;

	const tr = findTicksRange();
	result.tick_lower = tr.tick1;
	result.tick_upper = tr.tick2;
	
	calcRealPriceRange(); 
	if (!calcAssetAmounts())
	{
	    sendErrResult("can not calc amounts (check price range and input token_amount)"); 
	    return;
	}
	if (IS_SIMULATE) {sendResult(); return;}


	/////////////////SEND REAL MINT_TX////////////////////
	const liq_size = {token0: tx_options.amount0, token1: tx_options.amount1};
	liq_worker.tryMintByTicks(tr, liq_size).then((tx_result) => {
	    log("tx_result:", tx_result);
	    if (!hasField(tx_result, "tx_hash")) {sendErrResult("wrong result of tx_mint"); return;}

	    result.tx_hash = tx_result.tx_hash;
	    result.tx_code = tx_result.code;
	    sendResult();
	});

    });
}
catch(e)
{
    const err = ("ERROR - " + e);
    sendErrResult(err);
}





//скрипт производит обмен токенов token0/token1 между собой, возвращает результат обмена.
//если поле 'simulate_mode' задать 'yes', скрипт выполнит обмен в режиме эмуляции, при этом можно посмотреть сколько токенов будет на выходе

//ARG_1
// один обязательный аргумент - json file со следующими полями:
//EXAMPLE
/*
{
    "pool_address": "0x2aceda63b5e958c45bd27d916ba701bc1dc08f7a",
    "input_token": 0,  // index of pair pool assets, maybe 0/1
    "dead_line": 120, //seconds
    "size": 16.5,
    "simulate_mode": "yes", // maybe yes/no

}
*/



//including
const m_base = require("./base.js");
const {space, log, curTime, delay, isInt, varNumber, jsonFromFile, isJson, jsonKeys, hasField} = require("./utils.js");
const m_wallet = require("./obj_wallet.js");
const {ArgsParser} = require("./obj_argsparser.js");
const m_pool = require("./obj_pool.js");
const m_swapper = require("./obj_swapper.js");

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 490000; //единиц газа за транзакцию
const MAX_FEE = 340;  //Gweis
const PRIOR_FEE = -1;  //Gweis


// user vars
let result = {type: "swap"};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}    


//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {sendErrResult("invalid args (is empty)"); return;}
if (a_parser.count() != 1) {sendErrResult("invalid args (parameters != 1)"); return;}


//read args
const F_JSON = a_parser.first();
log("JSON-file: ", F_JSON);
const j_params  = jsonFromFile(F_JSON);
if (!isJson(j_params)) {sendErrResult("can not readed JSON data"); return;}
log("JSON parsed OK! \n\n DATA:", j_params);

//check filelds kit
if (!hasField(j_params, "pool_address")) {sendErrResult("json-params has not field <pool_address>"); return;}
if (!hasField(j_params, "input_token")) {sendErrResult("json-params has not field <input_token>"); return;}
if (!hasField(j_params, "dead_line")) {sendErrResult("json-params has not field <dead_line>"); return;}
if (!hasField(j_params, "size")) {sendErrResult("json-params has not field <size>"); return;}
if (!hasField(j_params, "simulate_mode")) {sendErrResult("json-params has not field <simulate_mode>"); return;}
log("JSON fields kit OK! ");
space();


//user const
const POOL_ADDR = j_params.pool_address;
const IS_SUMULATE = ((j_params.simulate_mode == "no") ? false : true);
const DEAD_LINE = Number.parseInt(j_params.dead_line);
const INPUT_TOKEN = Number.parseInt(j_params.input_token);
const INPUT_SUM = Number.parseFloat(j_params.size); // amount of input token
log("Input params OK!");
log("POOL_ADDR:", POOL_ADDR);
log("IS_SUMULATE:", IS_SUMULATE);
log("DEAD_LINE:", DEAD_LINE);
log("INPUT_TOKEN:", INPUT_TOKEN);
log("INPUT_SUM:", INPUT_SUM);





//body
log("//////////////////WITH SWAPPER_OBJ/////////////////////////");
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);

let s_obj = new m_swapper.SwapperObj(w_obj, POOL_ADDR);
s_obj.setSimulateMode(IS_SUMULATE); //TURN ON/OFF SIMULATE_MODE

result.pool_address = j_params.pool_address;
result.simulate_mode = j_params.simulate_mode;
result.input_token = j_params.input_token;
result.input_size = j_params.size;

if (IS_SUMULATE)
{
    try
    {
	s_obj.tokenSizeBySwapping(INPUT_SUM, INPUT_TOKEN).then((out) => {
	    log("out_size = ", out);    
	    result.output_size = out;
	    sendResult();
	});
    }
    catch(e) {const err = ("ERROR - " + e); sendErrResult(err);}
}
else
{
    try
    {
	s_obj.trySwap(INPUT_SUM, INPUT_TOKEN, DEAD_LINE).then((data) => {
    	    log("result: ", data)
    	    if (data.code == true) //send TX Ok!
    	    {
        	result.result_code = "OK";
        	result.tx_hash = data.tx_hash;
    	    }
    	    else result.result_code = "FAULT";
    	    space();
    	    sendResult();
	});
    }
    catch(e) {const err = ("ERROR - " + e); sendErrResult(err);}
}


//скрипт предназначен для выполнения запросов из сети на чтение.
//на вход подается 1 параметр - имя файла json, в котором описана структура запроса
//скрипт всегда возвращает json, в котором всегда присутствует поле req_name, его значение копируется из входного объекта(при условии что оно корректно).
//если в возвращаемом результате присутствует поле 'error', то скрипт выполнился неудачно(результат не получен).


//include
const {space, log, curTime, delay, countDecimals} = require("./../utils.js");
const { ParamParser } = require("./paramparser_class.js");
const { WalletObj } = require("./wallet_class.js");

// init script result var
let req_result = {req_name: "none"};
const sendResult = () => {space(); log("JSON_RESULT_START", req_result, "JSON_RESULT_END");}
const sendErrResult = (err) =>  {log("WARNING: script breaked!!!"); req_result.error = err; sendResult();}

//read input args
const n_arg = process.argv.length - 2;
if (n_arg != 1) {sendErrResult(`invalid args count(${n_arg}), must be 1 arg`); return -1;}
const p_parser = new ParamParser(process.argv[2]);
if (p_parser.invalid()) {sendErrResult(p_parser.err); return -2;}

let w_obj = new WalletObj(process.env.WA2  /*, process.env.WKEY*/ );
if (w_obj.invalid()) {sendErrResult("walid object is invalid"); return -3;}

req_result.req_name = p_parser.reqName();
// --------- try request for getting chain data ------------------
async function main()
{
    space();
    log("running chain request ....");
    if (p_parser.isBalanceReq())
    {
	log("[CMD/BALANCE]");
	await w_obj.updateBalances();
	w_obj.showBalances();	
	w_obj.assets.forEach(v => {
	    req_result[v.name] = v.balance;
	});
    }
};


const start_req = async () => {
    try { await main(); sendResult(); }
    catch(e) {sendErrResult(e);}
};


start_req();



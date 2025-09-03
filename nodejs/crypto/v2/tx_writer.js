//скрипт предназначен для выполнения реальных транзакций, т.е. запросов сети на запись.
//на вход подается 1 параметр - имя файла json, в котором описаны параметры транзакции, включая параметр(не обязательный) - режим симуляции, по умолчанию 'yes'.
//скрипт всегда возвращает json, в котором всегда присутствует поле req_name, его значение копируется из входного объекта(при условии что оно корректно).
//если в возвращаемом результате присутствует поле 'error', то скрипт выполнился неудачно(результат не получен).


//include
const {space, log, curTime, delay, hasField, isFloat} = require("./../utils.js");
const { ParamParser } = require("./paramparser_class.js");
const { WalletObj } = require("./wallet_class.js");
const { TxWorkerObj } = require("./txworker_class.js");
const { JSBIWorker } = require("./calc_class.js");

// init script result var
let req_result = {req_name: "none"};
const sendResult = () => {space(); log("JSON_RESULT_START", req_result, "JSON_RESULT_END");}
const sendErrResult = (err) =>  {log("WARNING: script breaked!!!"); req_result.error = err; sendResult();}

//read input args
const n_arg = process.argv.length - 2;
if (n_arg != 1) {sendErrResult(`invalid args count(${n_arg}), must be 1 arg`); return -1;} // проверка что запуск скрипта осуществляется с одним аргументом
const p_parser = new ParamParser(process.argv[2]);
if (p_parser.invalid()) {sendErrResult(p_parser.err); return -2;} // поле req_name либо отсутствует либо у него некорректное значение
if (!p_parser.isWritingReq()) {sendErrResult("req is not TX"); return -3;} // поле req_name не является для записи транзакции
if (!p_parser.writeFieldsKidOk()) {sendErrResult("invalid req fields kid"); log("JSON_FIELDS:", p_parser.keys); return -4;} // набор полей для текущего запроса некорректен

//init wallet obj
req_result.req_name = p_parser.reqName();
let w_obj = new WalletObj(process.env.WA2  , process.env.WKEY );
if (w_obj.invalid()) {sendErrResult("walid object is invalid"); return -11;}

//init tx_worker
let tx_worker = new TxWorkerObj(w_obj); 
let tx_params = {};




// проверка валидности вещественного значения (количества актива)
function validFloatSum(field_name)
{
    if (!hasField(p_parser.params, field_name)) return false;
    var sum = p_parser.params[field_name];
    sum = Number.parseFloat(sum);    
    if (!isFloat(sum)) {log(`WARNING: sum value(${field_name}) is not float`, p_parser.params[field_name]); return false;}
    if (sum < 0.01 || sum > 10000) {log(`WARNING: sum value(${field_name}) is not normal(small or big)`, sum); return false;}
    return true;
}

///////////////////////////making TX funcs///////////////////////////////////////////
function makeTxWrapParams()
{
    log("[TX_CMD/WRAP]");
    if (!validFloatSum("amount")) return;
    const amount = Number.parseFloat(p_parser.params["amount"]);        
    const bi_amount = JSBIWorker.floatToWeis(amount);
    
    //params OK
    log("Amount param OK:", amount);
    tx_params.tx_kind = p_parser.reqName();
    tx_params.value = bi_amount.toString();
    req_result.amount = p_parser.params["amount"];
    req_result.token_address = w_obj.assets[0].address;
}
function makeTxUnwrapParams()
{
    log("[TX_CMD/UNWRAP]");
    if (!validFloatSum("amount")) return;
    const amount = Number.parseFloat(p_parser.params["amount"]);        
    const bi_amount = JSBIWorker.floatToWeis(amount);
    
    //params OK
    log("Amount param OK:", amount);
    tx_params.tx_kind = p_parser.reqName();
    tx_params.value = bi_amount.toString();
    req_result.amount = p_parser.params["amount"];
    req_result.token_address = w_obj.wrapedNativeAddr();
}
async function tryWriteTx() // проверить параметры и отправить транзакцию в сеть
{
    if (!hasField(tx_params, "tx_kind")) {req_result.error = "invalid tx_params"; return;}   

    tx_worker.isSimulate = p_parser.simulateMode();
    const tx_result = await tx_worker.sendTx(tx_params);

    //check result
    if (!hasField(tx_result, "result")) 
    {
	req_result.error = "invalid tx executed, field <result> not found"; 
	req_result.code = -9999; 
	return;
    }   
    if (tx_result.result == "FAULT")
    {
	req_result.error = "tx executed is FAULT"; 
	req_result.code = tx_result.code; 
	return;
    }

    /// finished OK
    req_result.code = 0; 
    if (tx_worker.isSimulate) req_result.estimated_gas = tx_result.estimated_gas;
    else req_result.tx_hash = tx_result.tx_hash;    
}


// --------- try make tx chain  ------------------
async function main()
{
    space();
    log("running chain writing(TX) request ....");
    req_result.simulate_mode = (p_parser.simulateMode() ? "yes" : "no");

    if (p_parser.isWrapTxReq()) makeTxWrapParams();
    else if (p_parser.isUnwrapTxReq()) makeTxUnwrapParams();

    await tryWriteTx();
};


const start_req = async () => {
    try { await main(); sendResult(); }
    catch(e) {sendErrResult(e);}
};


start_req();



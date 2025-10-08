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
const { ChainObj } = require("./chain_class.js");
const { ContractObj } = require("./contract_class.js");
const { PosManagerObj } = require("./posmanager_class.js");


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
else {space(); log("Fields kid ok!  "); space();}

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
function makeTxTransferParams()
{
    log("[TX_CMD/TRANSFER]");
    if (!validFloatSum("amount")) return;
    const amount = Number.parseFloat(p_parser.params["amount"]);        
    const w_asset = w_obj.findAsset(p_parser.params["token_address"]);
    if (!hasField(w_asset, "decimal") || w_asset.decimal <= 0) {log(`WARNING: decimal invalid of asset (${w_asset})`, "  addr=", p_parser.params["token_address"]); return;}    
    const bi_amount = JSBIWorker.floatToWeis(amount, w_asset.decimal);
    
    //params OK
    log("Amount param OK:", amount);
    log("Target wallet:", p_parser.params["to_wallet"]);
    log("Token:", w_asset);
    tx_params.tx_kind = p_parser.reqName();
    tx_params.value = bi_amount.toString();
    tx_params.token_address = p_parser.params["token_address"];
    if (ChainObj.nativeToken() == w_asset.ticker) tx_params.token_address = "";
    tx_params.to_wallet = p_parser.params["to_wallet"];
        
    req_result.amount = p_parser.params["amount"];
    req_result.token_address = p_parser.params["token_address"];
    req_result.to_wallet = p_parser.params["to_wallet"];
}
function makeTxApproveParams()
{
    log("[TX_CMD/APPROVE]");
    if (!validFloatSum("amount")) return;
    const amount = Number.parseFloat(p_parser.params["amount"]);        
    const w_asset = w_obj.findAsset(p_parser.params["token_address"]);
    if (!hasField(w_asset, "decimal") || w_asset.decimal <= 0) {log(`WARNING: decimal invalid of asset (${w_asset})`, "  addr=", p_parser.params["token_address"]); return;}    
    const bi_amount = JSBIWorker.floatToWeis(amount, w_asset.decimal);

    //check to_contract field
    const contr = p_parser.params["to_contract"];
    if (contr=="pos_manager") tx_params.to_contract = ContractObj.posManagerAddress();
    else if (contr=="swap_router") tx_params.to_contract = ContractObj.swapRouterAddress();
    else {log(`WARNING: invalid to_contract field (${contr})`); return;}    

    
    //params OK
    log("Amount param OK:", amount);
    log("TO contract:", p_parser.params["to_contract"]);
    log("Token:", w_asset);
    tx_params.tx_kind = p_parser.reqName();
    tx_params.value = bi_amount.toString();
    tx_params.token_address = p_parser.params["token_address"];
        
    req_result.amount = p_parser.params["amount"];
    req_result.token_address = p_parser.params["token_address"];
    req_result.to_contract = p_parser.params["to_contract"];
}
function makeTxSwapParams()
{
    log("[TX_CMD/SWAP]");
    if (!validFloatSum("input_amount")) return;
    const amount = Number.parseFloat(p_parser.params["input_amount"]);        
    const t_index = Number.parseInt(p_parser.params["input_index"]);        
    const t_addr = ((t_index == 0) ? p_parser.params["token0_address"] : p_parser.params["token1_address"]);
    const w_asset = w_obj.findAsset(t_addr);
    if (!hasField(w_asset, "decimal") || w_asset.decimal <= 0) {log(`WARNING: decimal invalid of asset (${w_asset})`, "  addr=", p_parser.params["token_address"]); return;}    
    const bi_amount = JSBIWorker.floatToWeis(amount, w_asset.decimal);

    //params OK
    log("Amount param OK:", amount);
    log("Input index:", t_index);
    log("Token:", w_asset);

    tx_params.tx_kind = p_parser.reqName();
    tx_params.amountIn = bi_amount.toString();
    tx_params.tokenIn = ((t_index == 0) ? p_parser.params["token0_address"] : p_parser.params["token1_address"]);
    tx_params.tokenOut = ((t_index == 0) ? p_parser.params["token1_address"] : p_parser.params["token0_address"]);
    tx_params.fee = p_parser.params["fee"];
    tx_params.recipient = w_obj.address;
    tx_params.amountOutMinimum = 0;
    tx_params.sqrtPriceLimitX96 = 0;

    req_result.input_amount = p_parser.params["input_amount"];
    req_result.input_index = p_parser.params["input_index"];
    req_result.tokenIn = tx_params.tokenIn;
    req_result.tokenOut = tx_params.tokenOut;
    req_result.pool_address = p_parser.params["pool_address"];

}
function makeTxBurnPosParams()
{
    log("[TX_CMD/BURN_POSITIONS]");
//    let pm_obj = new PosManagerObj(w_obj);
//    pm_obj.pid_list = p_parser.params.pid_arr;
    log("burning positions: ", p_parser.params.pid_arr.length);
    if (p_parser.params.pid_arr.length <= 0) {log(`WARNING: pid_arr is empty`); return;}    
    else log("PIDs: ", p_parser.params.pid_arr);

    tx_params.tx_kind = p_parser.reqName();
    if (p_parser.params.pid_arr.length > 1) tx_params.pid_arr = p_parser.params.pid_arr;
    else tx_params.pid = p_parser.params.pid_arr[0];

    req_result.pid_arr = p_parser.params.pid_arr;
}









// SEND TX FUNCTION
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
    if (tx_worker.isSimulate) 
    {
	req_result.estimated_gas = tx_result.estimated_gas;
	if (p_parser.isSwapTxReq()) req_result.out_amount= tx_result.amount_out;
    }
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
    else if (p_parser.isTransferTxReq()) makeTxTransferParams();
    else if (p_parser.isApproveTxReq()) makeTxApproveParams();
    else if (p_parser.isSwapTxReq()) makeTxSwapParams();
    else if (p_parser.isBurnPosTxReq()) makeTxBurnPosParams();

//    log("TX_PARAMS:", tx_params);
    space();
    await tryWriteTx();
};


const start_req = async () => {
    try { await main(); sendResult(); }
    catch(e) {sendErrResult(e);}
};


start_req();



//скрипт предназначен для выполнения запросов из сети на чтение.
//на вход подается 1 параметр - имя файла json, в котором описана структура запроса
//скрипт всегда возвращает json, в котором всегда присутствует поле req_name, его значение копируется из входного объекта(при условии что оно корректно).
//если в возвращаемом результате присутствует поле 'error', то скрипт выполнился неудачно(результат не получен).


//include
const {space, log, curTime, delay, hasField, mergeJson} = require("./../utils.js");
const { ParamParser } = require("./paramparser_class.js");
const { WalletObj } = require("./wallet_class.js");
const { PosManagerObj } = require("./posmanager_class.js");
const { TxWorkerObj } = require("./txworker_class.js");
const { PoolObj } = require("./pool_class.js");

// init script result var
let req_result = {req_name: "none"};
const sendResult = () => {space(); log("----- Finaly script result -----"); log("JSON_RESULT_START", req_result, "JSON_RESULT_END");}
const sendErrResult = (err) =>  {log("WARNING: script breaked!!!"); req_result.error = err; sendResult();}

//read input args
const n_arg = process.argv.length - 2;
if (n_arg != 1) {sendErrResult(`invalid args count(${n_arg}), must be 1 arg`); return -1;} // проверка что запуск скрипта осуществляется с одним аргументом
const p_parser = new ParamParser(process.argv[2]);
if (p_parser.invalid()) {sendErrResult(p_parser.err); return -2;} // поле req_name либо отсутствует либо у него некорректное значение
if (!p_parser.isReadingReq()) {sendErrResult("req is not reading"); return -3;} // поле req_name не является на чтение
if (!p_parser.readFieldsKidOk()) {sendErrResult("invalid req fields kid"); log("JSON_FIELDS:", p_parser.keys); return -4;} // набор полей для текущего запроса некорректен

//init wallet obj
req_result.req_name = p_parser.reqName();
let w_obj = new WalletObj(process.env.WA2  , process.env.WKEY );
if (w_obj.invalid()) {sendErrResult("walid object is invalid"); return -11;} 

///////////////////////////requesting funcs///////////////////////////////////////////
async function getWaletBalance()
{
    log("[CMD/BALANCE]");
    await w_obj.updateBalances();
    w_obj.showBalances();	
    w_obj.assets.forEach(v => {req_result[v.name] = v.balance;});
}
async function getWaletTxCount()
{
    log("[CMD/TX_COUNT]");
    const ntx = await w_obj.txCount();
    log("tx count: ", ntx);
    req_result.data = ntx;
}
async function getChainGasPrice()
{
    log("[CMD/CHAIN_GAS_PRICE]");
    const gp = await w_obj.currentGasPrice();
    log("Gas: ", gp);
    if (hasField(gp, "gweis")) req_result.data = (gp.gweis + " gw"); 
    else req_result.error = "can't receive gweis field";
}
async function getChainID()
{
    log("[CMD/CHAIN_ID]");
    const cid = await w_obj.chainId();
    log("Chain ID: ", cid);
    req_result.data = cid.toString(); 
}
async function checkTxState()
{
    log("[CMD/TX_STATUS]");
    req_result.status = "UNKNOW";
    let tx_worker = new TxWorkerObj(w_obj);
    const tx_status = await tx_worker.checkTxByHash(p_parser.params.tx_hash);
    if (!hasField(tx_status, "status")) {sendErrResult("invalid result (is not JSON)"); return;}

    log("tx_status: ", tx_status);

    req_result.fee = "-1";
    req_result.finished = tx_status.finished;
    if (req_result.finished)
    {
        req_result.status = ((tx_status.status == 1) ? "OK" : "FAULT");
        req_result.fee = tx_status.fee; // native coin size
	req_result.gas_used = tx_status.gas_used;  // real gaslimit burned
	req_result.tx_hash = p_parser.params.tx_hash;
    }
    else log("tx executing else"); //tx executing else
}
async function getApprovedTokenAmounts()
{
    log("[CMD/APPROVED]");
    const data = await w_obj.getMainApprovedAmounts(p_parser.params.token_address);
    log("data:", data);

    if (!hasField(data, "pos_manager") || !hasField(data, "swap_router")) {req_result.error="invalid result_approved object"; return;}
    if (data.pos_manager<0 || data.swap_router<0) {req_result.error="invalid asset address"; return;}
    mergeJson(req_result, data);        
}
async function getPoolState()
{
    log("[CMD/POOL_STATE]");
    let pool_obj = new PoolObj(p_parser.params.pool_address);
    pool_obj.fee = p_parser.params.fee;
    pool_obj.updateToken0(w_obj.findAsset(p_parser.params.token0_address));
    pool_obj.updateToken1(w_obj.findAsset(p_parser.params.token1_address));
    pool_obj.out();

    if (pool_obj.invalid()) {req_result.error="invalid pool object"; return;}
    space();

    await pool_obj.updateState();
    pool_obj.outState();
    if (pool_obj.invalidState()) {req_result.error="invalid state pool object"; return;}
    space();
    
    await pool_obj.updateTVL();
    space();
    pool_obj.token0.out();
    pool_obj.token1.out();

    //prepare finaly script result
    req_result.pool_address = p_parser.params.pool_address;
    req_result.tick = pool_obj.state.tick.toString();
    req_result.tvl0 = pool_obj.token0.balance.toString();
    req_result.tvl1 = pool_obj.token1.balance.toString();
    req_result.price0 = pool_obj.state.price0.toString();
    req_result.price1 = ((1/pool_obj.state.price0).toFixed(8)).toString();

}
async function getWalletPositions()
{
    log("[CMD/WALLET_POSITIONS]");
    let pm_obj = new PosManagerObj(w_obj);
    const res = await pm_obj.updatePosData();		
    log("pos data result: ", res);
    
    req_result.result = res;
    if (res) req_result.pos_count = pm_obj.pid_list.length;
    else req_result.pos_count = "-1";
}
async function getPosState()
{
    log("[CMD/POS_STATE]");
    let pm_obj = new PosManagerObj(w_obj);
    pm_obj.pid_list = p_parser.params.pid_arr;
    let data = await pm_obj.getPosState(p_parser.params.pool_addresses);

    if (data.code == 0)
    {
	log("Request finished OK!");
	mergeJson(req_result, data);        	
    }
    else	
    {
	req_result.error = "can't executing request: "+req_result.req_name;	
	log("Request FAULT!");	
    }
}

// --------- try request for getting chain data ------------------
async function main()
{
    space();
    log("running chain reading request ....");
    if (p_parser.isBalanceReq()) await getWaletBalance();
    else if (p_parser.isTxCountReq()) await getWaletTxCount();
    else if (p_parser.isGasPriceReq()) await getChainGasPrice();
    else if (p_parser.isChainIdReq()) await getChainID();
    else if (p_parser.isTxStatusReq()) await checkTxState();
    else if (p_parser.isApprovedReq()) await getApprovedTokenAmounts();
    else if (p_parser.isPoolStateReq()) await getPoolState();
    else if (p_parser.isPosStateReq()) await getPosState();
    else if (p_parser.isPositionsReq()) await getWalletPositions();
    else 
    {
	req_result.error = "unknown req_name";	
    }
};
// run main func
const start_req = async () => {
    try { await main(); sendResult(); }
    catch(e) {sendErrResult(e);}
};


start_req();



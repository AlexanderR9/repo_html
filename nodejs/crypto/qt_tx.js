//скрипт выполняется с одним обязательным аргументом - HASH транзакции.
//подразумевается что транзакция была отправлена в сеть.
//скрипт проверяет текущий статус и результат выполнения,
//а так же вернет стоимость(комиссия) в нативных токенах если она была успешно выполнена.


//including
const {space, log, curTime, delay, isInt, varNumber, isJson} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");
const m_wallet = require("./obj_wallet.js");
const {TxWorkerObj} = require("./obj_txworker.js");


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



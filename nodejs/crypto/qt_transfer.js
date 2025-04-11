//desc of script
//скрипт совершает отправку токенов со своего кошелька на другой. 
//скрипт принимает три обязательных аргумента

//ARG_1
//адрес отправляемого токена, если отправляется нативный токен то нужно указать его название, пример: 'POL'
//ARG_2
// публичный адрес кошелька, кому отправляем
//ARG_3
//сумма токена, которую нужно переслать, пример: 25.5

//в любых других случаях комбинации аргументов выдаст ошибку, и завершит работу


//including
const m_base = require("./base.js");
const {space, log, curTime, delay, isInt, varNumber} = require("./utils.js");
const m_wallet = require("./obj_wallet.js");
const {ArgsParser} = require("./obj_argsparser.js");

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 265000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis
const PRIOR_FEE = -1;  //Gweis


// user vars
let TOKEN_ADDR = ""; //arg 1
let AMOUNT = -1; //arg 3
let TO_WALLET = "none"; //arg 2

let result = {};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}

//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {sendErrResult("invalid args (is empty)"); return;}
if (a_parser.count() != 3) {sendErrResult("invalid args (count)"); return;}

//check args validity
TOKEN_ADDR = a_parser.first();
TO_WALLET = a_parser.at(1);
AMOUNT = a_parser.at(2);
if (!varNumber(AMOUNT)) {sendErrResult("invalid arg_3 (incorrect sum - "+a_parser.at(2)+")"); return;}



//////////// ARGS OK ////////////////////
log("Try transfer TOKEN:", TOKEN_ADDR, "..............");
log("TO_WALLET:", TO_WALLET, " / AMOUNT:", AMOUNT);
result.type = "tx_transfer";

//WALLET DATA
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);

var i_asset = -1;
if (TOKEN_ADDR == m_base.nativeToken()) i_asset = 0;
else i_asset = w_obj.assetIndexOf(TOKEN_ADDR);
if (i_asset < 0) {sendErrResult("invalid token address (not found in wallet)"); return;}
log("transfering token index: ", i_asset);


// try send tx    
w_obj.trySend(i_asset, TO_WALLET, AMOUNT).then((data) => {

    log("result: ", data);
    if (data.code == true) //send TX Ok!
    {
        result.result_code = "OK";
        result.tx_hash = data.tx_hash;
    }
    else result.result_code = "FAULT";
    space();
    sendResult();

});



/*





function checkResultTx(data)
{
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
}

// try send tx    
let w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
if (COMMAND == "wrap")
{
    result.type = "tx_wrap";
    w_obj.wrapNative(AMOUNT).then((data) => {
	log("result: ", data);
	checkResultTx(data);
        sendResult();
    });
}
else
{
    result.type = "tx_unwrap";
    w_obj.unwrapNative(AMOUNT).then((data) => {
	log("result: ", data);
	checkResultTx(data);
        sendResult();
    });
}


*/


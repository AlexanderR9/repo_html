//desc of script
//скрипт совершает wrap/unwrap токенов с указанным адресом токена, находящимся в кошельке, 
//wrap можно выполнить только для нативного токена, unwrap соответственно наоборот.
//скрипт принимает три обязательных аргумента

//ARG_1
//тип команды: wrap/unwrap, любое другое значение некорректно
//ARG_2
// имя токена, может быть только вида POL/WPOL, или аналогичной пары для других сетей
//ARG_3
//сумма, которую нужно преобразовать, задается в виде числа, пример: 25.5

//в любых других случаях комбинации аргументов выдаст ошибку, и завершит работу


//including
const m_base = require("./base.js");
const {space, log, curTime, delay, isInt, varNumber} = require("./utils.js");
const m_wallet = require("./obj_wallet.js");
const {ArgsParser} = require("./obj_argsparser.js");

// user vars
let TOKEN_NAME = ""; //arg 2
let AMOUNT = -1; //arg 3
let COMMAND = "none"; //arg 1

let result = {};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}


//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {sendErrResult("invalid args (is empty)"); return;}
if (a_parser.count() != 3) {sendErrResult("invalid args (count)"); return;}


//check args validity
COMMAND = a_parser.first();
if (COMMAND != "wrap" && COMMAND != "unwrap") {sendErrResult("invalid arg1 (incorrect command name)"); return;}
TOKEN_NAME = a_parser.at(1);
const nt = m_base.nativeToken();
const wnt = ("W"+nt);
if (TOKEN_NAME != nt && TOKEN_NAME != wnt) {sendErrResult("invalid arg2 (incorrect token name)"); return;}

if (TOKEN_NAME == nt && COMMAND != "wrap") {sendErrResult("invalid combination arg1/arg2"); return;}
if (TOKEN_NAME == wnt && COMMAND != "unwrap") {sendErrResult("invalid combination arg1/arg2"); return;}

AMOUNT = a_parser.at(2);
if (!varNumber(AMOUNT)) {sendErrResult("invalid arg_3 (incorrect sum - "+a_parser.at(2)+")"); return;}



//////////// ARGS OK ////////////////////
log("TRY operation:", COMMAND, "..............");
log("TOKEN_NAME:", TOKEN_NAME, " / AMOUNT:", AMOUNT);

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
result.token = TOKEN_NAME;
result.size = AMOUNT.toString();

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





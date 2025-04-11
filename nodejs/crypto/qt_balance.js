
//desc of script
//подготавливает балансы активов в формате json.
//обязателен один аргумент, 1 или 2 (номер кошелька)

//include
const m_base = require("./base.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const m_wallet = require("./obj_wallet.js");
const {ArgsParser} = require("./obj_argsparser.js");


// user vars
let WALLET_NUMBER = -1;
let result = {};

//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty() && a_parser.isNumber(0))  
{
    const x = a_parser.first();
    if (x == 1 || x == 2) WALLET_NUMBER = Number.parseInt(x);
}

const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");

if (WALLET_NUMBER < 0)
{
    result.error = "invalid args";
    log("WARNING: invalid args");
    //log("JSON_RESULT_START", result, "JSON_RESULT_END");
    sendResult();
    return;
}

result.type = "update";

//WALLET DATA
let w_obj = new m_wallet.WalletObj((WALLET_NUMBER==1) ? process.env.WA1 : process.env.WA2);
w_obj.out();
space();
w_obj.updateBalance().then((is_ok) => {

    if (!is_ok)
    {
	result.error = "error updating";
	sendResult();
	return;
    }

    const n = w_obj.assetsCount();
    for (var i=0; i<n; i++)
    {
	const key = w_obj.assets[i].address;
	const value = w_obj.assets[i].balance;
	result[key] = value;
    }
    sendResult();

});


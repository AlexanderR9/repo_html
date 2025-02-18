
//desc of script
//показывает балансы всех токенов кошелька.
//если запустить скрипт с аргументом, то так можно указать для какого кошелька вывести балансы активов.
//1-для WA1, 2-для WA2, по умолчанию выводит для WA2.

//include
const m_base = require("./base.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const m_wallet = require("./wallet.js");
const {ArgsParser} = require("./argsparser.js");


// user vars
let WALLET_NUMBER = 2;

//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty() && a_parser.isNumber(0))  
{
    const x = a_parser.first();
    if (x == 1) WALLET_NUMBER = 1;
}

//WALLET DATA
let w_obj = new m_wallet.WalletObj((WALLET_NUMBER==1) ? process.env.WA1 : process.env.WA2);
w_obj.out();
w_obj.updateBalance().then(() => w_obj.showBalances());


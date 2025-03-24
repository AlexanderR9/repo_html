//скрипт выполняется с одним обязательным аргументом - HASH транзакции.
//скрипт выведет текущий статус и результат выполнения.


//including
const m_wallet = require("./obj_wallet.js");
const {space, log} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");


let TX_HASH = "";
//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {log("ERROR: you must point TX_HASH value"); return -1;}
TX_HASH = a_parser.at(0).trim();
if (TX_HASH.length < 20) {log("ERROR: wrong TX_HASH value, ", TX_HASH); return -2;}

log(`TX_HASH = [${TX_HASH}]`);


//body
let w_obj = new m_wallet.WalletObj(process.env.WA2);
w_obj.checkTxByHash(TX_HASH).then((res) => log("HASH checking has done. STATUS ", res));


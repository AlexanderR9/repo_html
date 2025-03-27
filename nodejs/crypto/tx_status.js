//скрипт выполняется с одним обязательным аргументом - HASH транзакции.
//скрипт выведет текущий статус и результат выполнения.
//если скрипт выполнить без параметров, то скрипт попытается вывести файла логов транзакций.
//так же можно в качестве аргумента задать -1 или -2, 
//это значит что скрипт попыается найти статус последней/предпоследней транзакции из списка в файле логов.


//including
const m_wallet = require("./obj_wallet.js");
const {space, log, isInt} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");
const {TxWorkerObj} = require("./obj_txworker.js");


let TX_HASH = "";
let SHOW_TX_LIST = false;
let LAST_NUMBER = 0;

//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) 
{
    log("try show TX log_file ....");	
    SHOW_TX_LIST = true;
}
else
{
    const a = a_parser.at(0).trim();
    log("a = ", a);
//    if (isInt(a))
    {
//	log("integer");
	if (a == -1 || a == -2) LAST_NUMBER = Number.parseInt(a);
	else TX_HASH = a;
    }
//    else TX_HASH = a;
}

if (!SHOW_TX_LIST && LAST_NUMBER == 0)
{
    //check hash correct value
    if (TX_HASH.length < 20) {log("ERROR: wrong TX_HASH value, ", TX_HASH); return -2;}
    else log(`TX_HASH = [${TX_HASH}]`);
}


//body
let w_obj = new m_wallet.WalletObj(process.env.WA2);
let tx_obj = new TxWorkerObj(w_obj);
if (SHOW_TX_LIST) //only show TX records
{
    tx_obj.loadTxFile();
    tx_obj.showTXList();
    log("TX count:", tx_obj.txCount());
}
else
{
    if (LAST_NUMBER == -1 || LAST_NUMBER == -2)
    {
	//log("LAST_NUMBER", LAST_NUMBER);
	tx_obj.loadTxFile();
	log("tx count", tx_obj.txCount());
	if (tx_obj.txCount() < 2) {log("ERROR: TX list is empty"); return -3;}
	const i = tx_obj.txCount() + LAST_NUMBER;
	log("tx index ", i);
	TX_HASH = tx_obj.tx_list[i].hash;
    }
    tx_obj.checkTxByHash(TX_HASH).then((res) => log("HASH checking has done. STATUS ", res));
}


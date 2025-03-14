//скрпит для работы с ликвидностью пула,
//если 1-м аргументом задать ключ mint то скрипт попытается создать новую позу в пуле POOL_ADDR.    
//если 1-м аргументом задать ключ close то скрипт попытается удалить ликвидность из позы POS_PID.    
//если 1-м аргументом задать ключ take то скрипт попытается вывести на кошелек все невостребуванные токены-комиссии позы POS_PID.    
//если не выполнить скрипт без аргументов, то скрипт просто запросит количество совершенных транзакций кошелька.


//including
const m_base = require("./base.js");
const m_wallet = require("./wallet.js");
const m_posManager = require("./posmanager.js");
const w_liq = require("./liq_worker.js");
const {space, log, curTime} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");

//const t = -45613;
//if (Number.isInteger(t)) log(t, "  is integer");
//else log(t, "  is INVALID integer");

//const ticks = { tick1: -291560, tick2: -290850 }
//if (ticks.tick1 >= ticks.tick2) log("invalid_2"); 
//return 0;



// USER VARS
let NONE_ARGS = false;
let LIQ_MODE = 0; // 1-mit_pos, 2-decrease_liq, 3-collect_fees, -1-error

//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty())
{
    if (a_parser.at(0) == "mint") LIQ_MODE = 1;
    else if (a_parser.at(0) == "close") LIQ_MODE = 2;
    else if (a_parser.at(0) == "take") LIQ_MODE = 3;
    else {log("ERROR: invalid argument ", a_parser.at(0)); LIQ_MODE = -1;}
}
else NONE_ARGS = true;
if (LIQ_MODE < 0) return;

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 760000; //единиц газа за транзакцию
const MAX_FEE = 520;  //Gweis
const PRIOR_FEE = 60;  //Gweis

//адрес пула в котором добавляется/удаляется ликвидность
let POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb";  // WPOL/USDC 0.5%

//PID позиции с которой совершаются некие действия
let POS_PID = "";

//test debug
log("INFURA RPC_URL:", process.env.INFURA_URL.toString());
log("Current chain:", m_base.currentChain(), ` / NATIVE_TOKEN (${m_base.nativeToken()})`);
space();    

//////////////// BODY ///////////////////////////

// init walet object
const w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE, PRIOR_FEE);
if (NONE_ARGS)
{
    w_obj.txCount().then((data) => { log("tx_count: ", data); return; });
}
else
{


//init PosManager
log("-------------- POS INFO -------------------");
let pm = new m_posManager.PosManager(w_obj.address);
pm.loadPosDataFromFile();
const pos = pm.posAt(0);
if (!pos) {log("WARNING: posAt(0) is null"); return;}
log("POS_0 DATA:", pos.out(), "\n\n\n");
POS_PID = pos.pid;


    //init LIQ_WORKER
    let liq_worker = new w_liq.LiqWorker(w_obj, POOL_ADDR);
    switch (LIQ_MODE)
    {
	case 1: 
	{
	    log("----------- MODE: mint new position --------------");
	    const p1 = 0.206;
	    const p2 = 0.212;
	//    const liq = {token0: 10, token1: -1};
	    const liq = {token0: -1, token1: 8};
	//    liq_worker.setSimulateMode(false);
	    liq_worker.tryMint(p1, p2, liq).then((code) => { log("minting pos result: ", code); });
	    break;
	}
	case 2:
	{
	    log("----------- MODE: decrease liquidity of position --------------");
	    liq_worker.tryDecrease(POS_PID, pos.liq).then((code) => { log("removing pos result: ", code); });
	    break;
	}
	case 3:
	{
	    log("----------- MODE: collect tokens from position --------------");
	    liq_worker.tryCollect(POS_PID).then((code) => {  log("collection pos result: ", code); });
	    break;
	}
	default: {log("ERROR: Invalid mode ", LIQ_MODE); break;}
    }
}


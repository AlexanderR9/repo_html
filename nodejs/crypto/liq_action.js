//скрпит для работы с ликвидностью пула,
//если 1-м аргументом задать ключ mint то скрипт попытается создать новую позу в пуле POOL_ADDR.    
//если 1-м аргументом задать ключ remove то скрипт попытается удалить ликвидность из позы POS_PID.    
//если 1-м аргументом задать ключ take то скрипт попытается вывести на кошелек все невостребуванные токены-комиссии позы POS_PID.    
//если 1-м аргументом задать ключ add то скрипт попытается добавить ликвидность в уже существующую позу POS_PID.    
//2-м аргументом задается POS_PID, нужен только для операций 'add', 'remove', 'take'
//если не выполнить скрипт без аргументов, то скрипт просто запросит количество совершенных транзакций кошелька.


//including
const m_base = require("./base.js");
const m_wallet = require("./wallet.js");
const m_posManager = require("./posmanager.js");
const w_liq = require("./liq_worker.js");
const {space, log, curTime, isInt} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");

// USER VARS
let NONE_ARGS = false;
let LIQ_MODE = 0; // 1-mit_pos, 2-decrease_liq, 3-collect_fees, -1-error
let POS_PID = -1; //PID позиции с которой совершаются некие действия

//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty())
{
    if (a_parser.at(0) == "mint") LIQ_MODE = 1;
    else if (a_parser.at(0) == "remove") LIQ_MODE = 2;
    else if (a_parser.at(0) == "take") LIQ_MODE = 3;
    else if (a_parser.at(0) == "add") LIQ_MODE = 4;
    else {log("ERROR: invalid argument ", a_parser.at(0)); LIQ_MODE = -1;}

    if (a_parser.count() > 1)
    {
        POS_PID = Number.parseInt(a_parser.at(1));
        if (!isInt(POS_PID)) {log("WARNING: pos PID is not integer, ", POS_PID); return -1;}
    }    
}
else NONE_ARGS = true;
if (LIQ_MODE < 0) return;

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 360000; //единиц газа за транзакцию
const MAX_FEE = 280;  //Gweis
//const PRIOR_FEE = 50;  //Gweis
//адрес пула в котором добавляется/удаляется ликвидность
let POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb";  // WPOL/USDC 0.5%

//test debug
log("INFURA RPC_URL:", process.env.INFURA_URL.toString());
log("Current chain:", m_base.currentChain(), ` / NATIVE_TOKEN (${m_base.nativeToken()})`);
space();    

//////////////// BODY ///////////////////////////

// init walet object
const w_obj = new m_wallet.WalletObj(process.env.WA2, process.env.WKEY);
w_obj.setGas(GAS_LIMIT, MAX_FEE);
if (NONE_ARGS)
{
    w_obj.txCount().then((data) => { log("tx_count: ", data); return; });
}
else
{
    //init PosManager
    let pm = new m_posManager.PosManager(w_obj.address);
    pm.loadPosDataFromFile();
    const pos = pm.posByPID(POS_PID);

    //init LIQ_WORKER
    let liq_worker = new w_liq.LiqWorker(w_obj, POOL_ADDR);    
    liq_worker.setSimulateMode(false); //TURN ON/ALL SIMULATE_MODE	 !!!!!!!!!!!!!!!!!!

    //try some operation with position
    switch (LIQ_MODE)
    {
	case 1: 
	{
	    log("----------- MODE: mint new position --------------");
	    const p1 = 0.202;
	    const p2 = 0.234;
	    const liq = {token0: 60, token1: -1};
//	    const liq = {token0: -1, token1: 5.9};
	    w_obj.setGas(2*GAS_LIMIT, 2*MAX_FEE);
	    liq_worker.tryMint(p1, p2, liq).then((data) => { log("minting pos result: ", data); });
	    break;
	}
	case 2:
	{
	    log("----------- MODE: decrease liquidity of position --------------");
	    if (!pos) log(`WARNING: not found position record by PID(${POS_PID})`);
	    else liq_worker.tryDecrease(POS_PID, pos.liq).then((data) => { log("removing pos result: ", data); });
	    break;
	}
	case 3:
	{
	    log("----------- MODE: collect tokens from position --------------");
	    if (!pos) log(`WARNING: not found position record by PID(${POS_PID})`);
	    else liq_worker.tryCollect(POS_PID).then((data) => log("collection pos result: ", data));
	    break;
	}
	case 4: 
	{
	    log("----------- MODE: add liquidity to position --------------");
	    const liq = {token0: 10, token1: -1};
	    const tick_range = {tick1: pos.l_tick, tick2: pos.u_tick}; //position ticks range
//	    const liq = {token0: -1, token1: 5.9};
	    w_obj.setGas(2*GAS_LIMIT, 2*MAX_FEE);
	    liq_worker.tryIncrease(POS_PID, tick_range, liq).then((data) => { log("adding liq_pos result: ", data); });
	    break;
	}
	default: {log("ERROR: Invalid mode ", LIQ_MODE); break;}
    }
}


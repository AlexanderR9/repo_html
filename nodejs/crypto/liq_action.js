//скрпит для работы с ликвидностью пула,
//если 1-м аргументом задать ключ mint то скрипт попытается создать новую позу в пуле POOL_ADDR.    
//если 1-м аргументом задать ключ remove то скрипт попытается удалить ликвидность из позы POS_PID.    
//если 1-м аргументом задать ключ take то скрипт попытается вывести на кошелек все невостребуванные токены-комиссии позы POS_PID.    
//если 1-м аргументом задать ключ take_full то скрипт выполнит 2 операции сразу (последовательно) для ключей 'remove' и 'take'.    
//если 1-м аргументом задать ключ add то скрипт попытается добавить ликвидность в уже существующую позу POS_PID.    
//2-м аргументом задается POS_PID, нужен только для операций 'add', 'remove', 'take'
//последним аргументов (2-м или 3-м) можно задать ключ 'no-simulate', в это случае транзакция реально будет отправлена
//если не выполнить скрипт без аргументов, то скрипт просто запросит количество совершенных транзакций кошелька.


//including
const m_base = require("./base.js");
const m_wallet = require("./obj_wallet.js");
const m_posManager = require("./obj_posmanager.js");
const w_liq = require("./obj_liqworker.js");
const {space, log, curTime, isInt} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");

// USER VARS
let NONE_ARGS = false;
let LIQ_MODE = 0; // 1-mit_pos, 2-decrease_liq, 3-collect_fees, -1-error
let POS_PID = -1; //PID позиции с которой совершаются некие действия
let IS_SUMULATE = true; //поумолчанию скрипт только имитирует выполнение операции
let IS_HELP = false;


//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty())
{
    if (a_parser.at(0) == "mint") LIQ_MODE = 1;
    else if (a_parser.at(0) == "remove") LIQ_MODE = 2;
    else if (a_parser.at(0) == "take") LIQ_MODE = 3;
    else if (a_parser.at(0) == "take_full") LIQ_MODE = 5;
    else if (a_parser.at(0) == "-h") IS_HELP = true;
    else if (a_parser.at(0) == "add") LIQ_MODE = 4;
    else {log("ERROR: invalid argument ", a_parser.at(0)); LIQ_MODE = -1;}

    if (a_parser.count() > 1 && LIQ_MODE != 1)
    {
        POS_PID = Number.parseInt(a_parser.at(1));
        if (!isInt(POS_PID)) {log("WARNING: pos PID is not integer, ", POS_PID); return -1;}
    }    

    for (var i=1; i<a_parser.count(); i++)
	if (a_parser.at(i) == "no-simulate") IS_SUMULATE = false;
}
else NONE_ARGS = true;

if (IS_HELP)
{
    log("------------script manual--------------");
//    log("USER WALLET: ", WALLET)
    log("KEY: mint", "   ACTION: create new position");
    log("KEY: remove <pid_value>  [no-simulate]", "   ACTION: remove liquidity from position to unclaimed fees");
    log("KEY: take <pid_value>  [no-simulate]", "   ACTION: take assets from unclaimed fees to user_wallet");
    log("KEY: add <pid_value>  [no-simulate]", "   ACTION: add liquidity to position");
    log("KEY: take_full <pid_value>  [no-simulate]", "   ACTION: take_full = remove + take");
    log("KEY: [empty]", "   ACTION: getting all TX_count of wallet from chain");
    return;
}


if (LIQ_MODE < 0) return;

//константы для определения размера газа перед совершением транзакции
const GAS_LIMIT = 360000; //единиц газа за транзакцию
const MAX_FEE = 220;  //Gweis
//const PRIOR_FEE = 50;  //Gweis

//адрес пула в котором добавляется/удаляется ликвидность (нужен только для операций 'mint' , 'add')
//let POOL_ADDR = "0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb";  // WPOL/USDC 0.5%
let POOL_ADDR = "0x3d0acd52ee4a9271a0ffe75f9b91049152bac64b";  // USDC(PoS):LDO:0.3%
//let POOL_ADDR = "0xd36ec33c8bed5a9f7b6630855f1533455b98a418"; // USDC(PoS):USDC:0.01% 
//let POOL_ADDR = "0xd866fac7db79994d08c0ca2221fee08935595b4b"; // WPOL:LDO:0.3%
//let POOL_ADDR = "0x4d05f2a005e6f36633778416764e82d1d12e7fbb"; // WPOL:CRV:0.3%
//let POOL_ADDR = "0x9b08288c3be4f62bbf8d1c20ac9c5e6f9467d8b7"; // WPOL:USDT:0.05%




//test debug
log("INFURA RPC_URL:", process.env.INFURA_URL.toString());
log("Current chain:", m_base.currentChain(), ` / NATIVE_TOKEN (${m_base.nativeToken()})`);
log("Simulate mode: ", (IS_SUMULATE ? "YES" : "NO"));
space();    

//return 0;
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
    liq_worker.setSimulateMode(IS_SUMULATE); //TURN ON/OFF SIMULATE_MODE

    //try some operation with position
    switch (LIQ_MODE)
    {
	case 1: 
	{
	    log("----------- MODE: mint new position --------------");
	    w_obj.setGas(3*GAS_LIMIT, 2*MAX_FEE);

	    //ВНИМАНИЕ: перед отправкой mint  проверить - достаточно ли апрувно соответствующих токенов
	    const p_index = 1; //при индексе 1 требуется конвертация ценового диапазона
	    let p_range = {p1: 0.84, p2: 0.98};
	    if (p_index == 1)
	    {
		const p_range0 = w_liq.LiqWorker.invertPrices(p_range);
		log("p_range1: ", p_range);
		log("p_range0: ", p_range0);
		p_range.p1 = p_range0.p1;
		p_range.p2 = p_range0.p2;
	    }

	    
	    const liq = {token0: 100, token1: -1};
	    liq_worker.tryMint(p_range.p1, p_range.p2, liq).then((data) => { log("minting pos result: ", data); });
	    break;
	}
	case 4: 
	{
	    log("----------- MODE: increase liquidity to position --------------");
	    const liq = {token0: -1, token1: 30};
	    const tick_range = {tick1: pos.l_tick, tick2: pos.u_tick}; //position ticks range
	    w_obj.setGas(2*GAS_LIMIT, 2*MAX_FEE);
	    liq_worker.tryIncrease(POS_PID, tick_range, liq).then((data) => { log("adding liq_pos result: ", data); });
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
	case 5:
	{
	    log("----------- MODE: duplex operation (decrease and collect tokens from position) --------------");
	    if (!pos) log(`WARNING: not found position record by PID(${POS_PID})`);
	    else liq_worker.takeFull(POS_PID, pos.liq).then((data) => { log("removing pos result: ", data); });
	    break;
	}
	default: {log("ERROR: Invalid mode ", LIQ_MODE); break;}
    }
}


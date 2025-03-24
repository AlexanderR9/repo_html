//скрпит выводит информацию о  позициях, а так же перезаписывает файлы с данными.
//если 1-м аргументом задать ключ:
//  -с то скрипт выведет количество всех поз, для текущего аккаунта.    
//  -fpid то скрипт запросит все PID поз и перезапишет файл pid_list.txt.    
//  -pid то скрипт прочитает файл pid_list.txt и выведет список PID позиций.    
//  -fdata то скрипт запросит все данные поз и перезапишет файл pos_data.txt (pid_list.txt уже должен быть).    
//  -complex скрипт выполнит ряд действий:  -fpid, -fdata, out_pos_filedata
//  -h то скрипт выводит справку по работе с ним.    
//  -a то скрипт выводит инфу о позах, в которых есть ликвидность.
//  <pid_value> - запросит в цепи данные указанной позы и выведет в нативном виде 
//если выполнить без аргументов скрипт заружает данные из pos_data.txt и выводит инфу о позах.




//including
const m_base = require("./base.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");

const m_pool = require("./obj_pool.js");
const {ArgsParser} = require("./obj_argsparser.js");
const m_posManager = require("./obj_posmanager.js");
const {PositionObj} = require("./obj_position.js");


let P_COUNT = false;
let F_PID = false;
let IS_PID = false;
let F_DATA = false;
let IS_HELP = false;
let COMPLEX = false;
let ONLY_ACTIVE = false;
const WALLET = process.env.WA2;
let PID_VALUE = -1;

//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty())
{
    if (a_parser.at(0) == "-c") P_COUNT = true;
    else if (a_parser.at(0) == "-fpid") F_PID = true;
    else if (a_parser.at(0) == "-pid") IS_PID = true;
    else if (a_parser.at(0) == "-complex") COMPLEX = true;
    else if (a_parser.at(0) == "-fdata") F_DATA = true;
    else if (a_parser.at(0) == "-h") IS_HELP = true;
    else if (a_parser.at(0) == "-a") ONLY_ACTIVE = true;
    else if (a_parser.at(0).length > 6 && a_parser.isNumber(0)) PID_VALUE = a_parser.at(0);

}
if (IS_HELP)
{
    log("------------script manual--------------");
    log("USER WALLET: ", WALLET)
    log("KEY: -c", "   ACTION: getiing from chain all positions count for user_wallet");
    log("KEY: -fpid", "   ACTION: getting all PID postions from chain and rewrite file [pid_list.txt]");
    log("KEY: -pid", "   ACTION: give out all PID postions from file [pid_list.txt]");
    log("KEY: -fdata", "   ACTION: getting all postions data from chain and rewrite file [pos_data.txt]");
    log("KEY: -complex", "   ACTION: run case -fpid, next -fdata, next out to debug file [pos_data.txt]");
    log("KEY: -h", "   ACTION: give out help text ");
    log("KEY: -a", "   ACTION: show only active pos ");
    log("KEY: <pid_value>", "   ACTION: give out pos data, native values view");
    return;
}



//test debug
log("INFURA RPC_URL:", m_base.RPC_URL() );
log("Current chain:", m_base.currentChain());
log("---------------------------------");

////////// BODY /////////////
let pm = new m_posManager.PosManager(WALLET);
if (P_COUNT)
{
    pm.getPosCount().then((n) => log("POS_COUNT:", n));
}
else if (F_PID)
{
    pm.fullUpdatePidList(10);
}
else if (F_DATA)
{
    pm.loadPidListFromFile();
    pm.updateArrPosData();
}
else if (COMPLEX)
{
    pm.fullUpdatePidList(10).then((result) => {
	if (result)
	{
	    //next stage
	    pm.loadPidListFromFile();
	    pm.updateArrPosData().then((result) => {	  
		if (result) {pm.loadPosDataFromFile(); pm.outFull();}   
		else log("ERROR: can't getting pos data from chain");
	    });  
	}
	else log("ERROR: can't getting PID list from chain");
    });
}
else if (IS_PID)
{
    pm.loadPidListFromFile();
    pm.outPIDList();
}
else if (ONLY_ACTIVE)
{
    pm.loadPosDataFromFile();
    pm.outActive();

}
else if (PID_VALUE > 0)
{
    const pos = new PositionObj(PID_VALUE, pm.contract);
    pos.updateData().then((result) => {
	log("result: ", result, '\n');
	pos.out();  space();
	log(pos.strTickRange());
	log(pos.strPriceRange(0));
	log(pos.strAssetsAmount());
	log(pos.strDepositedAssets(), '\n');

	pos.updateUnclaimedFees().then((result) => {
    	    log("result: ", result);
    	    log(pos.strUnclaimedFees());
    	    log("finished!!!");
	});
    });
}
else
{
    pm.loadPosDataFromFile();
    pm.syncByPoolsFile();
    pm.outFull();    
}









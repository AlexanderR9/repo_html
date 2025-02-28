//скрпит выводит информацию о  позициях, а так же перезаписывает файлы с данными.
//если 1-м аргументом задать ключ:
//  -с то скрипт выведет количество всех поз, для текущего аккаунта.    
//  -fpid то скрипт запросит все PID поз и перезапишет файл pid_list.txt.    
//  -fdata то скрипт запросит все данные поз и перезапишет файл pos_data.txt (pid_list.txt уже должен быть).    
//если выполнить без аргументов скрипт заружает данные из pos_data.txt и выводит инфу об активных позах.




//including
const m_base = require("./base.js");
const m_pool = require("./pool.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");
const m_posManager = require("./posmanager.js");

let P_COUNT = false;
let F_PID = false;
let F_DATA = false;

//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty())
{
    if (a_parser.at(0) == "-c") P_COUNT = true;
    else if (a_parser.at(0) == "-fpid") F_PID = true;
    else if (a_parser.at(0) == "-fdata") F_DATA = true;

}

//test debug
log("INFURA RPC_URL:", m_base.RPC_URL() );
log("Current chain:", m_base.currentChain());
log("---------------------------------");

////////// BODY /////////////
let pm = new m_posManager.PosManager(process.env.WA1);
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
else
{
    pm.loadPidListFromFile();
    pm.outActive();
}









//скрипт выполняется без аргументов.
//скрипт возвращает список данных позиций в текущем файле POS_DATA_FILE (для текущего кошелька в текущей сети.)
//скрипт в сети ничего не запрашивает

//ЛОГИКА СКРИПТА:
// - скрипт загружает из файла POS_DATA_FILE текущие данные о позициях, список уже известных 
// - скрипт синхронизирует данные со списком пулов
// - скрит возвращает список данных и завершает работу.



//including
const {space, log, curTime, delay, strReplace} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");
const {PosManager, POS_DATA_FILE} = require("./obj_posmanager.js");
const fs = require("fs");
const m_base = require("./base.js");


let result = {};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}


log("get POS_DATA list .....");
result.type = "pos_file_data";


////////// BODY /////////////
let pm = new PosManager(process.env.WA2);
pm.loadPosDataFromFile();
pm.syncByPoolsFile();

const n_data = pm.pos_list.length;
if (n_data <= 0) {sendErrResult("wrong n_data of pos_list"); return;}

for (var i=0; i<n_data; i++)
{
    const p = pm.pos_list[i];
    const key = p.pid.toString();
    let value = p.pool.address + " / " + p.pool.info;
    value = strReplace(value, ':', ';');
    value = value + " / " + "price_range(" + p.pricesRange.p1.toFixed(4).toString() + "; " + p.pricesRange.p2.toFixed(4).toString() + ")";
    value = value + " / " + "tick_range(" + p.l_tick + "; " + p.u_tick + ")";
    value = value + " / " + p.liq.toString();

    result[key] = value;

    

//    log("KEY: ", key);
//    log("VALUE: ", value);

}
    sendResult();	    


/*
pm.loadPidListFromFile();

pm.getPosCount().then((n) => {

    log("POS_COUNT:", n)
    if (n < 0) {sendErrResult("can't get pos_count"); return;}
    result.pos_count = n;

    var i = 0;
    let pid_arr = [];

    if (n > 0)
    {
	for (i=0; i<n; i++)
	    pid_arr.push(pm.pos_list[i].pid.toString());
    }


    if (n == pm.posDataCount())
    {
	log("Have not new position.");
	result.pids = pid_arr;
	sendResult();	    
	return;
    }


    const need_get = n - pm.posDataCount();
    pm.getPidList(pm.posDataCount(), need_get).then((new_pids) => {
    log("new pids:", "number ", new_pids.length);

        for (i=0; i<new_pids.length; i++)
        {
    	    pid_arr.push(new_pids[i].toString());
	    let fline = (i+pm.posDataCount()+1).toString()+"." + " / ";
            fline += new_pids[i].toString() + " / ";
            fline += "*" + pm.wallet.address.slice(-5) + " / ";
            fline += (m_base.currentChain() + '\n');        
            fs.appendFileSync(PID_FILE, fline);
        }	    

	result.pids = pid_arr;
	sendResult();	    

    });	


});
*/



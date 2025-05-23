//скрипт выполняется без аргументов.
//скрипт возвращает список всех PID позиций (для текущего кошелька в текущей сети.)

//ЛОГИКА СКРИПТА:
// - скрипт из сети запрашивает количество (N) всех позиций для текущего кошелька в текущей сети.
// - скрипт загружает из файла PID_FILE список уже известных id-шников, pid_arr
// - сравнивается значение полученное из сети с размером списка из файла, если одинаково то скрит возвращает этот список (pid_arr) и завершает работу.
// - если в файле id-шников меньше, значит скрипт запрашивает в сети недостающие, начиная с индекса = PID_FILE_list.size()
// - получая новые PID скрипт добавляет в PID_FILE соответствующие записи, а также добавляет новые PID => pid_arr
// - скрит возвращает список (pid_arr) и завершает работу.



//including
const {space, log, curTime, delay, isInt, varNumber, isJson} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");
const {PosManager, PID_FILE} = require("./obj_posmanager.js");
const fs = require("fs");
const m_base = require("./base.js");


let result = {};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}


log("get PID list .....");
result.type = "pid_list";


////////// BODY /////////////
let pm = new PosManager(process.env.WA2);
pm.loadPidListFromFile();

pm.getPosCount().then((n) => {

    log("POS_COUNT:", n)
    if (n < 0) {sendErrResult("can not get pos_count"); return;}
    result.pos_count = n;

    var i = 0;
    let pid_arr = [];
    const n_old = pm.posDataCount();
    log("n_old = ", n_old);
    if (n_old > 0)
    {
	for (i=0; i<n_old; i++)
	{
	    log("i=",i, "  pid: ", pm.pos_list[i].pid);
	    pid_arr.push(pm.pos_list[i].pid.toString());
	}
    }


    if (n == n_old)
    {
	log("Have not new position.");
	result.pids = pid_arr;
	sendResult();	    
	return;
    }
    else log("new pos appeared");


    const need_get = n - n_old;
    log("need get next pids ", need_get);

    pm.getPidList(n_old, need_get).then((new_pids) => {
    log("new pids:", "number ", new_pids.length);

        for (i=0; i<new_pids.length; i++)
        {
    	    pid_arr.push(new_pids[i].toString());
	    let fline = (i+n_old+1).toString()+"." + " / ";
            fline += new_pids[i].toString() + " / ";
            fline += "*" + pm.wallet.address.slice(-5) + " / ";
            fline += (m_base.currentChain() + '\n');        
            fs.appendFileSync(PID_FILE, fline);
        }	    

	result.pids = pid_arr;
	sendResult();	    

    });	


});


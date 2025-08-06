//скрипт выполняется без аргументов для выводы всей инфы из файла POS_DATA_FILE или с одним аргументом <PID> для получения краткой инфы о позе.
//скрипт возвращает список данных позиций в текущем файле POS_DATA_FILE (для текущего кошелька в текущей сети.)
//скрипт в сети ничего не запрашивает

//ЛОГИКА СКРИПТА:
// - скрипт загружает из файла POS_DATA_FILE текущие данные о позициях, список уже известных 
// - скрипт синхронизирует данные со списком пулов
// - скрит возвращает список данных и завершает работу.



//including
const {space, log, curTime, delay, strReplace} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");
const {PosManager, POS_DATA_FILE, PosData} = require("./obj_posmanager.js");
const fs = require("fs");
const m_base = require("./base.js");
const {PoolObj} = require("./obj_pool.js");



//user vars
let PID = "";
let result = {};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}


//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.count() > 1) {sendErrResult("invalid args (parameters > 2)"); return;}
if (a_parser.isEmpty()) 
{
    PID = ""; 
    log("get POS_DATA list .....");
    result.type = "pos_file_data";
}
else 
{
    PID = a_parser.first(); 
    log(`get POS_SHORT_INFO  PID[${PID}] list .....`);
    result.type = "pos_short_info";
}




////////// BODY /////////////
let pm = new PosManager(process.env.WA2);
pm.loadPosDataFromFile();
pm.syncByPoolsFile();

const n_data = pm.pos_list.length;
if (n_data <= 0) {sendErrResult("wrong n_data of pos_list"); return;}

if (PID != "")
{
    pm.getPosData(PID).then((pos_data) => {
	log("pos_data", pos_data);
	result.liq = pos_data.liquidity.toString();
	result.tick1 = pos_data.tickLower;
	result.tick2 = pos_data.tickUpper;
	result.fee = pos_data.fee;


	let ppos = pm.posByPID(PID);
	if (ppos == null) //this new pos
	{
	    ppos = new PosData(PID);
	    result.is_new = "yes";

	    ppos.liq = pos_data.liquidity;
	    ppos.l_tick = pos_data.tickLower;
	    ppos.u_tick = pos_data.tickUpper;
	    ppos.fee = pos_data.fee;
	    ppos.token0 = pos_data.token0.trim().toLowerCase();
	    ppos.token1 = pos_data.token1.trim().toLowerCase();

	    const pool_fdata = PoolObj.lookPoolsFile();
	    ppos.findOwnPool(pool_fdata);


	    space();
	    log(ppos.toStr());
	    space();
	    ppos.out();
	}
	else result.is_new = "no";
	
	result.pool_address = ppos.pool.address;
	result.pool_info = ppos.pool.info;

	sendResult();	    
	
    });
    return 1;
}

for (var i=0; i<n_data; i++)
{
    const p = pm.pos_list[i];
    const key = p.pid.toString();
    let value = p.pool.address + " / " + p.pool.info;
    value = strReplace(value, ':', ';');
    const prec = ( p.pricesRange.p1 > 50 ) ? 2 : 4; 
    value = value + " / " + "price_range(" + p.pricesRange.p1.toFixed(prec).toString() + "; " + p.pricesRange.p2.toFixed(prec).toString() + ")";
    value = value + " / " + "tick_range(" + p.l_tick + "; " + p.u_tick + ")";
    value = value + " / " + p.liq.toString();

    result[key] = value;
}
sendResult();	    


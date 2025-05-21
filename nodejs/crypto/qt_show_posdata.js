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
}
sendResult();	    


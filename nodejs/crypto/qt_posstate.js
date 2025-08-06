//скрипт выполняется с двумя аргументами <PID_POSITION>, <POOL_ADDRESS>.
//скрипт возвращает данные указанной позиции, отображающие ее текущее состояние

//ЛОГИКА СКРИПТА:
// - скрипт из сети запрашивает основные параметры позы.
// - скрипт синхронизирует позу с данными пула
// - проверяет необходимость внести изменения в файл POS_DATA_FILE (вслучае если там нет такой позы) и вносит если это надо
// - скрипт из сети запрашивает несобранные комиссии.
// - скрит возвращает собранные данные и завершает работу.



//including
const {space, log, curTime, delay, isInt, varNumber, amountToStr, priceToStr} = require("./utils.js");
const {ArgsParser} = require("./obj_argsparser.js");
const {PosManager, PosData} = require("./obj_posmanager.js");
const {PositionObj} = require("./obj_position.js");
const fs = require("fs");
const m_base = require("./base.js");
const m_wallet = require("./obj_wallet.js");
const {PoolObj} = require("./obj_pool.js");


let POS_PID = "";
let POOL_ADDR = "?";
let result = {};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}

//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {sendErrResult("invalid args (is empty)"); return;}
if (a_parser.count() != 2) {sendErrResult("invalid args (parameters != 1)"); return;}
POS_PID = a_parser.first();
if (POS_PID.length < 5) {sendErrResult("invalid arg1 (wrong POS_PID value)"); return;}
POOL_ADDR = a_parser.at(1).trim();
if (POOL_ADDR.length < 30 || POOL_ADDR.slice(0, 2) != "0x") {sendErrResult("invalid POOL_ADDRESS value"); return;}



////////// ARGS OK ////////////////////
log("get current state of position .....");
result.type = "pos_state";


//считает три цены по указанным тикам.
//возвращает объект {p1, p2, p_current}.
//функция сначала считает цены для токена 0, затем проверяет тикеры,
// и если тикер0 это стейбл и при тикер0 не USDT, то функция автоматом конвертирует цены для токена1.
//а также она так делает если среди тикеров нет стейблов, но цены0 очень маленькие вида 0,0005465 ( < 0.01)
function calcPricesState(pool_obj, t_low, t_up, t_cur)
{
    log("t_low = ", t_low);
    log("t_up = ", t_up);
    log("t_cur = ", t_cur);
    const p1_t0 = pool_obj.priceByTick(t_low);
    const p2_t0 = pool_obj.priceByTick(t_up);
//    const pcur_t0 = pool_obj.priceByTick(t_cur);
    const pcur_t0 = pool_obj.T0.price;

    const p1_t1 = 1/p2_t0
    const p2_t1 = 1/p1_t0
    const pcur_t1 = 1/pcur_t0;

    let res_obj = {};
    var p_index = 0;
    if (pool_obj.T0.ticker.slice(0, 3) == "USD" && pool_obj.T1.ticker != "USDT") p_index = 1;
    else if (p1_t0 < 0.01) p_index = 1;

    var stable = pool_obj.isStable(); 
    if (p_index == 1)
    {
	res_obj.p1 = priceToStr(p1_t1, stable);
	res_obj.p2 = priceToStr(p2_t1, stable);
	res_obj.p_current = priceToStr(pcur_t1, stable);
    }
    else
    {
	res_obj.p1 = priceToStr(p1_t0, stable);
	res_obj.p2 = priceToStr(p2_t0, stable);
	res_obj.p_current = priceToStr(pcur_t0, stable);
    }
    return res_obj;
}

//функция проверяет наличие проверяемой позиции в файле данных о позициях.
//определяет есть уже такая либо есть но что-то изменилось, в этом случае вносит изменения в файл данных
function checkFdataPos(pm, pos)
{
    var need_frw = false;
    let pos_pm = pm.posByPID(pos.pid);
    if (pos_pm == null) 
    {
        const next_i = pm.posDataCount();
        pm.pos_list[next_i] = new PosData(POS_PID);
        pm.pos_list[next_i].liq = pos.liq;
        pm.pos_list[next_i].l_tick = pos.l_tick;
        pm.pos_list[next_i].u_tick = pos.u_tick;
        pm.pos_list[next_i].fee = pos.fee;
        pm.pos_list[next_i].token0 = pos.token0;
        pm.pos_list[next_i].token1 = pos.token1;
        need_frw = true;
    }
    else
    {
	if (pos_pm.liq.toString() != pos.liq.toString())
	{
    	    pos_pm.liq = pos.liq;
    	    need_frw = true;	    
	}
    }

    if (need_frw)
    {
	log("/////////NEED REWRITE POS FILE_DATA//////////");
	pm.rewritePosDataFile();
    }
}



////////// BODY /////////////
const w_obj = new m_wallet.WalletObj(process.env.WA2);
let pm = new PosManager(process.env.WA2); //init PosManager object
pm.loadPosDataFromFile();
pm.syncByPoolsFile();


try
{
    //update pool data
    const pos = new PositionObj(POS_PID, pm.contract);
    pos.pool = new PoolObj(POOL_ADDR);
    var ok = pos.pool.loadFromFile(w_obj); //грузим базовые данные пула из файла
    if (!ok) {sendErrResult("can not load pool data from file (check pool_address)"); return;}
    log("WORKING_POOL_INFO: ", pos.pool.baseInfo());

    //update position data
    pos.updateData_v2().then((code) => {

	space();
	pos.pool.showPrices();	
	result.tick_range = ("(" + pos.l_tick.toString() + "; " + pos.u_tick.toString() + ")");
	result.token0_addr = pos.token0;
	result.token1_addr = pos.token1;
	result.pool_addr = pos.pool.address;
	result.pool_fee = pos.pool.fee;
	
	//state params
	result.liq = pos.liq.toString();
	result.current_tick = pos.pool.state.tick;
	const price_state = calcPricesState(pos.pool, pos.l_tick, pos.u_tick, pos.pool.state.tick);
	result.price_range = ("(" + price_state.p1 + "; " + price_state.p2 + ")");
	result.price_current = (price_state.p_current);
	if (result.price_current < 0.01) result.price_current = (1/result.price_current).toFixed(2);
	let p_loc = "active";
	if (Number.parseFloat(price_state.p_current) < Number.parseFloat(price_state.p1)) p_loc = "out_left";
	if (Number.parseFloat(price_state.p_current) > Number.parseFloat(price_state.p2)) p_loc = "out_right";
	result.price_location = p_loc;
	
	//check to need modif PID_FILE
	checkFdataPos(pm, pos);

	//get UnclaimedFees amounts
        pos.updateUnclaimedFees().then((ufcode) => {
            log("result_code: ", ufcode);
            log(pos.strUnclaimedFees());

	    result.assets = (amountToStr(pos.assetsVolume.asset0) + " / " + amountToStr(pos.assetsVolume.asset1));
	    result.reward = (amountToStr(pos.unclaimedFees.asset0) + " / " + amountToStr(pos.unclaimedFees.asset1));
	    sendResult();	    	
            log("finished!!!");
        });
    });


}
catch(e)
{
    const err = ("ERROR - " + e);
    sendErrResult(err);
}




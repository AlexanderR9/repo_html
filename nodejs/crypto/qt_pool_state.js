
//скрипт возвращает текущее состояние пула, номер тика и цены активов относительно друг друга token0/token1
//а так же TVL в виде двух значений: количество внесенных tvl0/tvl1
//ARG_1
// один обязательный аргумент - json file со следующими полями:
//EXAMPLE
/*
{
    "address": "0x2aceda63b5e958c45bd27d916ba701bc1dc08f7a",
    "fee": 3000,
    "tick_space": 60,
    "token0": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    "token1": "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
    
}
*/



//including
const m_base = require("./base.js");
const {space, log, curTime, delay, isInt, varNumber, jsonFromFile, isJson, jsonKeys, hasField} = require("./utils.js");
const m_wallet = require("./obj_wallet.js");
const {ArgsParser} = require("./obj_argsparser.js");
const m_pool = require("./obj_pool.js");


// user vars
let result = {type: "state"};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");
function sendErrResult(err) {result.error = err; sendResult();}    


//read input args
let a_parser = new ArgsParser(process.argv);
if (a_parser.isEmpty()) {sendErrResult("invalid args (is empty)"); return;}
if (a_parser.count() != 1) {sendErrResult("invalid args (parameters != 1)"); return;}


//read args
const F_JSON = a_parser.first();
log("JSON-file: ", F_JSON);
const j_params  = jsonFromFile(F_JSON);
if (!isJson(j_params)) {sendErrResult("can't readed JSON data"); return;}
log("JSON parsed OK! \n\n DATA:", j_params);

//check filelds kit
if (!hasField(j_params, "address")) {sendErrResult("json-params has not field <address>"); return;}
if (!hasField(j_params, "fee")) {sendErrResult("json-params has not field <fee>"); return;}
if (!hasField(j_params, "tick_space")) {sendErrResult("json-params has not field <tick_space>"); return;}
if (!hasField(j_params, "token0")) {sendErrResult("json-params has not field <token0>"); return;}
if (!hasField(j_params, "token1")) {sendErrResult("json-params has not field <token1>"); return;}
log("JSON fields kit OK! ");
space();


//body
let p_obj = new m_pool.PoolObj(j_params.address);
p_obj.fee = j_params.fee;
p_obj.tick_space = j_params.tick_space;


function getAssetAttrs(t_index, t_addr, w_obj)
{
    const asset = w_obj.findAsset(t_addr);
    if (t_index == 0)
    {
	p_obj.T0.address = t_addr;
	p_obj.T0.decimal = asset.decimal;
	p_obj.T0.ticker = asset.ticker;
    }
    else
    {
	p_obj.T1.address = t_addr;
	p_obj.T1.decimal = asset.decimal;
	p_obj.T1.ticker = asset.ticker;
    }
}

//WALLET DATA
let w_obj = new m_wallet.WalletObj(process.env.WA2);
getAssetAttrs(0, j_params.token0, w_obj);
getAssetAttrs(1, j_params.token1, w_obj);
//w_obj.outAssets();
//p_obj.out();

result.pool_address = j_params.address;
try
{

    p_obj.updateState().then(() => {
	p_obj.out();
	p_obj.showPrices();

	space();
	p_obj.outState();

	space();
	result.tick = p_obj.state.tick;
	result.price0 = p_obj.T0.price.toFixed(8);
	result.price1 = p_obj.T1.price.toFixed(8);

	//get TVL
	p_obj.updateTVL().then(() => 
	{
	    space(); 
	    p_obj.showTVL();
	    result.tvl0 = p_obj.T0.tvl;
	    result.tvl1 = p_obj.T1.tvl;
	    sendResult();
	});

    });

}
catch(e) 
{
    const err = ("ERROR - " + e);
    sendErrResult(err);
}


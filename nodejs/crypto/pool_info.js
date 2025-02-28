//скрпит выводит информацию о пуле, неизменяемые параметры пула,
//а так же текущие кросс-котировки  обоих токенов.
//если 1-м аргументом задать ключ -s то скрипт выведет дополнительно объект state (в нативном виде).    

//including
const m_base = require("./base.js");
const m_pool = require("./pool.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");

let WITH_STATE = false;
//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty())
{
    if (a_parser.at(0) == "-s") WITH_STATE = true;
}

//test debug
log("INFURA RPC_URL:", m_base.RPC_URL() );
log("Current chain:", m_base.currentChain());
log(`NATIVE_TOKEN (${m_base.nativeToken()})`);
log("---------------------------------");

//POOL DATA
//let p_obj = new m_pool.PoolObj("0x167384319b41f7094e62f7506409eb38079abff8"); // WMATIC / WETH 
//let p_obj = new m_pool.PoolObj("0xdac8a8e6dbf8c690ec6815e0ff03491b2770255d"); // USDC/USDT 
//let p_obj = new m_pool.PoolObj("0x2aceda63b5e958c45bd27d916ba701bc1dc08f7a");
//let p_obj = new m_pool.PoolObj("0x0a28c2f5e0e8463e047c203f00f649812ae67e4f");
//let p_obj = new m_pool.PoolObj("0x3d0acd52ee4a9271a0ffe75f9b91049152bac64b"); // USDC/LDO
//let p_obj = new m_pool.PoolObj("0x2db87c4831b2fec2e35591221455834193b50d1b");  // WPOL/USDC 0.3%
let p_obj = new m_pool.PoolObj("0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb");  // WPOL/USDC 0.05%

//run request
p_obj.updateData().then(() => {
    p_obj.out(); 
    p_obj.showPrices();
    
    if (WITH_STATE)
    {
	space();
	p_obj.outState(); 
    }
});





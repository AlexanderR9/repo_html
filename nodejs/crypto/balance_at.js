
//desc of script
//показывает балансы всех токенов кошелька.
//если запустить скрипт с аргументом, то так можно указать для какого кошелька вывести балансы активов.
//1-для WA1, 2-для WA2, по умолчанию выводит для WA2.
//если 2-м аргументов задать ключ -a то скрипт выведет дополнительно адреса токенов.    

//include
const m_base = require("./base.js");
const {space, log, curTime, delay, countDecimals} = require("./utils.js");
const m_wallet = require("./obj_wallet.js");
const {ArgsParser} = require("./obj_argsparser.js");


// user vars
let WALLET_NUMBER = 2;
let WITH_ADDRS = false;

log("INFURA RPC_URL:", m_base.RPC_URL() );
log("Current chain:", m_base.currentChain());
log(`NATIVE_TOKEN (${m_base.nativeToken()})`);


//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty() && a_parser.isNumber(0))  
{
    const x = a_parser.first();
    if (x == 1) WALLET_NUMBER = 1;
    
    if (a_parser.count() == 2) 
    {
	//log(a_parser.out());
	if (a_parser.at(1) == "-a") WITH_ADDRS = true;
    }
	
}
//log("WITH_ADDRS =", WITH_ADDRS);
//return 0;


//WALLET DATA
let w_obj = new m_wallet.WalletObj((WALLET_NUMBER==1) ? process.env.WA1 : process.env.WA2);
w_obj.out();
space();
w_obj.updateBalance().then(() => w_obj.showBalances(WITH_ADDRS));


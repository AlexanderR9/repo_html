

//это способ загрузить .evn если он находится на каталог выше
//const path = require("path")
//require("dotenv").config({ path: path.join(process.cwd(), "..", ".env") });
//--------------------------------------------------------

//это способ загрузить .evn если он находится в том же каталоге от куда запускаются скрипты
require("dotenv").config();
//--------------------------------------------------------


const {space, log, jsonFromFile, hasField} = require("./../utils.js");
//const { ContractObj } = require("./contract_class.js");

//файл где указана текущая сеть
const CUR_CHAIN_FILE = "current_chain.json";

//список всех RPC_URL для разных сетей
const RPC_URLS = {
    polygon: "https://polygon-mainnet.infura.io/v3",
    bnb: "https://bsc-mainnet.infura.io/v3",
    arbitrum: "https://arbitrum-mainnet.infura.io/v3",
    optimism: "https://optimism-mainnet.infura.io/v3"    
};


// основной класс для работы в сети, от него зависят все другие сущности.
// содержит информацию о текущей сети, которая указана в файле CUR_CHAIN_FILE
class ChainObj
{

    //функция возвращает название текущей сети, считанной из файла CUR_CHAIN_FILE.
    //на эту функцию завязано практически все.
    static currentChain()
    {
	const jres = jsonFromFile(CUR_CHAIN_FILE);
	if (!hasField(jres, "value")) return "invalid_chain";
	return jres.value;
    }


    static isPolygonChain() {return (ChainObj.currentChain() == "polygon");}
    static isBnbChain() {return (ChainObj.currentChain() == "bnb");}
    static isOptimismChain() {return (ChainObj.currentChain() == "optimism");}
    static isArbitrumChain() {return (ChainObj.currentChain() == "arbitrum");}

    static invalidChain() 
    {
	return (!ChainObj.isPolygonChain() && !ChainObj.isBnbChain() &&  !ChainObj.isOptimismChain() && !ChainObj.isArbitrumChain());
    }

    // возвращает название нативного токена (в котором платится газ) для текущей сети
    static nativeToken() 
    {
	if (ChainObj.isPolygonChain()) return "POL";
	if (ChainObj.isBnbChain()) return "BNB";
	return "ETH";
    }


    // возвразает полный URL для текущей сети
    static rpcUrl()
    {
	if (ChainObj.invalidChain()) return "?";
	const chain = ChainObj.currentChain();
	const serv = RPC_URLS[chain];
	if (!serv.includes("infura.io")) return serv;
        return (serv + "/" + process.env.INFURA_KEY.toString());
    }

}


module.exports = {ChainObj};



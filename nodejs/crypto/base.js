require("dotenv").config();


//including
const ethers = require("ethers");

//ABI of contracts
const {abi: QUOTER_ABI} = require("./abi/Quoter.json");
const {abi: POOL_ABI} = require("./abi/IUniswapV3Pool.json");
const {abi: ROUTER_ABI} = require("./abi/ISwapRouter.json");
const {abi: POS_MANAGER_ABI} = require("./abi/INonfungiblePositionManager.json");
const ERC20_ABI = require("./abi/erc20.abi.json");

const READABLE_FORM_LEN = 12;
const TICK_QUANTUM = 1.0001;	
const SWAP_ROUTER_ADDRESS='0xE592427A0AEce92De3Edee1F18E0157C05861564';
const SWAP_ROUTER_BNB_ADDRESS='0x1b81D678ffb9C0263b24A97847620C99d213eB14';
const POS_MANAGER_ADDRESS='0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
const POS_MANAGER_BNB_ADDRESS='0x46A15B0b27311cedF172AB29E4f4766fbE7F4364';
const QUOTER_CONTRACT_ADDRESS='0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';


function currentChain()
{
    let s = process.env.INFURA_URL.toString().toLowerCase();
    if (s.includes("polygon")) return "polygon";
    if (s.includes("optimism")) return "optimism";
    if (s.includes("arbitrum")) return "arbitrum";
    if (s.includes("base")) return "base";
    if (s.includes("binance")) return "bnb";
    return "etherium"
}
function nativeToken() //for current chain, fee pay token
{
	let s = currentChain();
	if (s == "polygon") return "POL";
	if (s == "bnb") return "BNB";
	return "ETH";	
}
function RPC_URL()
{
    const serv = process.env.INFURA_URL.toString();
    let s = currentChain();
    if (s == "bnb") return serv;
    return (serv + "/" + process.env.INFURA_KEY.toString()); 
}


//standard funcs
function getProvider() //: ethers.providers.Provide, get provider by user INFURA key (rpc_url) and chain
{
  return new ethers.providers.JsonRpcProvider(RPC_URL())
}
function getWallet(p_key, provider) 
{
  return new ethers.Wallet(p_key, provider);
}
function getContract(address, abi, provider) //get some contact obj by params: [address and abi]
{
  return new ethers.Contract(address, abi, provider);			
}
function getPoolContract(pool_addr, provider)
{
  return getContract(pool_addr, POOL_ABI, provider);			
}
function getTokenContract(t_addr, provider)
{
  return getContract(t_addr, ERC20_ABI, provider);			
}
function getQuoterContract(provider)
{
  return getContract(QUOTER_CONTRACT_ADDRESS, QUOTER_ABI, provider);			
}
function getRouterContract(provider)
{
    const swr_addr = ((currentChain() == "bnb") ? SWAP_ROUTER_BNB_ADDRESS : SWAP_ROUTER_ADDRESS);
    return getContract(swr_addr, ROUTER_ABI, provider);			
}
function getPosManagerContract(provider)
{
    const pm_addr = ((currentChain() == "bnb") ? POS_MANAGER_BNB_ADDRESS : POS_MANAGER_ADDRESS);
    return getContract(pm_addr, POS_MANAGER_ABI, provider);			
}
function tickSpacingByFee(fee)
{
    switch (fee)
    {
	case 100: return 1;
	case 500: return 10;
	case 3000: return 60;
	case 10000: return 200;
	default: break;
    }
//    log("tickSpacingByFee WARNING: invalid FEE_VALUE=", fee);
    return -1;
}

//convert funcs
function fromReadableAmount(amount, decimals = 18)
{
  return ethers.utils.parseUnits(amount.toString(), decimals);
}
function toReadableAmount(rawAmount, decimals = 18)
{
  return ethers.utils.formatUnits(rawAmount, decimals).slice(0, READABLE_FORM_LEN);
}
const toGwei = (float_num) => { return float_num*(10**9); } 
const fromGwei = (float_num) => { return (float_num/(10**9)); }
const toBig = (sum) => {return ethers.BigNumber.from(sum.toString());}

// MAX_VALUE UINT128, to Collect All value
const MAX_BIG128 = ethers.BigNumber.from(2).pow(128).sub(1).toString() // "340282366920938463463374607431768211455"

//----------------------------------------------------


//export vars
module.exports = {
	getProvider,
	getWallet,
	getContract,
	getPoolContract,
	getTokenContract,
	getQuoterContract,
	getRouterContract,
	getPosManagerContract,
	fromReadableAmount,
	toReadableAmount,
	toGwei,
	RPC_URL,
	nativeToken,
	currentChain,
	fromGwei,
	tickSpacingByFee,
	toBig,
	MAX_BIG128,
	SWAP_ROUTER_ADDRESS,
	POS_MANAGER_ADDRESS,
	TICK_QUANTUM
	
};



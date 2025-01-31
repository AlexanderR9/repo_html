

//including
const m_const = require("./const.js");
const ethers = require("ethers");
//const JSBI =  require("jsbi");

const {abi: QUOTER_ABI} = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");
const {abi: POOL_ABI} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {abi: ROUTER_ABI} = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json");
const {abi: POS_MANAGER_ABI} = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json");
const ERC20_ABI = require("./erc20.abi.json");

const READABLE_FORM_LEN = 8;

//standard funcs
function getProvider() //: ethers.providers.Provide, get provider by user INFURA key (rpc_url) and chain
{
  return new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
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
function getQuoterContract(q_addr, provider)
{
  return getContract(q_addr, QUOTER_ABI, provider);			
}
function getRouterContract(provider)
{
  return getContract(m_const.SWAP_ROUTER_ADDRESS, ROUTER_ABI, provider);			
}
function getPosManagerContract(provider)
{
  return getContract(m_const.POS_MANAGER_ADDRESS, POS_MANAGER_ABI, provider);			
}
function getRouterObj(provider)
{
  return new AlphaRouter({chainId: m_const.CHAIN_ID, provider });			
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
const fromGwei = (int_num) => { return int_num/(10**9); }
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
	getRouterObj,
	fromReadableAmount,
	toReadableAmount,
	toGwei,
	fromGwei,
	toBig,
	MAX_BIG128
	
};



//including
const m_const = require("./const.js");
const ethers = require("ethers");
//const JSBI =  require("jsbi");
const {abi: QUOTER_ABI} = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");
const {abi: POOL_ABI} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {abi: ROUTER_ABI} = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json");
const ERC20_ABI = require("./erc20.abi.json");
const READABLE_FORM_LEN = 6;

//standard funcs
function getProvider() //: ethers.providers.Provide, get provider by user INFURA key (rpc_url) and chain
{
  return new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
//	return new ethers.providers.InfuraProvider("polygon-mainnet", process.env.INFURA_KEY);
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
function getRouterObj(provider)
{
  return new AlphaRouter({chainId: m_const.CHAIN_ID, provider });			
}
function fromReadableAmount(amount, decimals = 18)
{
  return ethers.utils.parseUnits(amount.toString(), decimals);
}
function toReadableAmount(rawAmount, decimals = 18)
{
  return ethers.utils.formatUnits(rawAmount, decimals).slice(0, READABLE_FORM_LEN);
}
const hexToGwei = (big_num, dec = 18) => {
	if (dec == 18) return ethers.utils.formatUnits(big_num, "gwei");
	return ethers.utils.formatUnits(big_num, dec);
}
const toBig = (sum) => {return ethers.BigNumber.from(sum.toString());}

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
	getRouterObj,
	fromReadableAmount,
	toReadableAmount,
	hexToGwei,
	toBig
	
};

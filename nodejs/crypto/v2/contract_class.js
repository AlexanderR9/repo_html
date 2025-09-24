
//including
const ethers = require("ethers");
const { ChainObj } = require("./chain_class.js");


//ABI of contracts
const {abi: QUOTER_ABI} = require("./../abi/Quoter.json");
const {abi: QUOTER_V2_ABI} = require("./../abi/QuoterV2.json");
const {abi: ROUTER_ABI} = require("./../abi/ISwapRouter.json");
const {abi: ROUTER_V2_ABI} = require("./../abi/ISwapRouter02.json");

const {abi: POS_MANAGER_ABI} = require("./../abi/INonfungiblePositionManager.json");
const {abi: POOL_ABI} = require("./../abi/IUniswapV3Pool.json");
const ERC20_ABI = require("./../abi/erc20.abi.json");


// contract addresses
const SWAP_ROUTER_ADDRESS='0xE592427A0AEce92De3Edee1F18E0157C05861564';
const SWAP_ROUTER_BNB_ADDRESS='0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2';
const POS_MANAGER_ADDRESS='0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
const POS_MANAGER_BNB_ADDRESS='0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613';
const QUOTER_CONTRACT_ADDRESS='0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
const QUOTER_CONTRACT_BNB_ADDRESS='0x78D78E420Da98ad378D7799bE8f4AF69033EB077';



// статический класс, содержит методы для выдачи адресов основных контрактов с которыми предполагается взаимодействие
// а так же создает типовые объекты контрактов библиотеки ethers
class ContractObj
{

    // contract addresses funcs
    static swapRouterAddress()
    {
	if (ChainObj.isBnbChain()) return SWAP_ROUTER_BNB_ADDRESS;
	return SWAP_ROUTER_ADDRESS;
    }
    static posManagerAddress()
    {
	if (ChainObj.isBnbChain()) return POS_MANAGER_BNB_ADDRESS;
	return POS_MANAGER_ADDRESS;
    }
    static quoterAddress()
    {
	if (ChainObj.isBnbChain()) return QUOTER_CONTRACT_BNB_ADDRESS;
	return QUOTER_CONTRACT_ADDRESS;
    }


    //standard ethers.providers funcs
    static getProvider() //: ethers.providers.Provide, get provider by user INFURA key (rpc_url) and chain
    {
	return new ethers.providers.JsonRpcProvider(ChainObj.rpcUrl())
    }
    static getWallet(p_key, provider) 
    {
	return new ethers.Wallet(p_key, provider);
    }
    static getContract(address, abi, provider) //get some contact obj by params: [address and abi]
    {
	return new ethers.Contract(address, abi, provider);			
    }
    static getPoolContract(pool_addr, provider)
    {
	return ContractObj.getContract(pool_addr, POOL_ABI, provider);			
    }
    static getTokenContract(t_addr, provider)
    {
	return ContractObj.getContract(t_addr, ERC20_ABI, provider);			
    }
    // ------------------------ TX contract ---------------------------
    static getQuoterContract(provider)
    {
	const q_abi = (ChainObj.isBnbChain() ? QUOTER_V2_ABI : QUOTER_ABI);
	return ContractObj.getContract(ContractObj.quoterAddress(), q_abi, provider);			
    }
    static getRouterContract(provider)
    {
	const r_abi = (ChainObj.isBnbChain() ? ROUTER_V2_ABI : ROUTER_ABI);
	return ContractObj.getContract(ContractObj.swapRouterAddress(), r_abi, provider);			
    }
    static getPosManagerContract(provider)
    {
	return ContractObj.getContract(ContractObj.posManagerAddress(), POS_MANAGER_ABI, provider);			
    }

}

//export vars
module.exports = { ContractObj };



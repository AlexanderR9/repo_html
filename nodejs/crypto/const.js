require("dotenv").config();

//public vars
const FACTORY_CONTRACT_ADDRESS='3hCPRGf4z88VC5rsBKU5AA9FBBq5nF3jbKJG7VZCbhjm';
const QUOTER_CONTRACT_ADDRESS='0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
const QUOTER_CONTRACT_ADDRESS_T='0x61fFE014bA17989E743c5F6cB21bF9697530B21e';
const SWAP_ROUTER_ADDRESS='0xE592427A0AEce92De3Edee1F18E0157C05861564';

const POOL_USDC_LDO='0x3d0acd52ee4a9271a0ffe75f9b91049152bac64b';
const POOL_USDC_USDT='0xdac8a8e6dbf8c690ec6815e0ff03491b2770255d';
const POOL_WMATIC_USDC="0xb6e57ed85c4c9dbfef2a68711e9d6f36c56e0fcb";

const USDT_ADDR='0xc2132d05d31c914a87c6611c10748aeb04b58e8f';
//const USDC_ADDR='0x2791bca1f2de4661ed88a30c99a7a9449aa84174';  //PoS
const USDC_ADDR='0x3c499c542cef5e3811e1192ce70d8cc03d5c3359';  
const LDO_ADDR='0xc3c7d422809852031b44ab29eec9f1eff2a58756';
const WMATIC_ADDR='0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';


//export declare enum ChainId {^M
const ChainsID = {
    MAINNET: 1,
    OPTIMISM: 10,
    OPTIMISM_GOERLI: 420,
    OPTIMISM_SEPOLIA: 11155420,
    ARBITRUM_ONE: 42161,
    ARBITRUM_GOERLI: 421613,
    ARBITRUM_SEPOLIA: 421614,
    POLYGON: 137,
    BNB: 56,
    BASE: 8453
};


const CHAIN_ID = ChainsID.POLYGON;
const CHAIN_TOKEN = "POL";


//export vars
module.exports = {
	FACTORY_CONTRACT_ADDRESS, 
	QUOTER_CONTRACT_ADDRESS, 
	QUOTER_CONTRACT_ADDRESS_T, 
	SWAP_ROUTER_ADDRESS,
	POOL_USDC_LDO, 
	POOL_USDC_USDT,
	POOL_WMATIC_USDC,
	USDT_ADDR,
	USDC_ADDR,
	LDO_ADDR,
	WMATIC_ADDR,
	CHAIN_ID,
	CHAIN_TOKEN
};


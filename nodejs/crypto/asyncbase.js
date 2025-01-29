//стандартные асинхронные функции, помогающие в реализации неких алгоритмов

const ethers = require("ethers");
const m_base = require("./base.js");
const {space, log, curTime} = require("./utils.js");


//возвращает баланс(родного токена) в 2-х представлениях ГВеях и обычных единицах.
//тип возвращаемого значения - объект с двумя полями: gwei и tokens, 
//получив его далее можно ими пользоваться взависимости от задачи.
//на вход подается ранее созданный объект кошелька (ethers.Wallet(p_key, provider))
async function balance(w_obj) 
{
        let result = { };
        const data = await w_obj.getBalance();
//	log(data);
        result.gwei = Math.round(m_base.fromGwei(data));
        result.tokens = m_base.fromGwei(result.gwei);
        return result;
}
//возвращает баланс произвольного токена хранящегося в указанном кошельке в обычных единицах.
//тип возвращаемого значения - float. 
//на вход подается ранее созданный объект кошелька (ethers.Wallet(p_key, provider)) и адрес токена в нужной сети
async function balanceAt(w_obj, t_addr) 
{
	const t_obj = m_base.getTokenContract(t_addr, w_obj);
        const dec = await t_obj.decimals();
	let result = await t_obj.balanceOf(w_obj.address);
        result = m_base.toReadableAmount(result, dec);
        return result;
}
//возвращает количетсво всех транзакций совершенных указанным кошельком
async function txCount(w_obj)
{
        log("get Tx count of WALLET ....");
        const result = await w_obj.getTransactionCount();
        return result;
}




//тип возвращаемого значения - объект с двумя полями(float): gas и maxfee, 
// 1-цена за газ в ГВеях, 2-максимальная цена комиссии за газ в ГВеях.
//единицы - GWei токена сети в которой производится данная проверка.
async function feeGas(provider)
{
        let result = { };
        const data = await provider.getFeeData();
	//log("provider.getFeeData:", data);
	result.baseFeePerGas = data.lastBaseFeePerGas.toNumber().toString()+" GWei"; //базовая транзакция в последнем блоке
	result.maxFeePerGas = data.maxFeePerGas.toNumber();
	result.maxPriorityFeePerGas = data.maxPriorityFeePerGas.toNumber();
//	result.gasPrice = data.gasPrice.toNumber();
        return result;
}
///информация о сети к которой подключен провайдер
async function chainInfo(provider)
{
	const result = await provider.getNetwork()
	return result;
}
//возвращает неизменяемую информацию о пуле.
//тип возвращаемого значения - объект, который содержит 3 поля: t0_addr, t1_addr, fee
//на вход подается ранее созданный объект POOL (ethers.Contract(address, abi, provider))
async function poolData(pool_obj) //getting poolData from object poolContract
{
        let result = { };
        const [token0, token1, fee] = await Promise.all([pool_obj.token0(), pool_obj.token1(), pool_obj.fee()]);
        result.t0_addr = token0;
        result.t1_addr = token1;
        result.fee = fee;
	return result;
}
//возвращает информацию о текущем состоянии пула.
//тип возвращаемого значения - объект, который содержит 3 поля: liq, sqrtPrice(price in format Q96), tick(current tick of price)
//на вход подается ранее созданный объект POOL (ethers.Contract(address, abi, provider))
async function poolState(pool_obj) //getting poolState from object poolContract
{
        let result = { };
        const [liq, slot0] = await Promise.all([pool_obj.liquidity(), pool_obj.slot0()]);
        result.liq = liq;
        result.sqrtPrice = slot0[0];
        result.tick = slot0[1];
	return result;
}



//export vars
module.exports = {
        balance,
        balanceAt,
	feeGas,
	txCount,
	chainInfo,
	poolData,
	poolState
  
};


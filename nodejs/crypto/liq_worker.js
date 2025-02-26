

//классы для совершения операций с позициями пулов ликвидности

const {space, log, curTime, varNumber} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");
const m_wallet = require("./wallet.js");
const m_pool = require("./pool.js");


//класс для добавления/удаления ликвидности в позах uniswap с  указанного кошелька.
class LiqWorker
{
	//передать объект WalletObj, активы которого будут задействованы.
	//передать адрес пула, с которым предстоит работать
        constructor(w_obj, pool_addr)
        {
    	    log("Create LiqWorker: ");
    	    this.wallet = w_obj; //WalletObj instance
            this.pm_contract =  m_base.getPosManagerContract(this.wallet.pv);
	    this.pool = new m_pool.PoolObj(pool_addr);

        }
	//обновить данные пула
	async poolUpdate() 
	{
	    await this.pool.updateData(false); 
	    this.pool.out();
	}

/*
	//получить номера тиков для открытия позы по реальным значениям цен.
	//вернет объект с двумя полями tick1, tick2 (c учетом tickSpacing).
	//предварительно должна быть вызвана функция poolUpdate.
	calcTickRange(p1, p2)
	{
	    log("try get ticks range ......");
	    let result = {};
            let f_dec = 1;
            f_dec = 10 ** ((this.pool.T0.decimal - this.pool.T1.decimal));
            p1 /= f_dec; 
	    p2 /= f_dec;

	    result.tick1 = Math.floor(log(p1, 1.0001));
	    result.tick2 = Math.floor(log(p2, 1.0001));
	    return result;
	}
*/	

};

module.exports = {LiqWorker};


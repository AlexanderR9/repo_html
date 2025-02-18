const {space, log, curTime, varNumber} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");



//вспомогательный класс-контейнер для  PoolObj
class TokenObj
{
	constructor(addr) 
	{	
		this.address = addr;
		this.decimal = -1;
		this.ticker = "none";
		this.price = 0; //price of this token in term other token
  	}
	invalid()
	{
	    if (this.address.length < 10) return true;
	    if (this.decimal <= 0) return true;
	    return false;
	}
	async update(pv) //обновить поля токена
	{
		const data = await tokenData(this.address, pv);
		this.decimal = data.decimal;
		this.ticker = data.ticker;
	}
	out()
	{
		const s = "   ";
		log(s, "address:", this.address);
		log(s, "decimal:", this.decimal);
		log(s, "ticker:", this.ticker);
		log(s, "price:", this.price);
	}		
	decimalFactor() {return (10 ** this.decimal);}
	isStable() {return (this.ticker.slice(0, 3) == "USD");}
	pricePrecision()
	{
		if (this.price == 0) return 1;
		if (this.isStable()) return 6;
		if (this.price > 100) return 2;
		if (this.price > 0.1) return 4;
		return 6;
	}	
	strPrice() {return this.price.toFixed(this.pricePrecision());}
};


//класс для работы с выборочным пулом.
//при создании экземпляра необходимо указать адрес пула.
//вызвав функцию updateData() можно получить информацию о токенах и текущие  цены пула
class PoolObj
{
	//при создании экземпляра необходимо сразу передать адрес пула
	constructor(addr) 
	{	
		log("Create pool object: ", addr);
		this.address = addr; //список только полезных аргументов
		this.T0 = new TokenObj("?"); //пустой объект
		this.T1 = new TokenObj("?");
		this.fee = 0.0;
		this.pv = m_base.getProvider();	
		this.contract = m_base.getPoolContract(this.address, this.pv);
		this.state = {liq: 0, sqrtPrice: 0, tick: 0};
  	}
	invalidState() 
	{
	    if (this.state.liq <= 0) return true;
	    if (this.state.sqrtPrice <= 0) return true;
	    return false;
	}
	invalidPoolData() 
	{
	    if (this.address.length < 10) return true;
	    if (this.fee <= 0) return true;
	    if (this.T0.invalid() || this.T1.invalid()) return true;
	    return false;
	}
	


	//функция обновляет состояние пула, т.е. изменяемые параметры.
	async updateState()
	{
		log("PoolObj: try state update ...........");
		this.state = await poolState(this.contract);
		this.recalcPrices();
		log("state updated!");
	}
	//вернет true если пул состоит из стейблов, перед выполнением этой функции нужно вызвать updateData()
	isStable() 
	{
	    return (this.T0.isStable() && this.T1.isStable());
	}
	//функция извлекает всю основную не изменяемую информацию о пуле и его активах.
	//ее необходимо выполнить 1 раз сразу после создания экземпляра
	async updateData()
	{
		log("PoolObj: try update ...........");
		const data = await poolData(this.contract);
		this.T0.address = data.t0_addr;		
		this.T1.address = data.t1_addr;		
		this.fee = data.fee;
		await Promise.all([this.T0.update(this.pv), this.T1.update(this.pv)]);
		await this.updateState();
		log("done!");
	}
	recalcPrices()
	{
		const p96 = Number(this.state.sqrtPrice);
		if (p96 == 0) return;
		let p = (p96 / (2 ** 96));
		p = p*p;
		
		this.T0.price = p*this.T0.decimalFactor()/this.T1.decimalFactor();
		if (this.T0.price > 0) this.T1.price = 1/this.T0.price;
	}


	floatFee() {return (this.fee/10000);}
	strFee() {return (this.floatFee().toString()+"%");} 
	out()
	{
		log("PoolObj: ", this.address);
		if (this.isStable()) log("IS_STABELS_POOL");
		log("token 0:");
		this.T0.out();
		log("token 1:");
		this.T1.out();
		log("fee: ", this.strFee());
	}
	outState()
	{
		space();
		log("CURRENT_STATE:");
		log(this.state);
	}
	showPrices()
	{
		log("////////// Current prices of pool //////////////")
		let s = "Token_0:  1 " + this.T0.ticker + " = " + this.T0.strPrice() + " " + this.T1.ticker;
		log(s);
		s = "Token_1:  1 " + this.T1.ticker + " = " + this.T1.strPrice() + " " + this.T0.ticker;
		log(s);
	}



    //возвращает предполагаемую сумму обмена выходного токена при заданных входных параметрах.
    //функция только проводит предварительный расчет, никаких изменений не вносит.      
    //sum_in - сумма выделенная на обмен входного токена.
    //t_in - индекс входного токена в паре пула, может принимать значения 0 и 1, поумолчанию 0 .
    async tokenSizeBySwapping(sum_in, t_in = 0) //getting out_sum(t1) by in_sum(t0) from object quotesContract
    {
        log("Try calc out token by swap ...");
        if (!varNumber(sum_in))  {log("WARNING: input SUM is not number_value, sum: ", sum_in); return -1;}
        if (sum_in < 0.01 || sum_in > 100000)  {log("WARNING: input SUM is not correct, sum:", sum_in); return -1;}

	if (this.invalidPoolData())
	{
	    await this.updateData();
	    this.out();
	}
	else 
	{
	    await this.updateState();
	}
	let s = "TOKEN_IN: " + ((t_in == 0) ? this.T0.ticker : this.T1.ticker) + ";";
	s += "  SUM_IN = " + sum_in;
	log("Swap conditionals: ", s);
	
	this.recalcPrices();
	const price =  ((t_in == 0) ? this.T1.price : this.T0.price);
        if (price < 0.00000001)  {log("WARNING: out_token price is not correct, price:", price); return -1;}
	s = "TOKEN_OUT: " + ((t_in == 0) ? this.T1.ticker : this.T0.ticker) + ";";
	s += "  QUOTE = " + ((t_in == 0) ? this.T1.strPrice() : this.T0.strPrice());
	log("Waiting result: ", s);
	
	const result = sum_in/price;
	log("Result: ", result.toFixed(4));
	return result;
    }

};

module.exports = {PoolObj, TokenObj};


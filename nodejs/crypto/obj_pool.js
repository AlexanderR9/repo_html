const {space, log, curTime, varNumber, decimalFactor, uLog} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");

const fs = require("fs");
const POOL_FILE="pools.txt";


//вспомогательный класс-контейнер для  PoolObj
class TokenObj
{
	constructor(addr) 
	{	
		this.address = addr;
		this.decimal = -1;
		this.ticker = "none";
		this.price = 0; //price of this token in term other token
		this.tvl = 0; //хранит привычный пользовательский float
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
		this.fee = 0;
		//this.tick_space = -1;
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
	baseInfo()
	{
	    if (this.invalidPoolData()) return "???";
	    let s = this.T0.ticker + ":";
	    s += this.T1.ticker + ":";
	    s += this.floatFee() + "%";
	    return s;
	}
	appendDataToFile()
	{
	    log("try append pool record to file [pools.txt] ......");
	    if (this.invalidPoolData()) {log("invalid pool"); return;}
	    if (!fs.existsSync(POOL_FILE)) {log("WARNING: pools file not found - ", POOL_FILE); return;}
	    
	    const p_addr = this.address.trim().toLowerCase();	    
	    const f_arr = PoolObj.lookPoolsFile();
            for (let i=0; i<f_arr.length; i++)
	    {
		if (f_arr[i].addr == p_addr)
		{
		    log("pool already exist in file: ", p_addr);
		    return;
		}
	    }
            let fline = m_base.currentChain() + " / " + p_addr  + " / " + this.baseInfo();
	    fline += " / " + this.T0.address.toLowerCase() + " / " + this.T1.address.toLowerCase() + " / " + this.fee;
	    fs.appendFileSync(POOL_FILE, (fline + '\n'));
	    log("done!");
	}
	//функция пытается загрузить все неизменяемые данные о пуле из файла POOL_FILE,
	// предполагается что на текущий момент установлено только поле this.address.
	//в функцию необходимо передать заранее инициализированный объект кошелька для получения различных атрибутов токенов.
	//в случае успеха функция вернет true, иначе false.
	loadFromFile(w_obj)
	{
	    log("try load main pool attrs from file [pools.txt] ......");
	    log("POOL_ADDRESS: ", this.address);
	    const f_data = PoolObj.lookPoolsFile();
	    if (f_data.length == 0) return false;
            for (let i=0; i<f_data.length; i++)
	    {
		if (f_data[i].addr == this.address)
		{
//		    log("FOUND POOL IN FILE!!!!!!!!!!!!!!");
		    //token0 info
		    this.T0.address = f_data[i].t0_addr;
		    const wt0 = w_obj.findAsset(this.T0.address);
		    if (wt0.decimal <= 0) return false;
		    this.T0.decimal = wt0.decimal;		   
		    this.T0.ticker = wt0.ticker;		   
		    //token1 info
		    this.T1.address = f_data[i].t1_addr;
		    const wt1 = w_obj.findAsset(this.T1.address);
		    if (wt1.decimal <= 0) return false;
		    this.T1.decimal = wt1.decimal;		   
		    this.T1.ticker = wt1.ticker;		   

		    this.fee = Number.parseInt(f_data[i].fee);
		    return true;
		}
	    }	    
	    return false;
	}
	//читает файл pools.txt и возвращает массив записей-объектов всех пулов
	static lookPoolsFile() 
	{	    
	    let result = [];
	    log("try get pools from file [pools.txt] ......");
	    if (!fs.existsSync(POOL_FILE)) {log("WARNING: pools file not found - ", POOL_FILE); return result;}
	
            const data = fs.readFileSync(POOL_FILE);
            let list = data.toString().split("\n");
            for (let i=0; i<list.length; i++)
            {
                let fline = list[i].trim();
                if (fline == "") continue;
                if (fline.slice(0, 1) == "#") continue;

                let row_list = fline.toString().split("/");
                if (row_list.length != 6) continue;

		var k = 0;    
		let p_data = {};
		p_data.chain = row_list[k].trim(); k++;
		p_data.addr = row_list[k].trim(); k++;
		p_data.info = row_list[k].trim(); k++;
		p_data.t0_addr = row_list[k].trim(); k++;
		p_data.t1_addr = row_list[k].trim(); k++;
		p_data.fee = parseInt(row_list[k].trim()); k++;
		if (p_data.chain != m_base.currentChain()) continue;

		result.push(p_data);

            }
            log("pools count: ",  result.length);
	    return result;
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
	async updateData(with_state = true)
	{
		log("PoolObj: try update ...........");
		const data = await poolData(this.contract);
		this.T0.address = data.t0_addr;		
		this.T1.address = data.t1_addr;		
		this.fee = data.fee;
		log("CHAIN_POOL_DATA:", data);
	//	this.tick_space = data.tspace;
	//	if (this.tick_space == 1) this.tick_space = 2;
		await Promise.all([this.T0.update(this.pv), this.T1.update(this.pv)]);
		if (with_state) await this.updateState();
		log("done!");
	}
	//функция извлекает текущий TVL каждого из пары токенов в пуле.
	async updateTVL()
	{
	    log("PoolObj: try get TVL ...........");
            const t_obj0 = m_base.getTokenContract(this.T0.address, this.pv);
            const t_obj1 = m_base.getTokenContract(this.T1.address, this.pv);
	    const [tvl0, tvl1] = await Promise.all([ t_obj0.balanceOf(this.address), t_obj1.balanceOf(this.address) ]);
	    this.T0.tvl = m_base.toReadableAmount(tvl0, this.T0.decimal);
	    this.T0.tvl = Number.parseFloat(this.T0.tvl).toFixed(2);
	    this.T1.tvl = m_base.toReadableAmount(tvl1, this.T1.decimal);
	    this.T1.tvl = Number.parseFloat(this.T1.tvl).toFixed(2);
	    //log("T0.tvl=", this.T0.tvl,this.T0.ticker);
	    //log("T1.tvl=",this.T1.tvl,this.T1.ticker);
	    log("done!");
	}
	recalcPrices()
	{
	    const p96 = Number(this.state.sqrtPrice);
	    if (p96 == 0) return;
	    let p = ((p96 / (2 ** 96)) ** 2);
		
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
		log("tickSpacing: ", m_base.tickSpacingByFee(this.fee));
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
	showTVL()
	{
		var sum_tvl_st = Number.parseFloat(-1);
		log("////////// Current TVL sizes of pool //////////////")
		let s = "T0.tvl=" + this.T0.tvl.toString() + " " +  this.T0.ticker;

//		log("sum_tvl_st1 = ", sum_tvl_st);

		if (!this.T0.isStable() && this.T1.isStable())		
		{
		    const tvl0_st = this.T0.tvl*this.T0.price;
		    s += (" (" + tvl0_st.toFixed(1).toString() + " " +  this.T1.ticker + ")");
		    sum_tvl_st = Number.parseFloat(tvl0_st);
//		log("sum_tvl_st2 = ", sum_tvl_st);

		}
		else if (this.T0.isStable()) sum_tvl_st = this.T0.tvl;		
		log(s);

    
//		log("sum_tvl_st3 = ", sum_tvl_st);

		s = "T1.tvl=" + this.T1.tvl.toString() + " " + this.T1.ticker;
		if (!this.T1.isStable() && this.T0.isStable())		
		{
		    const tvl1_st = this.T1.tvl*this.T1.price;
		    s += (" (" + tvl1_st.toFixed(1).toString() + " " +  this.T0.ticker + ")");
		    sum_tvl_st = Number.parseFloat(sum_tvl_st) + Number.parseFloat(tvl1_st);

//		log("sum_tvl_st4 = ", sum_tvl_st);

		}
		else if (this.T1.isStable()) sum_tvl_st = Number.parseFloat(sum_tvl_st) + Number.parseFloat(this.T1.tvl);		
		log(s);

		sum_tvl_st/=1000;
		//log("sum_tvl_st = ", sum_tvl_st);
		if (sum_tvl_st > 1) log("TOTAL_TVL: ", sum_tvl_st.toFixed(1), "k_USD")
	}



    //возвращает предполагаемую сумму обмена выходного токена при заданных входных параметрах.
    //функция только проводит предварительный расчет, никаких изменений не вносит.      
    //перед расчетом функция выполнит updateState(); 
    //sum_in - сумма выделенная на обмен входного токена.
    //t_in - индекс входного токена в паре пула, может принимать значения 0 и 1, поумолчанию 0 .
    async tokenSizeBySwapping(sum_in, t_in = 0, need_update_state = true) //getting out_sum(t1) by in_sum(t0) from object quotesContract
    {
        log("Try calc out token by swap ...");
        if (!varNumber(sum_in))  {log("WARNING: input SUM is not number_value, sum: ", sum_in); return -1;}
        if (sum_in < 0.01 || sum_in > 100000)  {log("WARNING: input SUM is not correct, sum:", sum_in); return -1;}

	if (this.invalidPoolData())
	{
	    await this.updateData();
	    //this.out();
	}
	else if (need_update_state) { await this.updateState(); }

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

    //получить номера тиков для открытия позы по реальным значениям цен (внимательно: цена указывается для токена0 в ед. токена1).
    //вернет объект с двумя полями tick1, tick2 (c учетом tickSpacing, причем значения будут притянуты к нижним границам интервалов tickSpacing).
    //предварительно должна быть вызвана функция update.
    calcTickRange(p1, p2)
    {
        log("try get ticks range ......");
        let result = {};
        let f_dec = decimalFactor(this.T0.decimal, this.T1.decimal);

	//log("prices: p1 =", p1, "  p2 =", p2);
	
        p1 *= f_dec;
        p2 *= f_dec;

	const qp = m_base.TICK_QUANTUM;
        result.tick1 = Math.floor(uLog(qp, p1));
        result.tick2 = Math.floor(uLog(qp, p2));
	//log("raw_result:", result);    	
	
	
	const t_space = m_base.tickSpacingByFee(this.fee);
	//find ticks nearest tickSpacing
	let mod = result.tick1 % t_space;
	if (mod < 0) {mod += t_space; result.tick1 -= mod;}
	else if (mod > 0) result.tick1 -= mod;

	mod = result.tick2 % t_space;
	if (mod < 0) {mod += t_space; result.tick2 -= mod;}
	else if (mod > 0) result.tick2 -= mod;

        return result;
    }

    //получить цену вида Q96 но номеру тика (внимательно: цена указывается для токена0 в ед. токена1).
    //предварительно должна быть вызвана update, возвращает BigInt
    priceQ96ByTick(tick)
    {
        //log("try get price Q96 by tick range ......");
	//log("tick: ", tick);
        let f_dec = decimalFactor(this.T0.decimal, this.T1.decimal);

	//--------------stage 1----------------------------
	const a = m_base.TICK_QUANTUM ** tick;
    	const real_price = a/f_dec;
	//log("real_price: ", real_price);

	//--------------stage 2----------------------------
	const price_raw = real_price*f_dec;
	let sqrtPrice = Math.sqrt(price_raw);
	sqrtPrice = Math.round(sqrtPrice*(2 ** 96));
	const biX96 = BigInt(sqrtPrice);
	//log("sqrtPriceX96: ", biX96, " / ", biX96.toString());
	    
	return biX96;
    }
    priceByTick(tick) //получить реальную цену(token0) по указанному тику
    {
        //log("try get real price by tick", tick, " ......");
        let f_dec = decimalFactor(this.T0.decimal, this.T1.decimal);
	const a = m_base.TICK_QUANTUM ** tick;
    	const real_price = a/f_dec;
	//log("price: ", real_price);
	return 	real_price;
    }
    

};

module.exports = {PoolObj, TokenObj};


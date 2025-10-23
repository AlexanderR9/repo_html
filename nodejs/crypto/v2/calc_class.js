const JSBI= require("jsbi");
const {space, log, isInt, isFloat, isStr, hasField, decimalFactor, uLog } = require("./../utils.js");


const JSBI_ERR = JSBI.BigInt(-9999);
const READABLE_FORM_LEN = 12;


const JSBI_Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
const JSBI_Q32 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(32));
const JSBI_Q128 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128));
const JSBI_ZERO = JSBI.BigInt(0);
const JSBI_ONE = JSBI.BigInt(1);

const MAX_TICK = 887272;
const TICK_QUANTUM = 1.0001;
const Q96 = BigInt(2) ** BigInt(96);



//статический класс для проведения операций с большими числами.
//ПРИМЕЧАНИЕ: во всех функциях входные параметры НЕ меняются, всегда возвращается некий новый результат.
class JSBIWorker
{
    // признак того что параметр является JSBI
    static isBI(a) {return ((a instanceof JSBI) === true);}
    static biZero() {return JSBI_ZERO;}


    // признак того что параметр является ethers.BigNumber
    static isEthersBI(a) 
    {
	if (typeof(a) === 'object')
	{
	    if (hasField(a, "_isBigNumber") && hasField(a, "_hex"))
	    {
		//log("has field _isBigNumber  ", a._isBigNumber);
		if (a._isBigNumber === true) return true;
	    }
	}
	return false;
    }


    // преобразовывает входной параметр в тип  BigInt.
    // на вход можно подать целое число или строку, котороая может конвертироваться в число, example: '42353257'
    // если параметр уже является BigInt, функция вернет его же без изменений
    static toBI(a)
    {	
	if (JSBIWorker.isBI(a)) return a; 	
	if (isInt(a)) return JSBI.BigInt(a);
	if (isStr(a)) 	
	{
	    const n = Number(a);
	    if (Number.isNaN(n)) log("WARNING: invalid string parameter:", a);
	    else return JSBI.BigInt(a);
	}	
	if (JSBIWorker.isEthersBI(a)) return JSBI.BigInt(a.toString()); 
	return JSBI_ERR;
    }
    //вернет тоже число но с противоположным знаком. входной параметр должн быть типа BigInt.    
    static invertSign(a)
    {
	if (!JSBIWorker.isBI(a)) return JSBI_ERR;
	return JSBI.multiply(a, JSBI.BigInt(-1));
    }

    
    //вернет сумму двух BigInt. оба параметра должны быть типа BigInt.    
    static biSum(a, b)
    {
	if (!JSBIWorker.isBI(a) || !JSBIWorker.isBI(b)) return JSBI_ERR;
	return JSBI.add(a, b);
    }
    //вернет разность двух BigInt (a-b). оба параметра должны быть типа BigInt.    
    static biDiff(a, b)
    {
	if (!JSBIWorker.isBI(a) || !JSBIWorker.isBI(b)) return JSBI_ERR;
	return JSBI.subtract(a, b);
    }
    //вернет произведение двух BigInt (a*b). оба параметра должны быть типа BigInt.    
    static biMul(a, b)
    {
	if (!JSBIWorker.isBI(a) || !JSBIWorker.isBI(b)) return JSBI_ERR;
	return JSBI.multiply(a, b);
    }
    //вернет целочисленное деление двух BigInt (a/b). оба параметра должны быть типа BigInt.    
    static biDiv(a, b)
    {
	if (!JSBIWorker.isBI(a) || !JSBIWorker.isBI(b)) return JSBI_ERR;
	return JSBI.divide(a, b);
    }
    //вернет остаток от целочисленного деление двух BigInt (a/b). оба параметра должны быть типа BigInt.    
    static biDivRemainder(a, b)
    {
	if (!JSBIWorker.isBI(a) || !JSBIWorker.isBI(b)) return JSBI_ERR;
	return JSBI.remainder(a, b);
    }
    //вернет true если a == b . оба параметра должны быть типа BigInt.    
    static isEqual(a, b)
    {
	if (!JSBIWorker.isBI(a) || !JSBIWorker.isBI(b)) return JSBI_ERR;
	return JSBI.equal(a, b);
    }
    //вернет true если a < b . оба параметра должны быть типа BigInt.    
    static isLess(a, b)
    {
	if (!JSBIWorker.isBI(a) || !JSBIWorker.isBI(b)) return JSBI_ERR;
	return JSBI.lessThan(a, b);
    }


    //умножение числа JSBI на вещественное неотрицательное число , вернет результат умножения.
    //a - должен быть типа BigInt, float_b - должен быть типа float/int  и при этом >= 0
    // вернет JSBI
    static biMulFloat(a, float_b)
    {
	if (!JSBIWorker.isBI(a) || !isFloat(float_b)) return JSBI_ERR;
        if (float_b < 0) return JSBI_ERR;
        if (float_b == 0) return JSBI_ZERO;

	// кеф является целым
	if (isInt(float_b)) 
	    return JSBIWorker.biMul(a, JSBIWorker.toBI(float_b));

	// кеф является float (разделяем на целые единицы и вещественный остаток)
        const int_part = Math.floor(float_b);
        const f_part = float_b - int_part; // f_part >= 0 and < 1
        //log("int_part", int_part, "   f_part", f_part);
	
	let result_int = JSBIWorker.biMul(a, JSBIWorker.toBI(int_part));
	
        let degree = 1000000;
	let f = f_part*degree;
	//log("f=", f);
	let result_f = JSBIWorker.biMul(a, JSBIWorker.toBI(Math.round(f)));
	result_f = JSBIWorker.biDiv(result_f, JSBIWorker.toBI(degree));
		
	return JSBIWorker.biSum(result_int, result_f);
    }

    // ------------ практические функции -----------------------
    //преобразование нормального пользовательского значения float (например сумма 12.6) в JSBI число с поправкой на decimal
    // вернет JSBI
    static floatToWeis(f_value, decimal = 18)
    {
	if (decimal < 3 || decimal > 18) {log("floatToWeis: err 1"); return JSBI_ERR.toString();}
	const jsbi_factor = JSBI.BigInt(10**decimal);
	return JSBIWorker.biMulFloat(jsbi_factor, f_value);
    }



    // конвертация значения полученного из сети в нормальное пользовательское значение (float)
    // bi - должен быть типа JSBI/ether.BigInt/bi_string, decimal - должен быть типа int
    static weisToFloat(bi, decimal = 18, precision = 6)
    {
	if (isStr(bi)) bi = JSBIWorker.toBI(bi);
	else if (JSBIWorker.isEthersBI(bi)) bi = JSBIWorker.toBI(bi); 

	if (!JSBIWorker.isBI(bi) || !isInt(decimal)) {log("fromWeiToFloate: err 1"); return JSBI_ERR.toString();}
	if (decimal < 3 || decimal > 18) {log("fromWeiToFloat: err 2"); return JSBI_ERR.toString();}
	if (JSBIWorker.isEqual(bi, JSBI_ZERO)) return 0.0;

	let s_bi = bi.toString();
	var result = 0;
	while (2 > 1)
	{
	    if (decimal <= 0) break;
	    if (s_bi.length <= READABLE_FORM_LEN) 
	    {
		result = Number.parseFloat(s_bi);
		break;
	    }
	    decimal--;
	    s_bi = s_bi.slice(0, -1);	    
	}
	if (result == 0) return result.toFixed(1);	
	while (2 > 1)
	{
	    if (decimal <= 0) break;
	    decimal--;
	    result /= 10;	    
	}
	return result.toFixed(precision);	
    }

    // конвертация значения полученного из сети (weis) в Gwei, применяется для получения цены газа
    // bi - должен быть типа JSBI/ether.BigInt/bi_string, 
    static weisToGwei(bi, precision = 4)
    {
	if (isStr(bi)) bi = JSBIWorker.toBI(bi);
	else if (JSBIWorker.isEthersBI(bi)) bi = JSBIWorker.toBI(bi);
	
	return JSBIWorker.weisToFloat(bi, 9, precision);
    }


    // значение цены в пуле вида sqrtPriceQ96, т.е. то значение, в которых идут расчеты в пуле по заданному тику
    // вернет значение типа BigInt
    static sqrtPriceQ96ByTick(tick)
    {
	// my code
	const ratio = (TICK_QUANTUM ** tick);
	const sqrtRatio = Math.sqrt(ratio);
	return BigInt(Math.floor(sqrtRatio * Number(Q96)));



	/*
	// gpt code
	if (tick < (-1*MAX_TICK) || tick > MAX_TICK) {log("Incorrect tick:", tick); return JSBI_ERR.toString();}
	let absTick = (tick < 0) ? -tick : tick;
	let ratio = JSBI.BigInt("0x100000000000000000000000000000000");

	if (absTick & 0x1) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xfffcb933bd6fad37aa2d162d1a594001")), JSBI_Q128);}
	if (absTick & 0x2) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xfff97272373d413259a46990580e213a")), JSBI_Q128);}
	if (absTick & 0x4) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xfff2e50f5f656932ef12357cf3c7fdcc")), JSBI_Q128);}
	if (absTick & 0x8) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xffe5caca7e10e4e61c3624eaa0941cd0")), JSBI_Q128);}
	if (absTick & 0x10) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xffcb9843d60f6159c9db58835c926644")), JSBI_Q128);}
	if (absTick & 0x20) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xff973b41fa98c081472e6896dfb254c0")), JSBI_Q128);}
	if (absTick & 0x40) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xff2ea16466c96a3843ec78b326b5286")), JSBI_Q128);}
	if (absTick & 0x80) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xfe5dee046a99a2a811c461f1969c3053")), JSBI_Q128);}
	if (absTick & 0x100) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xfcbe86c7900a88aedcffc83b479aa3a4")), JSBI_Q128);}
	if (absTick & 0x200) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xf987a7253ac413176f2b074cf7815e54")), JSBI_Q128);}
	if (absTick & 0x400) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xf3392b0822b70005940c7a398e4b70f3")), JSBI_Q128);}
	if (absTick & 0x800) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xe7159475a2c29b7443b29c7fa6e889d9")), JSBI_Q128);}
	if (absTick & 0x1000) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xd097f3bdfd2022b8845ad8f792aa5825")), JSBI_Q128);}
	if (absTick & 0x2000) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0xa9f746462d870fdf8a65dc1f90e061e5")), JSBI_Q128);}
	if (absTick & 0x4000) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0x70d869a156d2a1b890bb3df62baf32f7")), JSBI_Q128);}
	if (absTick & 0x8000) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0x31be135f97d08fd981231505542fcfa6")), JSBI_Q128);}
	if (absTick & 0x10000) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0x9aa508b5b7a84e1c677de54f3e99bc9")), JSBI_Q128);}
	if (absTick & 0x20000) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0x5d6af8dedb81196699c329225ee604")), JSBI_Q128);}
	if (absTick & 0x40000) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0x2216e584f5fa1ea926041bedfe98")), JSBI_Q128);}
	if (absTick & 0x80000) {ratio = JSBI.divide(JSBI.multiply(ratio, JSBI.BigInt("0x48a170391f7dc42444e8fa2")), JSBI_Q128);}
	//--------------------------------------------------------------------------------
	if (tick > 0) {ratio = JSBI.divide(JSBI.BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), ratio);}

	// делим на 2^32, округляем вверх
	const x = JSBI.add(JSBI.divide(ratio, JSBI_Q32), JSBI_ONE);
	const y = JSBI.divide(ratio, JSBI_Q32);
	const sqrtPriceX96 = (JSBI.greaterThan(JSBI.remainder(ratio, JSBI_Q32), JSBI_ZERO) ? x : y);
	return sqrtPriceX96;
	*/
    }

    // Переводим sqrtPriceQ96 цену в нормальное значение(float), привычное для пользователя
    // вернет значение нормальное типа float
    static priceBySqrtPriceQ96(sqrtPriceQ96, decimal0, decimal1) 
    {
	const p_sqrt = (Number(sqrtPriceQ96)/Number(Q96)); // это sqrt(P)
	const p = p_sqrt**2;  // возводим в квадрат, P = (sqrt(P))^2
	const scale = decimalFactor(decimal0, decimal1);   // поправка на decimals
	const p_user = (p/scale).toFixed(READABLE_FORM_LEN);
	return Number.parseFloat(p_user);
    }
    // переводит обычную цену float (привычное для пользователя) в номер тика
    static poolPriceToTick(user_price, decimal0, decimal1) 
    {
	const scale = decimalFactor(decimal0, decimal1);   // поправка на decimals
	const p_scale = user_price*scale;
	const tick = Math.floor(uLog(TICK_QUANTUM, p_scale));
	return tick;
    }
    // вернет ближайший тик к заданному согласно tick_spacing пула
    static nearTickBySpacing(tick, tick_spacing)
    {
	if (tick_spacing <= 0) return 0;
	if (tick_spacing == 1) return tick;

	const dr = tick%tick_spacing;
	if (dr == 0) return tick;

	var t_low = tick;
	var t_high = tick;
	while (2 > 1)
	{
	    t_low--;
	    t_high++;
	    if (t_low%tick_spacing == 0) return t_low;
	    if (t_high%tick_spacing == 0) return t_high;	    
	}		
	return -9999;
    }
    


    
    ///////////////////////////////РАСЧЕТ ДОЛЕЙ АКТИВОВ В ДИАПАЗОНЕ ПОЗИЦИИ////////////////////////////////////////

    
    // вспомогательные функции для определения долей  token0 и token1
    static _amount0Mint(jsbi_p1, jsbi_p2, jsbi_liq)
    {
        const d_price = JSBI.subtract(jsbi_p2, jsbi_p1);
        const numerator1 = JSBI.leftShift(jsbi_liq, JSBI.BigInt(96));
        const numerator2 = JSBI.multiply(numerator1, d_price);
        return JSBI.divide(JSBI.divide(numerator2, jsbi_p2), jsbi_p1);
    }
    static _amount1Mint(jsbi_p1, jsbi_p2, jsbi_liq)
    {
        const d_price = JSBI.subtract(jsbi_p2, jsbi_p1);
        return JSBI.divide(JSBI.multiply(jsbi_liq, d_price), JSBI_Q96);
    }


    // функция считает текущие объемы открытой позы, в текущи момент времени.
    //входные параметры: poolSqrtPriceQ96 - текущая цена пула вида sqrtQ96 взятая из slot0, liq - ликвидность позы, tick_range -тиковый диапазон позы (объект {tick1: a, tick2: b})
    //функция вернет объект с двумя полями {amount0, amount1}, значения которых типа JSBI, которые еще предстоит трансформировать с учетом decimal
    static recalcAssetsPosition(poolSqrtPriceQ96, liq, tick_range)
    {

	let jsbi_liq = JSBIWorker.toBI(liq);
	const jsbi_p = JSBIWorker.toBI(poolSqrtPriceQ96); //current price
	const jsbi_p1 = JSBIWorker.toBI(JSBIWorker.sqrtPriceQ96ByTick(tick_range.tick1).toString());  // range lower price
	const jsbi_p2 = JSBIWorker.toBI(JSBIWorker.sqrtPriceQ96ByTick(tick_range.tick2).toString()); // range upper price

/*
	log("liq: ", liq);
	log("tick_range: ", tick_range);
	log("cur_price:", jsbi_p.toString());
	log("low_price:", jsbi_p1.toString());
	log("upper_price:", jsbi_p2.toString());
*/

	let result = {amount0: JSBI_ZERO, amount1: JSBI_ZERO};
	if (JSBIWorker.isEqual(jsbi_liq, JSBI_ZERO)) {log("liq is null"); return result;} // ликвидность нулевая

	if (JSBIWorker.isLess(jsbi_p, jsbi_p1))  // out of range to left
	{
	    result.amount0 = JSBIWorker._amount0Mint(jsbi_p1, jsbi_p2, jsbi_liq)
	}
	else if (JSBIWorker.isLess(jsbi_p2, jsbi_p)) // out of range to right
	{
	    result.amount1 = JSBIWorker._amount1Mint(jsbi_p1, jsbi_p2, jsbi_liq)
	}
	else // in range (pos active)
	{
	    result.amount0 = JSBIWorker._amount0Mint(jsbi_p, jsbi_p2, jsbi_liq)
	    result.amount1 = JSBIWorker._amount1Mint(jsbi_p1, jsbi_p, jsbi_liq)
	}
	return result;
    }

    
    //посчитать ликвидность позиции по одному объему amount0, где amount0 объем токена_0 в нормальных пользовательских единицах.
    //входные параметры: poolSqrtPriceQ96 - текущая цена пула вида sqrtQ96 взятая из slot0, tick_range -тиковый диапазон позы (объект {tick1: a, tick2: b})
    //подразумевается что текущая цена внутри диапазона
    //вернет значение предполагаемой ликвидности позы типа JSBI
    static calcLiqByAmount0(poolSqrtPriceQ96, tick_range, amount0, decimal0)
    {
	const liq0 = JSBIWorker.floatToWeis(amount0, decimal0);
	const jsbi_p = JSBIWorker.toBI(poolSqrtPriceQ96); //current price
	const jsbi_p1 = JSBIWorker.toBI(JSBIWorker.sqrtPriceQ96ByTick(tick_range.tick1).toString());  // range lower price
	const jsbi_p2 = JSBIWorker.toBI(JSBIWorker.sqrtPriceQ96ByTick(tick_range.tick2).toString()); // range upper price

/*
	space();
	log("jsbi_p =", jsbi_p.toString());
	log("jsbi_p1 =", jsbi_p1.toString());
	log("jsbi_p2 =", jsbi_p2.toString());
	log("LIQ of TOKEN0: ", liq0.toString());
*/


	// try calc LIQ of minting, formula:  L = amount0 * (p*sb)/(sb - p)
        const d_price = JSBIWorker.biDiff(jsbi_p2, jsbi_p); 
	const mul_price = JSBIWorker.biMul(jsbi_p, jsbi_p2);    // Q96*Q96 = Q192 (оставляем как есть)
	const a = JSBIWorker.biMul(liq0, mul_price);        	// amount0 * (p*sb)
	const a96 = JSBIWorker.biDiv(a, JSBI_Q96);        	// amount0 * (p*sb) / Q96  (массштабируем порядок)

/*	
	log("d_price:", d_price.toString());
	log("mul_price:", mul_price.toString());
	log("a:", a.toString());
	log("a96:", a96.toString());
*/

	const L = JSBIWorker.biDiv(a96, d_price);
	return L;
    }
    static calcLiqByAmount1(poolSqrtPriceQ96, tick_range, amount1, decimal1) // аналогична фунции calcLiqByAmount0, но для amount1
    {
	const liq1 = JSBIWorker.floatToWeis(amount1, decimal1);
	const jsbi_p = JSBIWorker.toBI(poolSqrtPriceQ96); //current price
	const jsbi_p1 = JSBIWorker.toBI(JSBIWorker.sqrtPriceQ96ByTick(tick_range.tick1).toString());  // range lower price
	const jsbi_p2 = JSBIWorker.toBI(JSBIWorker.sqrtPriceQ96ByTick(tick_range.tick2).toString()); // range upper price
/*

	space();
	log("jsbi_p =", jsbi_p.toString());
	log("jsbi_p1 =", jsbi_p1.toString());
	log("jsbi_p2 =", jsbi_p2.toString());
	log("LIQ of TOKEN1: ", liq1.toString());
*/

	// try calc LIQ of minting, formula:  L = amount1 * Q96 / (p - sa)
        const d_price = JSBIWorker.biDiff(jsbi_p, jsbi_p1); 
	const a96 = JSBIWorker.biMul(liq1, JSBI_Q96);        	// amount1 * Q96  (массштабируем порядок)
	log("d_price:", d_price.toString());
	log("a96:", a96.toString());
	const L = JSBIWorker.biDiv(a96, d_price);
	return L;
    }


}

module.exports = {JSBIWorker};




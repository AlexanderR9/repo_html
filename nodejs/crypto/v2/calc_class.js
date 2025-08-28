const JSBI= require("jsbi");
const {space, log, isInt, isFloat, isStr, hasField } = require("./../utils.js");


const JSBI_Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
const JSBI_ZERO = JSBI.BigInt(0);
const JSBI_ERR = JSBI.BigInt(-9999);
const TICK_QUANTUM = 1.0001;
const READABLE_FORM_LEN = 12;



//статический класс для проведения операций с большими числами.
//ПРИМЕЧАНИЕ: во всех функциях входные параметры НЕ меняются, всегда возвращается некий новый результат.
class JSBIWorker
{
    // признак того что параметр является JSBI
    static isBI(a) {return ((a instanceof JSBI) === true);}

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



    //умножение числа JSBI на вещественное неотрицательное число , вернет результат умножения.
    //a - должен быть типа BigInt, float_b - должен быть типа float/int  и при этом >= 0
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
    static floatToWeis(f_value, decimal = 18)
    {
	if (decimal < 3 || decimal > 18) {log("floatToWeis: err 1"); return JSBI_ERR.toString();}
	const jsbi_factor = JSBI.BigInt(10**decimal);
	return JSBIWorker.biMulFloat(jsbi_factor, f_value);
    }



    // конвертация значения полученного из сети в нормальное пользовательское значение
    // bi - должен быть типа JSBI/ether.BigInt/bi_string, decimal - должен быть типа int
    static weisToFloat(bi, decimal = 18, precision = 6)
    {
	//const t = typeof(bi);
	if (isStr(bi)) bi = JSBIWorker.toBI(bi);
	else if (JSBIWorker.isEthersBI(bi)) {bi = JSBIWorker.toBI(bi); /*log("bi", " /   THIS ETHERS.BigInt type");*/ }

//	log(`fromWeiToFloat bi=${bi.toString()}  decimal=${decimal}   type(${t})`);
	if (!JSBIWorker.isBI(bi) || !isInt(decimal)) {log("fromWeiToFloate: err 1"); return JSBI_ERR.toString();}
	if (decimal < 3 || decimal > 18) {log("fromWeiToFloat: err 2"); return JSBI_ERR.toString();}


	let s_bi = bi.toString();
	//log("b=", s_bi, "   len=", s_bi.length);
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


}

module.exports = {JSBIWorker};




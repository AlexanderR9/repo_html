//вспомогательные функции не связанные с ethers, которые подойдут к любому проекту
const fs = require("fs");

const space = () => {console.log("");} //debug space
const log = (s, s1, s2, s3, s4) => {
        if (s4 != undefined) console.log(s, s1, s2, s3, s4);
        else if (s3 != undefined) console.log(s, s1, s2, s3);
        else if (s2 != undefined) console.log(s, s1, s2);
        else if (s1 != undefined) console.log(s, s1);
        else console.log(s);
}
const curTime = () => {
	let d = new Date(); 
	return (d.toLocaleTimeString() + "." + d.getMilliseconds());
}
function delay(ms)
{
  return new Promise((resolve) => {setTimeout(resolve, ms);});
}
function countDecimals(x) //возвращает количество десятичных знаков вещественного числа 
{
  if (Math.floor(x) === x) return 0;
  return x.toString().split('.')[1].length || 0;
}
function varNumber(a) ///проверяет является ли параметр числом (float)
{
    let res = Number.parseFloat(a);
    return Number.isFinite(res);
}
function isInt(a) ///проверяет является ли параметр числом (integer)
{
    if (Number.isInteger(a)) return true;
    return false;
}
function isJson(a) ///проверяет является ли переменная объектом json
{
    if (a == null || a == undefined) return false;
    if (Array.isArray(a)) return false;

//    try { JSON.stringify(a); return true; } 
//    catch (ex) { return false; }

    if (typeof a === 'object') return true;
    return false;
}
function hasField(a, key_name) ///проверяет есть указанное поле у объекта a json
{
    if (!isJson(a)) return false;
    if (a.hasOwnProperty(key_name)) return true;
    return false;
}
function decimalFactor(decimal0, decimal1) //возвращает кеф для пула с разностью (decimal1 - decimal0)
{
    if (decimal0 <= 0 || decimal1 <= 0) return -1;
    if (decimal0 == decimal1) return 1;
    return (10 ** (decimal1 - decimal0));
}
function uLog(a, b) //пользовательски логорифм, привычный log_a(b)
{
    if (b == 1 || a == 0) return 0;
    if (a == 1 || a < 0) return -1;    
    return (Math.log(b)/Math.log(a));
}
function priceToStr(p) //приводит вещественное значение цены в строку для пользователя, округляя до нужного количества знаков
{
    if (p <= 0) return p.toString();
    if (p < 0.1) return p.toFixed(5);
    if (p < 0.9) return p.toFixed(4);
    if (p < 1.1) return p.toFixed(5);
    if (p < 10) return p.toFixed(4);
    if (p < 100) return p.toFixed(2);
    return p.toFixed(1);
}
function amountToStr(p) //приводит вещественное значение количетсва актива в строку для пользователя, округляя до нужного количества знаков
{
    if (p < 0) return p.toString();
    if (p == 0) return p.toFixed(1);
    if (p < 0.1) return p.toFixed(5);
    if (p < 100) return p.toFixed(2);
    return p.toFixed(1);
}
function fileExist(f_full_path)
{
    if (fs.existsSync(f_full_path)) return true;
    return false;
}
function jsonFromFile(f_json) //функция пытается считать файл и преобразовать данные в JSOM-obj, в случае ошибки вернет null
{
    if (!fileExist(f_json)) {log(`WARNING: file [${f_json}] not found`); return null;}

    let result = null;	
    const f_data = fs.readFileSync(f_json).toString();
    //log(f_data);
    try  { result = JSON.parse(f_data); }
    catch (err) {console.log("Error parsing JSON string:", err); return null;}
    return result;
}
function jsonKeys(a) //функция возвращает строковы массив имен полей json, если json пуст или невалиден вернет пустой массив
{
    let arr= [];
    if (!isJson(a)) return arr;

    for (const key in a) arr.push(key);
    return arr;
}
function mergeJson(a, b) //слияние двух json, все поля b перетекают в a, если в а уже были какие-то поля, то они перезапишутся
{
    if (!isJson(a) || !isJson(b)) return false;

    const b_keys = jsonKeys(b);
    const n = b_keys.length;
    if (n > 0)
    {
	for (var i=0; i<n; i++)
	{
	    const field = b_keys[i];
	    //log("field: ", field);
	    a[field] = b[field];
	}
    }
    return true;
}


//export funcs
module.exports = {log, curTime, delay, space, countDecimals, varNumber, decimalFactor, uLog, 
	priceToStr, amountToStr, isInt, isJson, hasField, fileExist, jsonFromFile, jsonKeys, mergeJson};


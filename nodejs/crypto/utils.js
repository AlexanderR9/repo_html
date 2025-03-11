//вспомогательные функции не связанные с ethers, которые подойдут к любому проекту

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
function varNumber(a) ///проверяет является ли параметр числом (float или int)
{
    let res = Number.parseFloat(a);
    return Number.isFinite(res);
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


//export funcs
module.exports = {log, curTime, delay, space, countDecimals, varNumber, decimalFactor, uLog, priceToStr, amountToStr};


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


//export funcs
module.exports = {log, curTime, delay, space, countDecimals};


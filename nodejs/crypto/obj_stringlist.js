const {space, log, curTime, varNumber, isInt} = require("./utils.js");


//класс-контейнер для хранения массива строк.
//конструктор без параметров, инициализируется пустым .
class StringListObj
{
        constructor()
        {
	    this.list = []; // сами данные
	}
	clear() {this.list = [];} //no return
	count() {return this.list.length;}
	isEmpty() {return ((this.count()==0) ? true : false);}
	append(x) {this.list.push(x);} //no return
	at(i) 
	{
	    if (!isInt(i)) return ("invalid index: [" + i.toString() + "]");
	    if (i < 0 || i >= this.count()) return null;
	    return this.list[i];
	}
	first() 
	{	
	    if (this.isEmpty()) return null;
	    return this.at(0);
	}
	last() 
	{	
	    if (this.isEmpty()) return null;
	    return this.at(this.count()-1);
	}
	removeLast() {if (!this.isEmpty()) this.list.pop();} //no return
	removeFirst() {if (!this.isEmpty()) this.list.shift();} //no return
	removeAt(i) //no return
	{
	    if (!isInt(i)) return;
	    if (i < 0 || i >= this.count()) return;
	    this.list.splice(i, 1);
	}
	insert(i, x) //no return
	{
	    if (!isInt(i)) return;
	    if (i < 0) return;
	    if (i >= this.count()) {this.append(x); return;}
	    this.list.splice(i, 0, x);
	}
	find(x) //возвращает индекс элемента или -1
	{
	    if (this.isEmpty()) return -1;

	    var n = this.count();
	    for(var i=0; i<n; i++)
		if (this.at(i) == x) return i;
	    return -1;
	}
	contains(x) {return ((this.find(x)<0) ? false : true);}



	//diag func, out to log StringListObj info/data
	toLog()
	{
	    space();
	    log("StringListObj: size = ", this.count());
	    if (this.isEmpty()) {log("CONTAINER IS EMPTY!!!"); return;}
	    var n = this.count();
	    for(var i=0; i<n; i++)
		log(`i=${i}`, `  value=[${this.at(i)}]`);
	}
};

module.exports = {StringListObj};





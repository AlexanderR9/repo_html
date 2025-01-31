const {space, log, curTime} = require("./utils.js");


//класс для чтения и обработки входных аргументов скрипта
class ArgsParser 
{
	constructor(args_list) 
	{	
		this.list = []; //список только полезных аргументов
		const n = args_list.length;
		this.invalid = (n < 2);
		if (this.invalid) return;
			
		this.script_name = args_list[1];
		if (n > 2)
		{
    			this.list = args_list;
    			this.list.splice(0, 2);
		}
  	}

	//inline funcs
	count() {return this.list.length;}
	isEmpty() {return (this.count() == 0);}
	first() {return (this.isEmpty() ? "" : this.at(0));}
	last() {return (this.isEmpty() ? "" : this.at(this.count()-1));}

  	out() //to debug (diag func)
	{
		if (this.invalid) {log("invalid!!!"); return;}	

		log("/////// SCRIPT ARGUMENTS ///////////")
		log("SCRIPT: ", this.script_name);
		if (this.isEmpty()) {log("ARGS_EMPTY"); return;}	

		const n = this.count();
		log("ARGS_COUNT: ", n);
		let i = 0;
		for (i=0; i<n; i++) 
			log(i+1, ".  [", this.at(i), "]");
  	}
	at(i)
	{
        	if (i>=this.count() || i<0) return "???";
        	return this.list[i];
	}
	isNumber(i) ///является ли аргумент числом (float или int)
	{
		let a = Number.parseFloat(this.at(i));
		return Number.isFinite(a);
	}
}

module.exports = {ArgsParser};


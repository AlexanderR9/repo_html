
//Datetime static class
class LDateTime
{
	//вернет текущее время в виде строки
	static currentTime(with_ms = false)
	{
		let dt = new Date();
		let s = dt.getHours()+":"+dt.getMinutes()+":"+dt.getSeconds();
		if (with_ms) s += "."+dt.getMilliseconds();
		return s;
	}
	
	
}

//Script static class
class LScript
{
	//выполнит все скрипты (рекурсивно) в указанном блоке,
	//вернет количетсво найденных скриптов, -1 означает что блок с указанным id не был найден.
	static execBlockScripts(id)
	{
		let target_div = document.getElementById(id); 
		if (!target_div) return -1;
		let internal_scripts = target_div.querySelectorAll("script");
		internal_scripts.forEach(item => eval(item.innerHTML));
		return internal_scripts.length;
	}
		
}



const {space, log, curTime, varNumber, decimalFactor, isInt} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");

const fs = require("fs");
const POOL_FILE="pools.txt";


//класс для хранения/обработки/форматирования даты и времени. время локальное.
//объект содержит 2 основных поля: day-полное количество дней прошедних начиная с 01.01.2001 и sec - секунд прошедших в текущих сутках.
//конструктор без параметров означает текущую дату и время.
class DateTimeObj
{
	//конструктор без параметров, при объявлении инициализируется текущими датой и временем
	//для установки произвольных значений используйте методы setDate(y,m,d), setTime(h,m,s)
        constructor()
        {
	    this.day = 0; // количество дней с 01.01.2001
	    this.sec = 0;

	    this._initCurrentDateTime();
	}
	resetTime() {this.sec = 0;}
	resetDate() {this.day = 0;}
	reset() {this.resetDate(); this.resetTime();}
	
	//инициализировать объект текущими датой и временем
	_initCurrentDateTime() 
	{
	    const dt = new Date();
	    var y = dt.getFullYear()-2000; //current year
	    var m = dt.getMonth()+1; //current month [1..12]

	    //calc days
	    this.day = 0;
	    while (2 > 1)
	    {
		y--; if (y<1) break;
		this.day += this.yearDays(y+2000);
	    }
	    y = dt.getFullYear();
	    while (2 > 1)
	    {
		m--; if (m<1) break;
		this.day += this.monthDays(m, y);
	    }
	    this.day += (dt.getDate() - 1);

	    //calc seconds
	    this.sec = dt.getHours()*3600;
	    this.sec += dt.getMinutes()*60; 
	    this.sec += dt.getSeconds();
	}
	//возвращает год даты данного объекта
	year()
	{
	    var days = this.day;
	    var y = 1;
	    while (2 > 1)
	    {
		days -= this.yearDays(y+2000);
		if (days < 0) break;
		y++;
	    }
	    return (y+2000);
	}
	//возвращает месяц даты данного объекта
	month()
	{
	    const y = this.year();
	    var days = this.day - this._daysBeforeYear(y); //вычитаем дни заполные прошедшие годы
	    //log("this._daysBeforeYear(y)", this._daysBeforeYear(y));
	    var m = 1;
	    while (2 > 1)
	    {
		days -= this.monthDays(m, y);
		if (days < 0) break;
		m++;
	    }
	    return m;	    
	}	
	//возвращает день месяца даты данного объекта
	monthDay()
	{
	    const y = this.year();
	    var y_days = this.leftDaysYear(); //пройдено дней в этом году
	    for (var m=1; m<=12; m++)
	    {
		const m_days = this.monthDays(m, y);
		if (m_days > y_days) break;
		y_days -= m_days;
	    }
	    return (y_days+1);
	}
	//возвращает номер часа для времени данного объекта, (от 0 до 23)
	hour()
	{
	    var h = 0;
	    var s = this.sec;
	    while (2 > 1)
	    {
		s -= 3600;
		if (s < 0) break;
		h++;
	    }
	    return h;	    	    
	}
	//возвращает номер минуты в текущем часе для времени данного объекта, (от 0 до 59)
	minute()
	{
	    var m = 0;
	    var s = this.sec - (this.hour()*3600);
	    while (2 > 1)
	    {
		s -= 60;
		if (s < 0) break;
		m++;
	    }
	    return m;	    	    
	}
	//возвращает номер секунды в текущей минуте для времени данного объекта, (от 0 до 59)
	second()
	{
	    return (this.sec - (this.hour()*3600) - (this.minute()*60));
	}
	//возвращает дату этого объекта в строковом виде, пример 02.03.2025
	strDate(separator_symbol = '.')
	{
	    const d = this.monthDay();
	    let s = ((d<10) ? ("0"+d.toString()) : d.toString()) + separator_symbol;
	    const m = this.month();
	    s += (((m<10) ? ("0"+m.toString()) : m.toString()) + separator_symbol);
	    s += this.year().toString();
	    return s;
	}
	//возвращает время этого объекта в строковом виде, пример 05:46:03
	strTime(show_sec = false, separator_symbol = ':')
	{
	    const h = this.hour();
	    let s = ((h<10) ? ("0"+h.toString()) : h.toString()) + separator_symbol;
	    const m = this.minute();
	    s += ((m<10) ? ("0"+m.toString()) : m.toString());

	    if (!show_sec) return s;
	    else s += separator_symbol;

	    const secs = this.second();
	    s += ((secs<10) ? ("0"+secs.toString()) : secs.toString());
	    return s;
	}
	//возвращает дату и время в строковом виде
	toStr(date_separator='.', time_separator=':', show_sec = true)
	{
	    let s = strDate(date_separator) + "  ";
	    s += strTime(show_sec, time_separator);
	}
	
	
	//количетво дней в указанном месяце и годy (высокосные годы проверяются)
	//месяц указывается [1..12], год указывается от 2001
	monthDays(m, y)
	{
	    if (y < 2001 || m < 1 || m > 12) return 0;

	    switch (m)
	    {
		case 1:
		case 3:
		case 5:
		case 7:
		case 8:
		case 10:
		case 12: return 31;

		case 4:
		case 6:
		case 9:
		case 11: return 30;

		case 2:
		{
		    if (((y-2000)%4) == 0) return 29;
		    return 28;		
		}
		default: break;		
	    }
	    return -1;
	}
	//возвращает номер текущего дня в текущем году, для даты этого объекта.
	dayOfYear()
	{
	    return (this.leftDaysYear() + 1);
	}
	//возвращает количество дней(полных) пройденных текущем году, для даты этого объекта.
	leftDaysYear()
	{
	    const y = this.year();
	    var days = this.day - this._daysBeforeYear(y); //вычитаем дни за полные прошедшие годы
	    return days;
	}
	//количетво дней в указанном годy (высокосные годы проверяются)
	//год указывается от 2001
	yearDays(y)
	{
	    if (y < 2001) return 0;
	    if (((y-2000)%4) == 0) return 366;
	    return 365;	
	}
	//возвращает количество дней пройденных ДО наступления указанного года, т.е. дни за полные прошедшие года c 2001.
	//год указывается от 2001
	_daysBeforeYear(y) //protected
	{
	    if (y < 2001) return 0;

	    var days = 0;
	    var yk = y-1;
	    while (2 > 1)
	    {
		if (yk < 2001) break;
		days += this.yearDays(yk);
		yk--;
	    }
	    return days;
	}
	toDebug()
	{
	    log(`DateTimeObj: day=${this.day}  sec=${this.sec}`);
	}

	///////////////setter funcs///////////////////////

	//устанавливает/именяет дату начиная с 2001г., если какой-то параметр задать -1, 
	//то этот параметр даты не измениться (например нужно изменить только месяц - setDate(-1, 6, -1))
	setDate(y, m, d)
	{
	    //save current params
	    if (y < 2001) y = this.year(); 
	    if (m < 0) m = this.month();	    
	    if (d < 1 || d > 31) d = this.monthDay();

	    //add left years
	    this.day = this._daysBeforeYear(y);

	    //add left month 
	    if (m > 1 && m <= 12)
	    {
		for (var i=1; i<=(m-1); i++)
		    this.day += this.monthDays(i, y);
	    }

	    //add left days
	    this.day += (d - 1);	    
	}
	//устанавливает/именяет время данного объекта, если какой-то параметр задать -1, 
	//то этот параметр не измениться (например нужно изменить только час - setTime(13, -1, -1))
	setTime(h, m, s)
	{
	    //save current params
	    if (h < 0 || h > 23) h = this.hour()
	    if (m < 0 || m > 59) m = this.minute();
	    if (s < 0 || s > 59) s = this.second();

	    //calc sec value
	    this.resetTime();
	    this.sec = h*3600 + m*60 + s;
	}
	//копирование другого объекта
	copy(other_dt)
	{
	    this.day = other_dt.day;
	    this.sec = other_dt.sec;
	}

	//парсит указанную строку и ищет элементы  d.m.y и h:m:s/h:m, причем в строке может пристутствовать только один элемент (любой)
	//если успешно парсит найденный элемент даты/время, то именяет соотсветствующее поле данного объекта, иначе оставляет прежние значения.
	//дата и время должны быть разделены одним пробелом (или несколькими). date_separator, time_separator не должны быть одинаковыми.
	fromString(str_dt, date_separator='.', time_separator=':')
	{
	    let s = str_dt.trim();
	    if (s.length < 5) {log("WARNING: invalid DateTime value:", str_dt); return;}
	    
            let arr = s.split(" ");
	    if (arr.length > 1)
	    {
		//log(arr);
		for (var i=0; i<arr.length; i++)
		{		    
		    const arr_s = arr[i].trim();
		    if (arr_s.length < 5) continue;
	    
		    if (arr_s.includes(date_separator)) this._parseDate(arr_s, date_separator)	
		    else if (arr_s.includes(time_separator)) this._parseTime(arr_s, time_separator)	
		}
	    }	
	    else
	    {
		if (s.includes(date_separator)) this._parseDate(s, date_separator)	
		else if (s.includes(time_separator)) this._parseTime(s, time_separator)	
	    }	    
	}
	_parseDate(s_date, date_separator) //protected metod
	{
	    //log(" START _parseDate, ", s_date);
	    let s = s_date.trim();
	    if (s.length < 8) {log("WARNING: invalid Date value:", s_date); return;}
            let arr = s.split(date_separator);
	    if (arr.length != 3) {log("WARNING: invalid Date value:", s); return;}
	
	    const d = Number.parseInt(arr[0]);	    
	    if (!isInt(d)) {log("WARNING: invalid Date value, day is not integer:", s); return;}
	    const m = Number.parseInt(arr[1]);	    
	    if (!isInt(m)) {log("WARNING: invalid Date value, month is not integer:", s); return;}
	    const y = Number.parseInt(arr[2]);	    
	    if (!isInt(m)) {log("WARNING: invalid Date value, year is not integer:", s); return;}
	    this.setDate(y, m, d);
	}
	_parseTime(s_time, time_separator) //protected metod
	{
	    //log(" START _parseTime, ", s_time);
	    let s = s_time.trim();
	    if (s.length < 3) {log("WARNING: invalid Time value:", s_time); return;}
            let arr = s.split(time_separator);
	    if ((arr.length != 2) && (arr.length != 3)) {log("WARNING: invalid Time value:", s); return;}
	    
	    const h = Number.parseInt(arr[0]);	    
	    if (!isInt(h)) {log("WARNING: invalid Time value, hour is not integer:", s); return;}
	    const m = Number.parseInt(arr[1]);	    
	    if (!isInt(m)) {log("WARNING: invalid Time value, minute is not integer:", s); return;}

	    var secs = 0;
	    if (arr.length == 3)
	    {
		secs = Number.parseInt(arr[2]);	    
		if (!isInt(secs)) {log("WARNING: invalid Time value, second is not integer:", s); return;}
	    }
	    this.setTime(h, m, secs);
	}


	//пытается извлечь дату из строки которая представлена задом наперед т.е. yyyy.MM.dd
	parseDate_invert(s_date, date_separator)
	{
	    //log(" START _parseDate, ", s_date);
	    let s = s_date.trim();
	    if (s.length < 8) {log("WARNING: invalid Date value:", s_date); return;}
            let arr = s.split(date_separator);
	    if (arr.length != 3) {log("WARNING: invalid Date value:", s); return;}
	
	    const d = Number.parseInt(arr[2]);	    
	    if (!isInt(d)) {log("WARNING: invalid Date value, day is not integer:", s); return;}
	    const m = Number.parseInt(arr[1]);	    
	    if (!isInt(m)) {log("WARNING: invalid Date value, month is not integer:", s); return;}
	    const y = Number.parseInt(arr[0]);	    
	    if (!isInt(m)) {log("WARNING: invalid Date value, year is not integer:", s); return;}
	    this.setDate(y, m, d);
	}

};

module.exports = {DateTimeObj};





const {space, log, curTime, varNumber, decimalFactor, uLog} = require("./utils.js");
const m_base = require("./base.js");
const {poolData, poolState, tokenData} = require("./asyncbase.js");

const fs = require("fs");
const POOL_FILE="pools.txt";


//класс для хранения/обработки/форматирования даты и времени. время локальное.
//объект содержит 2 основных поля: day-полное количество дней прошедних начиная с 01.01.2001 и sec - секунд прошедших в текущих сутках.
//конструктор без параметров означает текущую дату и время.
class DateTimeObj
{
        constructor()
        {
	    this.day = 0; // количество дней с 01.01.2001
	    this.sec = 0;

	    this._initCurrentDateTime();
	}
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
	    log("this._daysBeforeYear(y)", this._daysBeforeYear(y));
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

};

module.exports = {DateTimeObj};





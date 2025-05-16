const {space, log, curTime, varNumber, decimalFactor, isInt} = require("./utils.js");
const {StringListObj} = require("./obj_stringlist.js");


const fs = require("fs");


//статический класс для работы с файлами.
class FileObj
{

    static fileExists(fname)
    {
	if (fname == "") {log("Warning: file name is empty"); return false;}
	if (fs.existsSync(fname))
	    if (fs.lstatSync(fname).isFile()) return true;
	return false;
    }
    static dirExists(fname)
    {
	if (fname == "") {log("Warning: dir name is empty"); return false;}
	if (fs.existsSync(fname))
	    if (fs.lstatSync(fname).isDirectory()) return true;
	return false;
    }

    //записывает строку в файл, как есть, вернет err: "" or err_string
    //fname - полный путь + name	
    static writeStr(fname, s)
    {
	const code = fs.writeFileSync(fname, s, 'utf8');	
	if (code == undefined) return "";
	log("error: ", code);
	return "FileObj.appendStr: result fault - " + code.toString();
    }

    //добавляет строку в файл, как есть, вернет err: "" or err_string
    //fname - полный путь + name	
    static appendStr(fname, s)
    {
	const code = fs.appendFileSync(fname, s, 'utf8');	
	if (code == undefined) return "";
	log("error: ", code);
	return "FileObj.writeStr: result fault" + code.toString();
    }

    //записывает список строк в файл (StringListObj) , после каждой строки добавляет "\n" перенос на др строку, 
    //вернет err: "" or err_string
    //fname - полный путь + name	
    static writeSL(fname, sl)
    {
	if (sl.isEmpty()) return "string list is empty for writing";
    
	let err = "";
	var n = sl.count();
	for (var i=0; i<n; i++)
	{
	    if (i == 0) err = FileObj.writeStr(fname, (sl.at(i) + '\n'));
	    else err = FileObj.appendStr(fname, (sl.at(i) + '\n'));
	    if (err != "") break;
	}
	if (err == "") return err;	
	return (err + " [writeSL]");
    }

    //добавляет список строк в файл (StringListObj) , после каждой строки добавляет "\n" перенос на др строку, 
    //вернет err: "" or err_string
    //fname - полный путь + name	
    //предварительно проверяет существование файла, если не существует то вернет ошибку
    static appendSL(fname, sl)
    {
	if (sl.isEmpty()) return "string list is empty for writing";
	if (!FileObj.fileExists(fname)) return ("file not found for appending: "+fname);
    
	let err = "";
	var n = sl.count();
	for (var i=0; i<n; i++)
	{
	    err = FileObj.appendStr(fname, (sl.at(i) + '\n'));
	    if (err != "") break;
	}
	if (err == "") return err;	
	return (err + " [writeSL]");
    }


    //читает все содержимое файла, и записывает в параметр s как есть, вернет err: "" or err_string
    //fname - полный путь + name	
    //предварительно проверяет существование файла, если не существует то вернет ошибку
    static readStr(fname, s)
    {
	s = "";
	let err = "";
	if (!FileObj.fileExists(fname)) return ("file not found for reading: "+fname);
	try { s = fs.readFileSync(fname); }
	catch (error) {err = ("FileObj.readStr: result fault - " +  error.toString());}
	return err;
    }
    //читает все содержимое файла, разбивает на строки и записывает в параметр sl(StringListObj)  , вернет err: "" or err_string
    //fname - полный путь + name	
    //предварительно проверяет существование файла, если не существует то вернет ошибку
    //параметр remove_empty указывает на то что пустые строки не добавлять в sl
    static readSL(fname, sl, remove_empty = true)
    {
	sl.clear();
	let err = "";
	if (!FileObj.fileExists(fname)) return ("file not found for reading: "+fname);

	let s = "";
	try { s = fs.readFileSync(fname); }
	catch (error) {err = ("FileObj.readSL: result fault - " +  error.toString()); return err;}

        let fdata = s.toString().split("\n");
        for (let i=0; i<fdata.length; i++)
        {
            if (fdata[i].trim() == "" && remove_empty) continue;
	    sl.append(fdata[i]);
	}
	return err;
    }




};

module.exports = {FileObj};





// этот скрипт должен выполняться всегда  с одним аргументом - имя json файла.
// json файл должен лежать на том же уровне.
// json файл описывает инструкции, какие операции скрипт должен выполнить.

const {space, log, curTime, delay, fileExist, jsonFromFile, isJson} = require("./utils.js");
const {ArgsParser} = require("./argsparser.js");
const fs = require("fs");
const { exec } = require("child_process");


let F_JSON = "";

//read input args
let a_parser = new ArgsParser(process.argv);
if (!a_parser.isEmpty()) F_JSON = a_parser.first();
else {log("WARNING: you must point JSON-file in args"); return -1;}

log("JSON-file: ", F_JSON);
const j_params  = jsonFromFile(F_JSON);
if (!isJson(j_params)) {log("WARNING: can't readed JSON data"); return -1;}

log("JSON parsed OK! \n DATA:", j_params);

space();
//exec.fork("pos_info.js");
//log(res);


/*

function runScript(scriptPath, callback) {
    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;
    var process = exec(scriptPath);
    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });
    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
}
// Now we can run a script and invoke a callback when complete, e.g.
runScript('node pos_info.js', function (err) {
    if (err) throw err;
    console.log('finished running some-script.js');
});

*/



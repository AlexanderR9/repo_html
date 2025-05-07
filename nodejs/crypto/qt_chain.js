//desc of script
//ARG_1
//скрипт возвращает название текущей сети, на которую настроена вся система в текущий момент.
//скрипт вызывается без аргументов.


//including
const m_base = require("./base.js");
const {space, log, curTime, delay, isInt, varNumber} = require("./utils.js");

let result = {};
const sendResult = () => log("JSON_RESULT_START", result, "JSON_RESULT_END");


log("get current chain.........");
result.chain = m_base.currentChain();
sendResult();



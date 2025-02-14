
//calc unclimed fees of pos

//including
//const m_const = require("./const.js");
const ethers = require("ethers");
const m_base = require("./base.js");
const {space, log, curTime} = require("./utils.js");

//read args
const args = process.argv;
const args_count = args.length - 2;
const hasArgs = () => {return (args_count > 0);}
function getArg(i)
{
        if (i>=args_count || i<0) return "?";
        return args[2+i];
}

log("ARGS: ");
if (hasArgs()) log("script received", args_count, "arguments!");
else {log("WARNING: Args list is empty"); return -1;}
//read argument
const pos_id = getArg(0);


//main async
async function main(pm_obj, pid)
{
 log("get static data from PM obj ...");
 const encoded = {
    tokenId: pid, //position ID
    recipient: process.env.WA1,  // owner wallet
    amount0Max: m_base.MAX_BIG128,
    amount1Max: m_base.MAX_BIG128
  };

  const trx = await pm_obj.callStatic.collect(encoded);
  log("FEES_T0:", m_base.toReadableAmount(trx.amount0, 6));
  log("FEES_T1:", m_base.toReadableAmount(trx.amount1, 18));	

//const npos = await pm_obj.balanceOf(process.env.WA1)
// log("npos", npos.toNumber());	

//const pos = await pm_obj.tokenOfOwnerByIndex(process.env.WA1, 53);
//log("POS:", pos.toNumber());
const pos = await pm_obj.positions(pid);
log("POS_INFO:", pos);

//const calls = [];
//for (let i = 0; i < numPositions; i++) 
//{
 //   calls.push(pm_obj.tokenOfOwnerByIndex(process.env.WA1, i));
//}
//const positionIds = await Promise.all(calls);
//log("positionIds:", positionIds);


}

log("try calc fees of ", pos_id, "....");
log("GET_POS_MANAGER");
const pv = m_base.getProvider();
const pos_manager = m_base.getPosManagerContract(pv);

//start
main(pos_manager, pos_id);


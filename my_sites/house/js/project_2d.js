//2d project



console.log("start 2D");

//settings
let scale = 0.8;
let offset_x = 15;
let fundament = {w: 780, t: 80}; //cm



function initCanvas2D(border_offset = 4)
{
	let div = document.getElementById('canvas_div');
	div.style.height = "5000px";
	
	let canvas = document.createElement("canvas");
	canvas.id = "canvas";
	canvas.style.background = "white";
	canvas.style.borderRadius = "20px";			
	let rect = div.getBoundingClientRect();
	canvas.width = rect.width - border_offset*2;
	canvas.height = rect.height - border_offset*2;
	//canvas.height = 5000;
	
	div.appendChild(canvas);
}
function paintFundament(ctx, y)
{
	ctx.fillStyle = "gray";
	ctx.fillRect(offset_x, y, fundament.w*scale, fundament.w*scale);
	
	ctx.fillStyle = "Peru";
	let t = fundament.t*scale;
	let w_in = ((fundament.w - 3*fundament.t)/2)*scale;	
	ctx.fillRect(offset_x+t, y+t, w_in, w_in);
	ctx.fillRect(offset_x+t+w_in+t, y+t, w_in, w_in);
	ctx.fillRect(offset_x+t, y+t+w_in+t, w_in, w_in);
	ctx.fillRect(offset_x+t+w_in+t, y+t+w_in+t, w_in, w_in);
	
		
}

initCanvas2D();
let ctx = document.getElementById('canvas').getContext('2d');

paintFundament(ctx, 10); 
 
 
ctx.lineWidth = 1; 

//ctx.strokeRect(10, 10, 200, 300);


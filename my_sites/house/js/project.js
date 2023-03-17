
//include modules
import * as THREE from './three.module.js';
import {initGL, initCamera, addTHREEAxis, toRad, addLight, initOrbitControl, createMesh, LFace, LVerge, paintRect} from './three_lib.js';

console.log("start 3D");

//parameters
let fundament = {w:780, h:40, t:80, color:"lightgray"}; //cm
let house = {
	w : 700, //между центрами сплетений бруса
	tail : 25, //от центра сплетения до конца
	brus: {w: 14.5, h: 14.5, color: "Cornsilk"},
	lafet: {w:20, h:10, color:"SaddleBrown", ex_offset: 2},		
};
let rooms = {
	hallway: {w_front: 240, w_side: 240},
	
};



//////////////////////////////BODY MODULE//////////////////////////////////////


//init main WebGL objects for THREE lib
let scene = new THREE.Scene();
let camera = initCamera({x:-7, y:8, z:-3});
let gl = initGL('white');

//init add-ons object of THREE lib
initOrbitControl(camera, gl);
addTHREEAxis(scene);
addLight(scene);



//camera.lookAt(0, 5, 0);	

//project example
/*
let g_buff = new THREE.BufferGeometry();
const vertices = new Float32Array([	0, 0, 10, 0, 0, 30, 10, 0, 0, 20, 0, 25]);
const normals = new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,]);
g_buff.setAttribute( 'position', new THREE.BufferAttribute(vertices, 3));
g_buff.setAttribute( 'normal', new THREE.BufferAttribute(normals, 3));
var face_indexes = new Uint16Array([0, 1, 2, 2, 0, 3]);
g_buff.setIndex(new THREE.BufferAttribute(face_indexes, 1));
*/

let proj = new THREE.Group();


function addFundament()
{
	let t = fundament.t/100;
	let w1 = (fundament.w-fundament.t)/100;

	let sizes = {x:w1, y: fundament.h/100, z:t};
	let p0 = {x:0, y:0, z:0};
	proj.add(paintRect(null, p0, sizes, fundament.color));
	p0 = {x:t, y:0, z:w1};
	proj.add(paintRect(null, p0, sizes, fundament.color));
	sizes = {x:t, y:fundament.h/100, z:w1};
	p0 = {x:w1, y:0, z:0};
	proj.add(paintRect(null, p0, sizes, fundament.color));
	p0 = {x:0, y:0, z:t};
	proj.add(paintRect(null, p0, sizes, fundament.color));

	let w2 = (fundament.w-2*fundament.t)/100;
	let wc1 = (fundament.w/2-fundament.t/2)/100;
	sizes = {x:w2, y:fundament.h/100, z:t};
	p0 = {x:t, y:0, z:wc1};
	proj.add(paintRect(null, p0, sizes, fundament.color));

	sizes = {x:t, y:fundament.h/100, z:w2};
	p0 = {x:wc1, y:0, z:t};
	proj.add(paintRect(null, p0, sizes, fundament.color));	
}
function addLafet()
{
	
	const w_full = house.w + house.brus.w + house.lafet.ex_offset*2;
	const df = (fundament.w - w_full)/2;
	console.log("LAFET: w_full="+w_full+"  fundament_offset="+df);
	
	const t = house.lafet.w/100;
	const h = house.lafet.h/100;
	const w1 = (w_full/100) - t;
	const yh = fundament.h/100;

	let p0 = {x:df/100, y:yh , z:df/100};
	let sizes = {x:w1, y: h, z:t};
	proj.add(paintRect(null, p0, sizes, house.lafet.color));
	p0 = {x:df/100+t, y:yh, z:w1+df/100};
	proj.add(paintRect(null, p0, sizes, house.lafet.color));
	
	
	sizes = {x:t, y:h, z:w1};	
	p0 = {x:w1+df/100, y:yh, z:df/100};
	proj.add(paintRect(null, p0, sizes, house.lafet.color));
	p0 = {x:df/100, y:yh, z:t+df/100};
	proj.add(paintRect(null, p0, sizes, house.lafet.color));

	const wc1 = (fundament.w/2-fundament.t/2)/100;
	const dx = (rooms.hallway.w_side-50)/100;
	sizes = {x:1, y:h, z:t};	
	
	p0 = {x:df/100+dx, y:yh, z:wc1};
	proj.add(paintRect(null, p0, sizes, house.lafet.color));

	p0.z = wc1 + fundament.t/100 - t;
	proj.add(paintRect(null, p0, sizes, house.lafet.color));
	

	
	
}



addFundament();
addLafet();


scene.add(proj);



/*
let points = [LFace.pX(15), LFace.pX(25), LFace.pCustom(25, 20, 0), LFace.pCustom(15, 20, 0), LFace.pY(25)];
let verge = new LVerge(points);
console.log(verge);
g_buff.setAttribute( 'position', new THREE.BufferAttribute(verge.toBuffVertex(), 3));
g_buff.setAttribute( 'normal', new THREE.BufferAttribute(verge.toBuffNormals(), 3));
let t_mesh = createMesh(g_buff, 'red');
scene.add(t_mesh);
console.log(t_mesh.geometry);
*/


gl.render(scene, camera); //rendering project



//example animate func
function animate() 
{
	requestAnimationFrame(animate);
    //proj.rotateY(toRad(1)); //rotate on 2 degress
	gl.render( scene, camera );
}
animate();


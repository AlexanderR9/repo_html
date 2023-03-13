//include TREE lib
import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';


//нарисовать линию по двум точкам
function paintLine(scene, p1, p2, color = 'red')
{
	const p_arr = []; 
	p_arr.push(new THREE.Vector3(p1.x, p1.y, p1.z)); 
	p_arr.push(new THREE.Vector3(p2.x, p2.y, p2.z)); 
	const geometry = new THREE.BufferGeometry().setFromPoints(p_arr);
	const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: color})); 
	scene.add(line);
}
//нарисовать оси координат (заданной длинны)
function paintAxis(scene, len, color = 'red')
{
	let p0 = {x:0, y:0, z:0};
	paintLine(scene, p0, {x:0, y:0, z:len});
	paintLine(scene, p0, {x:0, y:len, z:0}, color);
	paintLine(scene, p0, {x:len, y:0, z:0}, color);
}
//нарисовать сетчатую осевую плоскость
function paintAxisPlane(scene, size, steps, type = "XOZ", color = 'LightGray')
{
	var grid = new THREE.GridHelper(size, steps, 'black', color);
	if (type == "XOY") grid.rotateX(Math.PI/2);
	else if (type == "YOZ") grid.rotateZ(Math.PI/2);
	scene.add(grid);	
}
function toRad(degrees)
{
	if (Math.abs(degrees) < 0.1) return 0;
	const one_deg = Math.PI/180;
	return one_deg*degrees;
}


//нарисовать паралелипипед 
//p0 - начальная вершина с минимальными координатами
//sizes - размеры по трем осям
//если is_frame == true, то нарисует только каркас объекта
function paintRect(scene, p0, sizes, color = 'red', is_frame = false)
{
	const geometry = new THREE.BoxGeometry(sizes.x, sizes.y, sizes.z);
	let mat = null;
	if (is_frame) mat = new THREE.MeshBasicMaterial({wireframe: true, color: color}); //применяется для отображения скелета объекта		
	else mat = new THREE.MeshPhongMaterial({color: color});	//применяется для полной закраски объекта, причем источник света будет учитываться
	const mesh = new THREE.Mesh(geometry, mat);	
	mesh.translateX(p0.x + sizes.x/2);
	mesh.translateY(p0.y + sizes.y/2);
	mesh.translateZ(p0.z + sizes.z/2);
	scene.add(mesh);
	return mesh;
}
//нарисовать плоскость 
//p0 - начальная вершина с минимальными координатами
//sizes - размеры осям X/Y
//если is_frame == true, то нарисует только каркас объекта
function paintPlain(scene, p0, sizes, color = 'red', is_frame = false)
{
	const geometry = new THREE.PlaneGeometry(sizes.x, sizes.y);	
	let mat = null;
	if (is_frame) mat = new THREE.MeshBasicMaterial({wireframe: true, color: color, side: THREE.DoubleSide}); //применяется для отображения скелета объекта		
	else mat = new THREE.MeshPhongMaterial({color: color, side: THREE.DoubleSide});	//применяется для полной закраски объекта, причем источник света будет учитываться
	
	const mesh = new THREE.Mesh(geometry, mat);	
	mesh.translateX(p0.x + sizes.x/2);
	mesh.translateY(p0.y + sizes.y/2);
	scene.add(mesh);
	return mesh;
}

//my common funcs
//возвращает объект с размерами канваса
function canvasRect(win_hfactor = 0.8)
{
    let div = document.getElementById('canvas_div');
    if (!div) {alert("ERROR: canvas_div element not found!"); return null;}

    let rect = div.getBoundingClientRect();
    let w = rect.width-4;
    let h = window.innerHeight*win_hfactor;
    return {w: w, h: h, screen_factor: w/h};
}
//инициализация WebGL объекта
function initGL(color = 'lightgray', clipping_enabled = true) //return GL object 
{
    const canvas_rect = canvasRect();
    if (!canvas_rect) return null;

    let renderer = new THREE.WebGLRenderer();
    renderer.setSize(canvas_rect.w, canvas_rect.h);
    document.getElementById('canvas_div').appendChild(renderer.domElement);
    renderer.setClearColor(color);
	renderer.localClippingEnabled = clipping_enabled;
    return renderer;
}
//создание и инициализация объекта - точки наблюдения
function initCamera(pos, min = 1, max = 100)
{
    const canvas_rect = canvasRect();
    if (!canvas_rect) return null;

    let camera = new THREE.PerspectiveCamera(60, canvas_rect.screen_factor, min, max);
    camera.position.set(pos.x, pos.y, pos.z);
	camera.lookAt(0, 0, 0);	
    return camera;
}
//добавить на сцену оси координат типа THREE.AxesHelper
function addTHREEAxis(scene, size = 50)
{
    const axesHelper = new THREE.AxesHelper( 50 );
    scene.add( axesHelper );    
}
//добавить направленный источник света типа THREE.DirectionalLight (аналог солнца)
function addLight(scene, pos = {x:-100, y:100, z:100}, color = 'white')
{
    const dl = new THREE.DirectionalLight(0xffffff, 1);
    dl.position.set(pos.x, pos.y, pos.z);
    scene.add(dl);
}
function initOrbitControl(camera, gl_obj)
{
    const controls = new OrbitControls(camera, gl_obj.domElement);
    controls.update();
}


export {initGL, initCamera, initOrbitControl, addTHREEAxis, toRad, paintAxis, addLight};




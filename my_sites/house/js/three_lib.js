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
	if (scene) scene.add(mesh);
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
//если win_hfactor < 0, то берет высоту canvas_div
//border_offset-отступ от границ canvas_div
function canvasRect(win_hfactor = -1, border_offset = 4)
{
    let div = document.getElementById('canvas_div');
    if (!div) {alert("ERROR: canvas_div element not found!"); return null;}
	//div.style.height = "1000px";


    let rect = div.getBoundingClientRect();
    let w = rect.width-border_offset*2;
    let h = window.innerHeight*win_hfactor;
	if (win_hfactor < 0) h = rect.height-border_offset*2;
    return {w: w, h: h, screen_factor: w/h};
}
//инициализация WebGL объекта
function initGL(color = 'lightgray', clipping_enabled = true) //return GL object 
{
    const canvas_rect = canvasRect();
    if (!canvas_rect) return null;

    let renderer = new THREE.WebGLRenderer();
    renderer.setSize(canvas_rect.w, canvas_rect.h);
	renderer.domElement.id = "canvas";
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
//инициализация объекта для вращения сцены при помощи мыши
function initOrbitControl(camera, gl_obj)
{
    const controls = new OrbitControls(camera, gl_obj.domElement);
	//control.object.position.set(camera.position.x, camera.position.y, camera.position.z);
	//control.target = new THREE.Vector3(0, 15, 0);
    controls.update();
}
//создание объекта Mesh
function createMesh(geometry, color, is_frame = false)
{
	if (!geometry) return null;
	if (!geometry.isBufferGeometry) return null;
	
	let mat = null;
	if (is_frame) mat = new THREE.MeshBasicMaterial({wireframe: true, color: color}); //применяется для отображения скелета объекта		
	else mat = new THREE.MeshStandardMaterial({color: color});	//применяется для полной закраски объекта, причем источник света будет учитываться
	
	return (new THREE.Mesh(geometry, mat));		
}

//точка в 3D (вершина) 
/*
class LVertex
{
	constructor(vec1, vec2) //THREE.Vector3(point_xyz) ,  THREE.Vector3(normal_xyz)
	{
		this.x = vec1.x;
		this.y = vec1.y;
		this.z = vec1.z;
		
		this.normal_x = vec2.x;
		this.normal_y = vec2.y;
		this.normal_z = vec2.z;
	}
	constructor(x, y, z)
	{
		this.x = x;
		this.y = y;
		this.z = z;
		
		this.normal_x = 0;
		this.normal_y = 0;
		this.normal_z = 0;
	}
	
	function setNormal(vec)
	{
		this.normal_x = vec.x;
		this.normal_y = vec.y;
		this.normal_z = vec.z;
	}

}
*/

//элемент грани, состоящий из трех вершин Vector3
class LFace
{
	constructor(p1, p2, p3) 
	{
		this.p1 = p1;
		this.p2 = p2;
		this.p3 = p3;
		this.normal = new THREE.Vector3(); 
		this._recalcNormal();
	}
	setNormal(vec)
	{
		this.normal.copy(vec);
	}
	toBuffVertex()
	{
		let arr = [];
		this._addPointToBuffVertex(arr, this.p1);
		this._addPointToBuffVertex(arr, this.p2);
		this._addPointToBuffVertex(arr, this.p3);
		return arr;
	}
	toBuffNormal()
	{
		let arr = [];
		this._addPointToBuffVertex(arr, this.normal);
		this._addPointToBuffVertex(arr, this.normal);
		this._addPointToBuffVertex(arr, this.normal);
		return arr;
	}
	
	
	_addPointToBuffVertex(arr, p)
	{
		arr.push(p.x, p.y, p.z);
	}
	_recalcNormal()
	{
		const a = LFace.vectorByPoints(this.p1, this.p2);
		const b = LFace.vectorByPoints(this.p1, this.p3);
		this.normal = LFace.vectorMultiplication(a, b);
	}

	//static funcs
	static vectorMultiplication(a, b) //векторное произведение (axb)
	{
		let result = new THREE.Vector3();
		result.setX(a.y*b.z - a.z*b.y);
		result.setY(a.z*b.x - a.x*b.z);
		result.setZ(a.x*b.y - a.y*b.x);
		return result;
	}
	static vectorByPoints(p1, p2) //возвращает верктор полученный по двум точкам
	{
		let result = new THREE.Vector3(p2.x-p1.x, p2.y-p1.y, p2.z-p1.z);
		return result;
	}
	
	static pX(x) {return new THREE.Vector3(x, 0, 0);}
	static pY(y) {return new THREE.Vector3(0, y, 0);}
	static pZ(z) {return new THREE.Vector3(0, 0, z);}
	static pNull() {return new THREE.Vector3(0, 0, 0);}
	static pCustom(x, y, z) {return new THREE.Vector3(x, y, z);}
	
	
}

//грань объекта 3D, состоящая из N вершин Vector3 лежащих в одной плоскости
class LVerge
{
	constructor(points) //array of Vector3
	{
		this.faces = []; //array of LFace
		if (points.length < 4) return;
		
		
		if (points.length == 4)
		{
			let face = new LFace(points[0], points[1], points[2]);
			this._addFace(face);
			face = new LFace(points[0], points[2], points[3]);
			this._addFace(face);
		}
		else
		{
			let self = this;
			let mid_p = this._calc_mid_point(points);
			points.forEach(function(p, i) {
				if (i > 0)
				{
					const face = new LFace(mid_p, points[i-1], points[i]);
					self._addFace(face);
				}
			});				
		}
	}
	invalid()
	{
		if (this.faces.length < 1) return true;
		return false;
	}
	setNormal(vec)
	{
		this.faces.forEach(function(face) {face.setNormal(vec);});
	}
	
	toBuffVertex()
	{
		let arr = [];
		this.faces.forEach(function(face, i) 
		{
			arr = arr.concat(face.toBuffVertex());
			console.log("toBuffVertex: face_"+i+"   cur arr_size="+arr.length);
		});
		return (new Float32Array(arr));
	}
	toBuffNormals()
	{
		let arr = [];
		this.faces.forEach(function(face, i) 
		{
			arr = arr.concat(face.toBuffNormal());
			console.log("toBuffNolmals: face_"+i+"   cur arr_size="+arr.length);
		});
		return (new Float32Array(arr));
	}
	
	//protected funcs
	_addFace(face)
	{
		this.faces.push(face);
	}
	_calc_mid_point(points)
	{
		let min = new THREE.Vector3(points[0].x, points[0].y, points[0].z);
		let max = new THREE.Vector3(points[0].x, points[0].y, points[0].z);
		points.forEach(function(p) {
			if (p.x < min.x) min.x = p.x;
			if (p.y < min.y) min.y = p.y;
			if (p.z < min.z) min.z = p.z;
			
			if (p.x < max.x) max.x = p.x;
			if (p.y < max.y) max.y = p.y;
			if (p.z < max.z) max.z = p.z;
		});
		return (new THREE.Vector3((min.x+max.x)/2, (min.y+max.y)/2, (min.z+max.z)/2));
	}
}



export {initGL, initCamera, initOrbitControl, addTHREEAxis, toRad, paintAxis, addLight, createMesh, paintRect,
		LVerge, LFace};




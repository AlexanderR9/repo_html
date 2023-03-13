
//include modules
import * as THREE from './three.module.js';
import {initGL, initCamera, addTHREEAxis, toRad, addLight, initOrbitControl} from './three_lib.js';


//////////////////////////////BODY MODULE//////////////////////////////////////

//init main WebGL objects for THREE lib
let scene = new THREE.Scene();
let camera = initCamera({x:-50, y:20, z:-30});
let gl = initGL('pink');

//init add-ons object of THREE lib
initOrbitControl(camera, gl);
addTHREEAxis(scene);
addLight(scene);


//project example
const geometry = new THREE.BoxGeometry( 20, 10, 20 );
const material = new THREE.MeshStandardMaterial( {color: 0x00ff00} );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );
/*
    ..............
        code yoir code
    .............

*/
gl.render(scene, camera); //rendering project



//example animate func
function animate() 
{
	requestAnimationFrame(animate);
    cube.rotateY(toRad(2)); //rotate on 2 degress
	gl.render( scene, camera );
}
animate();


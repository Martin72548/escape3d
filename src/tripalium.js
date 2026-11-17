import * as THREE from 'three';

export function addTripalium(parent) {
	const root=new THREE.Group();root.name='Tripalium de tres postes';root.position.set(0,0,-8.85);parent.add(root);
	root.userData.shackles=[];
	const size=128,data=new Uint8Array(size*size*4);
	for(let y=0;y<size;y++)for(let x=0;x<size;x++){
		const grain=Math.sin(x*.48+Math.sin(y*.035)*1.8)*9+Math.sin(x*1.7+y*.018)*4;
		const crack=Math.sin(x*.23+Math.sin(y*.012))>.98?-26:0;
		const index=(y*size+x)*4;data.set([91+grain+crack,66+grain*.7+crack,42+grain*.5+crack,255],index);
	}
	const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
	const wood=new THREE.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.025,roughness:.95});
	const iron=new THREE.MeshStandardMaterial({color:0x34302b,metalness:.72,roughness:.66});
	const rope=new THREE.MeshStandardMaterial({color:0x8a7251,roughness:1});
	function mesh(geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
	function beam(a,b,w=.18,d=.18){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const m=mesh(new THREE.BoxGeometry(w,delta.length(),d),wood);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
	const posts=[[-1.05,.32],[1.05,.32],[0,-.6]];
	for(const [index,[x,z]] of posts.entries()){
		const post=beam([x,.05,z],[x,3.35,z],.22,.22);post.name='Poste principal del tripalium '+(index+1);
		mesh(new THREE.BoxGeometry(.46,.12,.5),wood,x,.06,z);
		for(const y of [.3,2.7,3.17]){
			mesh(new THREE.BoxGeometry(.25,.085,.25),iron,x,y,z);
			for(const side of [-1,1]){const rivet=mesh(new THREE.SphereGeometry(.024,10,8),iron,x+side*.086,y,z+.131);rivet.scale.z=.35;}
		}
	}
	beam([-1.05,3.08,.32],[1.05,3.08,.32],.2,.21);
	beam([-1.05,3.08,.32],[0,3.08,-.6],.16,.17);beam([1.05,3.08,.32],[0,3.08,-.6],.16,.17);
	beam([-1.05,.22,.32],[0,.22,-.6],.15,.16);beam([1.05,.22,.32],[0,.22,-.6],.15,.16);
	for(const side of [-1,1]){
		beam([side*1.05,.2,.32],[side*1.05,1.15,-.25],.12,.13);
		const chainX=side*.72;
		for(let i=0;i<8;i++){
			const link=mesh(new THREE.TorusGeometry(.044,.011,8,16),iron,chainX,2.94-i*.075,.36);link.rotation.y=i%2*Math.PI/2;
		}
		const shackle=mesh(new THREE.TorusGeometry(.11,.022,10,28),iron,chainX,2.3,.36);shackle.scale.y=.8;shackle.name='Argolla de mu?eca '+side;shackle.userData.side=side;root.userData.shackles.push(shackle);
		for(let i=0;i<3;i++){
			const binding=mesh(new THREE.TorusGeometry(.13,.013,8,24),rope,side*1.05,.8+i*.035,.32);binding.rotation.x=Math.PI/2;
		}
	}
	const restraint=mesh(new THREE.TorusGeometry(.16,.02,10,32),iron,0,1.55,-.455);restraint.scale.y=.8;
	return root;
}

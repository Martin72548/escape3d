import * as THREE from 'three';

export function addMedievalTunic(person, fabric) {
	const material=new THREE.MeshStandardMaterial({color:0xaaa08a,map:fabric,bumpMap:fabric,bumpScale:.003,roughness:.98,side:THREE.DoubleSide});
	const geometry=new THREE.LatheGeometry([[.335,.61],[.326,.69],[.305,.8],[.275,.92],[.249,1.025],[.246,1.065]].map(p=>new THREE.Vector2(...p)),80);
	const positions=geometry.attributes.position,weights=[],indices=[];
	for(let i=0;i<positions.count;i++){
		const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),angle=Math.atan2(x,z);
		const lower=1-THREE.MathUtils.smoothstep(y,.61,1.05);
		const fold=1+Math.sin(angle*12+y*3)*(.015+lower*.04)+Math.cos(angle*7)*.015*lower;
		const hem=y<.63?Math.sin(angle*13)*.009+Math.sin(angle*5)*.007:0;
		positions.setXYZ(i,x*fold,y+hem,z*fold*.72);
		const legWeight=lower*.28;
		indices.push(0,x<0?2:1,0,0);weights.push(1-legWeight,legWeight,0,0);
	}
	geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();
	const skirt=new THREE.SkinnedMesh(geometry,material);skirt.name='Faldon corto de tunica medieval';skirt.castShadow=skirt.receiveShadow=true;skirt.frustumCulled=false;person.add(skirt);
	person.updateWorldMatrix(true,true);
	skirt.bind(new THREE.Skeleton([person,person.getObjectByName('left-leg'),person.getObjectByName('right-leg')]),person.matrixWorld.clone());
	const details=new THREE.Group();details.name='Cinturon y lazada de la tunica medieval';person.add(details);
	const rope=new THREE.MeshStandardMaterial({color:0x69543a,roughness:1});
	function cord(points,radius=.007){const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,radius,8,false),rope);m.castShadow=true;details.add(m);return m;}
	for(let i=0;i<2;i++){
		const belt=new THREE.Mesh(new THREE.TorusGeometry(.257,.009,8,80),rope);belt.rotation.x=Math.PI/2;belt.scale.y=.72;belt.position.y=1.025+i*.014;belt.castShadow=true;details.add(belt);
	}
	cord([[.065,1.04,.193],[.105,1.01,.197],[.083,.98,.195],[.057,1.02,.2]]);
	cord([[.083,1.015,.196],[.11,.87,.224],[.075,.79,.24]],.006);
	cord([[.065,1.015,.2],[.035,.89,.23],[.05,.84,.23]],.006);
	// A narrow laced opening turns the plain short sleeves into a tunic bodice.
	const opening=new THREE.Shape();opening.moveTo(-.05,1.47);opening.lineTo(.05,1.47);opening.lineTo(0,1.29);opening.closePath();
	const slit=new THREE.Mesh(new THREE.ShapeGeometry(opening),new THREE.MeshStandardMaterial({color:0x463e31,roughness:1,side:THREE.DoubleSide}));slit.position.z=.146;details.add(slit);
	for(let i=0;i<4;i++){
		const y=1.445-i*.035,w=.038-i*.007,z=.155+(1.445-y)*.16;
		cord([[-w,y,z],[w*.75,y-.025,z+.004]],.003);
		cord([[w,y,z],[-w*.75,y-.025,z+.004]],.003);
	}
	// The upper details follow the same torso control as the skinned shirt.
	person.getObjectByName('prisoner-torso').attach(details);
	return {skirt,details};
}

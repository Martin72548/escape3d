import * as THREE from 'three';

// Sixteen different cut-stone faces share one PBR atlas and one draw call.
export function createMedievalFloorMaterial() {
	const tile=192, grid=4, size=tile*grid;
	const colors=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4),normals=new Uint8Array(size*size*4),heights=new Float32Array(size*size);
	function hash(x,y,seed){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
	function noise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy,seed),hash(ix+1,iy,seed),sx),THREE.MathUtils.lerp(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),sx),sy);}
	function fractal(x,y,seed){let value=0,amplitude=.55;for(let i=0;i<5;i++){value+=noise(x,y,seed+i*31)*amplitude;x*=2.03;y*=2.03;amplitude*=.47;}return value;}
	for(let y=0;y<size;y++)for(let x=0;x<size;x++){
		const tx=Math.floor(x/tile),ty=Math.floor(y/tile),seed=tx+ty*grid+611,u=(x%tile)/(tile-1),v=(y%tile)/(tile-1);
		const broad=fractal(u*3,v*3,seed),grain=noise(u*65,v*65,seed+7),fine=hash(x,y,seed);
		const mineral=noise(u*17+broad*3,v*17,seed+81),pit=Math.max(0,.34-noise(u*70,v*70,seed+9))*3;
		const edge=Math.min(u,1-u,v,1-v),wear=1-THREE.MathUtils.smoothstep(edge,.002,.035);
		const seam=1-THREE.MathUtils.smoothstep(edge,0,.007);
		const fissure=Math.max(0,1-Math.abs(noise(u*11,v*11,seed+44)-.51)*110)*(1-THREE.MathUtils.smoothstep(noise(u*4,v*4,seed+22),.35,.7));
		const shade=108+(broad-.48)*60+(mineral-.5)*20+(grain-.5)*16+(fine-.5)*7-pit*29-fissure*18+wear*10-seam*20;
		const index=(y*size+x)*4,warm=hash(tx,ty,414)*5;
		colors.set([shade+7+warm,shade+4,shade-3-warm,255],index);
		const rough=THREE.MathUtils.clamp(226+(broad-.5)*20+pit*25-wear*9,195,255);roughness.set([rough,rough,rough,255],index);
		heights[y*size+x]=broad*.24+grain*.04-pit*.1-fissure*.045-wear*.03-seam*.012;
	}
	for(let y=0;y<size;y++)for(let x=0;x<size;x++){
		const left=x%tile===0?x:x-1,right=x%tile===tile-1?x:x+1,top=y%tile===0?y:y-1,bottom=y%tile===tile-1?y:y+1;
		const dx=(heights[y*size+right]-heights[y*size+left])*16,dy=(heights[bottom*size+x]-heights[top*size+x])*16;
		const normal=new THREE.Vector3(-dx,-dy,1).normalize();normals.set([(normal.x*.5+.5)*255,(normal.y*.5+.5)*255,(normal.z*.5+.5)*255,255],(y*size+x)*4);
	}
	function texture(data){const map=new THREE.DataTexture(data,size,size);map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.generateMipmaps=true;map.anisotropy=8;map.needsUpdate=true;return map;}
	const map=texture(colors);map.colorSpace=THREE.SRGBColorSpace;
	const material=new THREE.MeshStandardMaterial({map,normalMap:texture(normals),roughnessMap:texture(roughness),roughness:.94,normalScale:new THREE.Vector2(1.3,1.3),metalness:0});
	material.name='Losas medievales de piedra caliza desgastada';
	material.onBeforeCompile=shader=>{
		shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
		#ifdef USE_INSTANCING
		 float stoneSeed=fract(sin(dot(instanceMatrix[3].xy,vec2(12.9898,78.233)))*43758.5453);
		 float stoneFace=floor(stoneSeed*16.0);
		 vec2 stoneCell=vec2(mod(stoneFace,4.0),floor(stoneFace/4.0));
		 vec2 stoneUV=(uv*0.984+0.008+stoneCell)/4.0;
		 vMapUv=stoneUV;vNormalMapUv=stoneUV;vRoughnessMapUv=stoneUV;
		#endif`);
	};
	material.customProgramCacheKey=()=> 'medieval-floor-atlas-v1';
	return material;
}

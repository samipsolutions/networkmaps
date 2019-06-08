// Shaders
const DEVICE_VERTEX_SHADER = `
	varying vec2 vUv;
	varying vec3 vNormal;

	void main() {
		vUv = uv;
		vNormal = normalMatrix * normal;

	 	gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
	}
`

const DEVICE_FRAGMENT_SHADER = `
#if NUM_DIR_LIGHTS > 0
    struct DirectionalLight {
        vec3 direction;
        vec3 color;
        int shadow;
        float shadowBias;
        float shadowRadius;
        vec2 shadowMapSize;
     };
    uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
#endif
	uniform vec3 ambientLightColor;
	
	varying vec2 vUv;
	varying vec3 vNormal;

	uniform sampler2D map;
	uniform vec3 mycolor;

	void main() {
		vec4 tex_color = texture2D(map, vUv) + vec4(mycolor, 1.0);
		vec4 light = vec4(0, 0, 0, 1.0);
		
		vec3 norm = normalize(vNormal);

		for(int i = 0; i < NUM_DIR_LIGHTS; i++) {
			vec3 lightdir = normalize(directionalLights[i].direction);
			light.rgb += clamp(
							dot(
								lightdir,
                               	norm
                            ), 
                            0.0, 
                            1.0
                            )
                         * directionalLights[i].color
                         * vec3(1,1,1);
		}
		gl_FragColor = tex_color * (light + vec4(ambientLightColor, 0.0));
		
	}
`

// Shortcut
function $WGL_V3(x,y,z) {return new THREE.Vector3(x,y,z)}
function $WGL_V2(x,y) {return new THREE.Vector2(x,y)}
function $WGL_F3(a,b,c) {return new THREE.Face3(a,b,c)}

function WGL_initialize() {

}

function WGL_createDeviceMaterial(parameters) {
	let uniforms = THREE.UniformsUtils.merge( [
			THREE.UniformsLib[ "common" ],
    		THREE.UniformsLib[ "lights" ],
    		{
    			mycolor: {type: 'c', value: new THREE.Color() }
    		},
		]);
	uniforms.map.value = parameters.map;
	uniforms.mycolor.value = new THREE.Color(parameters.mycolor);

	let material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: DEVICE_VERTEX_SHADER,
    	fragmentShader: DEVICE_FRAGMENT_SHADER,

    	lights: true,
	});

	return material;
}
function WGL_loadFont(url, obj) {
	obj.font = new THREE.FontLoader().parse(WGL_FONT);
}

// Class
class WGL {
	constructor(domelement) {
		this.global_settings = {
        	show_device_name: true,
        	grid: {
        		active: true,
        		x: .5,
        		z: .5,
        		angle: 15,
        		resize: .25,
        	}
    	}

		this.domelement = domelement;
		this.scene = {
			L2: new THREE.Scene(),
			L3: new THREE.Scene(),
		};
		this.view = "L2";

		let cam_ratio = domelement.clientWidth / domelement.clientHeight;
		
		let initial_ortho_size = 7;

		this.camera = {
			L2: {
				persp: new THREE.PerspectiveCamera( 30, cam_ratio, 0.1, 1000 ),
				ortho: new THREE.OrthographicCamera( -initial_ortho_size * cam_ratio, initial_ortho_size * cam_ratio, initial_ortho_size, -initial_ortho_size, 1, 200),
				ortho_size: initial_ortho_size,
			},
			L3: {
				persp: new THREE.PerspectiveCamera( 30, cam_ratio, 0.1, 1000 ),
				ortho: new THREE.OrthographicCamera( -initial_ortho_size * cam_ratio, initial_ortho_size * cam_ratio, initial_ortho_size, -initial_ortho_size, 1, 200),
				ortho_size: initial_ortho_size,
			},
			current: "persp",
		}

		this.camera.L2.persp.position.y = 30;
		this.camera.L2.persp.position.z = 30;
		this.camera.L2.persp.rotation.x = -Math.PI/4.0;
		this.camera.L2.persp.rotation.order="YXZ";

		this.camera.L3.persp.position.y = 30;
		this.camera.L3.persp.position.z = 30;
		this.camera.L3.persp.rotation.x = -Math.PI/4.0;
		this.camera.L3.persp.rotation.order="YXZ";

		this.camera.L2.ortho.position.y = 30;
		this.camera.L2.ortho.rotation.x = -Math.PI/2.0;
		this.camera.L2.ortho.rotation.order="YXZ";

		this.camera.L3.ortho.position.y = 30;
		this.camera.L3.ortho.rotation.x = -Math.PI/2.0;
		this.camera.L3.ortho.rotation.order="YXZ";

		this.renderer = new THREE.WebGLRenderer( {
			antialias:true,
		});
		this.renderer.setClearColor(0xf0f0f0);
		this.renderer.setSize( domelement.clientWidth, domelement.clientHeight );
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFShadowMap;

		// Lighting
		this.ambientlightL2 = new THREE.AmbientLight(0xFFFFFF, 0.7);
		this.directionallightL2 = new THREE.DirectionalLight(0xFFFFFF, .4);
		this.directionallightL2.castShadow = true;
		this.directionallightL2.position.set(40,100,60);
		this.directionallightL2.shadow.camera.left = -50;
		this.directionallightL2.shadow.camera.right = 50;
		this.directionallightL2.shadow.camera.bottom = -50;
		this.directionallightL2.shadow.camera.top = 50;
		this.directionallightL2.shadow.camera.far = 200;
		this.directionallightL2.shadow.mapSize.width = 4096;
		this.directionallightL2.shadow.mapSize.height = 4096;
		this.scene.L2.add(this.ambientlightL2);
		this.scene.L2.add(this.directionallightL2);
		
		this.ambientlightL3 = new THREE.AmbientLight(0xFFFFFF, 0);
		this.directionallightL3 = new THREE.DirectionalLight(0xFFFFFF, 1);
		this.directionallightL3.castShadow = true;
		this.directionallightL3.position.set(40,100,60);
		this.directionallightL3.shadow.camera.left = -50;
		this.directionallightL3.shadow.camera.right = 50;
		this.directionallightL3.shadow.camera.bottom = -50;
		this.directionallightL3.shadow.camera.top = 50;
		this.directionallightL3.shadow.camera.far = 200;
		this.directionallightL3.shadow.mapSize.width = 4096;
		this.directionallightL3.shadow.mapSize.height = 4096;
		this.scene.L3.add(this.ambientlightL3);
		this.scene.L3.add(this.directionallightL3);

		domelement.appendChild( this.renderer.domElement );

		this.raycaster = new THREE.Raycaster();
		this.pickvector = $WGL_V2(0,0);
		
		this.draw_needed = true;
		this.tempVector = $WGL_V3(0,0,0);

		this.font = new THREE.FontLoader().parse(WGL_FONT);
		this.namematerial = new THREE.MeshStandardMaterial({color: 0x000000});

		//var helper = new THREE.CameraHelper( this.directionallightL2.shadow.camera );
		//this.scene.L2.add(helper);
	}

	resize() {
		let cam_ratio = this.domelement.clientWidth / this.domelement.clientHeight;
		this.camera.L2.persp.aspect = cam_ratio;
		this.camera.L2.persp.updateProjectionMatrix();
		
		this.camera.L3.persp.aspect = cam_ratio;
		this.camera.L3.persp.updateProjectionMatrix();
		
		this.camera.L2.ortho.left = -this.camera.L2.ortho_size * cam_ratio;
		this.camera.L2.ortho.right = this.camera.L2.ortho_size * cam_ratio;
		this.camera.L2.ortho.updateProjectionMatrix();

		this.camera.L3.ortho.left = -this.camera.L3.ortho_size * cam_ratio;
		this.camera.L3.ortho.right = this.camera.L3.ortho_size * cam_ratio;
		this.camera.L3.ortho.updateProjectionMatrix();
		
		this.renderer.setSize(this.domelement.clientWidth, this.domelement.clientHeight)
		this.draw_needed = true;
	}

	setView(view) {
		this.draw_needed = true;
		this.view = view;		
	}

	draw() {
		if(this.draw_needed) {
			this.renderer.render( this.scene[this.view], this.camera[this.view][this.camera.current] );
			this.draw_needed = false;
		}
	}

	processLoadedTexture(texture) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.anisotropy = 4;

		this.draw_needed = true;
	}

	// ***********************************************
	// Camera Functions
	// ***********************************************
	setCamera(px, py, pz, rx, ry, rz) {
		let ac = this.camera[this.view][this.camera.current];
		ac.position.x = px;
		ac.position.y = py;
		ac.position.z = pz;
		ac.rotation.x = rx;
		ac.rotation.y = ry;
		ac.rotation.z = rz;
		this.draw_needed = true;		
	}
	moveCamera(dx, dy) {
		let ac = this.camera[this.view][this.camera.current];
		let sin = Math.sin(ac.rotation.y);
		let cos = Math.cos(ac.rotation.y);
		ac.position.x -= dx * .1 * cos + dy * .1 * sin;
		ac.position.z -= -dx * .1 * sin + dy * .1 * cos;

		this.draw_needed = true;
	}

	rotateCamera(dx, dy) {
		let ac = this.camera[this.view][this.camera.current];

		if(this.camera.current == "persp") {
			ac.rotation.y += dx/100.0;
			ac.rotation.x += dy/100.0;
			if (ac.rotation.x > Math.PI*.5)
				ac.rotation.x = Math.PI*.5
			if (ac.rotation.x < -Math.PI*.5)
				ac.rotation.x = -Math.PI*.5

			this.draw_needed = true;
		}
		else {
			ac.rotation.y += dx/100.0;
			this.draw_needed = true;
		}
	}

	zoomCamera(dy) {
		let ac = this.camera[this.view][this.camera.current];

		if(this.camera.current == "persp") {
			ac.translateZ(dy*.1);
			this.draw_needed = true;
		}
		else {
			this.camera[this.view].ortho_size += dy*.1;
			if(this.camera.L2.ortho_size < 1)
				this.camera.L2.ortho_size = 1;
			if(this.camera.L2.ortho_size > this.domelement.clientHeight*.1)
				this.camera.L2.ortho_size = this.domelement.clientHeight*.1;
			
			let os = this.camera[this.view].ortho_size;

			let cam_ratio = this.domelement.clientWidth / this.domelement.clientHeight;

			ac.left = -this.camera.L2.ortho_size * cam_ratio;
			ac.right = this.camera.L2.ortho_size * cam_ratio;
			ac.top = this.camera.L2.ortho_size;
			ac.bottom = -this.camera.L2.ortho_size;
			ac.updateProjectionMatrix();

			this.draw_needed = true;
		}
	}

	toggleCamera() {
		this.camera.current = this.camera.current == "ortho" ? "persp" : "ortho"
		this.draw_needed = true;
		
		return this.camera.current;
	}


	findMesh(type, id, basemesh) {
		for(let x = 0; x < basemesh.children.length; x++) {
			let c = basemesh.children[x];
			if((c.userData.type === type) && (c.userData.id === id))
				return c;

			let r = this.findMesh(type, id, c);
			if(r)
				return r
		}

		return null
	}

	findLinksOfDevice(devid, basemesh) {
		let meshlist = []
		for(let x = 0; x < basemesh.children.length; x++) {
			let c = basemesh.children[x];
			if(c.userData.type === "link") {
				for(let y = 0; y < c.userData.e.devs.length; y++) {
					if (c.userData.e.devs[y].id == devid) {
						meshlist.push(c);
						break;
					}
				}
			}
		}
		return meshlist;
	}

	findLinksOfBase(base, basemesh) {
		let linklist = {};
		let devids = {};
		for (let i_dev = 0; i_dev < base.children.length; i_dev ++) {
			if (base.children[i_dev].userData.type === "device") {
				devids[base.children[i_dev].userData.id] = true;
			}
		}
		for(let x = 0; x < basemesh.children.length; x++) {
			let c = basemesh.children[x];
			if(c.userData.type === "link") {
				for(let y = 0; y < c.userData.e.devs.length; y++) {
					if (c.userData.e.devs[y].id in devids) {
						linklist[c.userData.id] = c;
						break;
					}
				}				
			}
		}

		return linklist;
	}

	findClosestLinkJointIndex(view, linkid, x, y, z) {
		let mesh = this.getMesh(view, "link", linkid);
		let distance = 10000;
		let index = -1;
		for(let i = 0; i < mesh.userData.e.linedata.points.length; i++) {
			let point = mesh.userData.e.linedata.points[i];
			let newdistance = (point[0]-x)*(point[0]-x)+(point[1]-y)*(point[1]-y)+(point[2]-z)*(point[2]-z);
			if ( newdistance < distance) {
				distance = newdistance;
				index = i;
			}
		}
		return index;
	}

	getMesh(view, type, id) {
		return this.findMesh(type, id, this.scene[view]);
	}

	getMeshPosition(view, type, id) {
		let mesh = this.findMesh(type, id, this.scene[view]);
		let r = {x: mesh.position.x, y: mesh.position.y, z: mesh.position.z};
		if("base" in mesh.userData.e)
			r.base = mesh.userData.e.base;

		return r;
	}

	getMeshRotation(view, type, id) {
		return this.findMesh(type, id, this.scene[view]).rotation;
	}

	getMeshSize(view, type, id) {
		let o = this.findMesh(type, id, this.scene[view])
		this.tempVector.x = o.userData.e.sx;
		this.tempVector.y = o.userData.e.sy;
		this.tempVector.z = o.userData.e.sz;
		return this.tempVector;
	}

	moveMesh(view, type, id, x, y, z, base, alignToGrid) {
		let mesh = this.findMesh(type, id, this.scene[view]);
		if(mesh) {
			if(x !== undefined) {
				mesh.position.x = x;
			}
			if(y !== undefined) {
				mesh.position.y = y;
			}
			if(z !== undefined) {
				mesh.position.z = z;
			}

			if(alignToGrid) {
				this.alignVectorToGrid(mesh.position);
			}

			if(x !== undefined)
				mesh.userData.e.px = mesh.position.x;
			if(y !== undefined) {
				if(mesh.userData.type == "text") {
					let basemesh = this.findMesh("base", mesh.userData.e.base, this.scene[view]);
					mesh.userData.e.py = mesh.position.y - basemesh.userData.e.sy;
				}
				else
					mesh.userData.e.py = mesh.position.y;
			}
			if(z !== undefined)
				mesh.userData.e.pz = mesh.position.z;

			if(base != null) {
				mesh.userData.e.base = base;
				let basemesh = this.findMesh("base", base, this.scene[view]);
				basemesh.add(mesh);
				if(type == "text")
					mesh.position.y = basemesh.userData.e.sy + mesh.userData.e.py;
			}

			mesh.updateMatrixWorld();

			if(type === "device") {
				let listlinks = this.findLinksOfDevice(id, this.scene[view]);
				for (let x = 0; x < listlinks.length; x++) {
					this.updateLinkGeometry(listlinks[x], view);
				}
			}
			else if(type === "base") {
				let links = this.findLinksOfBase(mesh, this.scene[view]);
				for(let link_id in links) {
					this.updateLinkGeometry(links[link_id], view);
				}
			}

			this.draw_needed = true;
		}
	}

	rotateMesh(view, type, id, rx, ry, rz, alignToGrid) {
		let mesh = this.findMesh(type, id, this.scene[view]);
		let grid_angle = this.global_settings.grid.angle * Math.PI / 180;
		if(mesh) {
			if(rx !== undefined) {
				mesh.rotation.x = rx;
				if(alignToGrid && this.global_settings.grid.active)
					mesh.rotation.x = Math.round(mesh.rotation.x / grid_angle) * grid_angle;
				mesh.userData.e.rx = mesh.rotation.x;
			}
			if(ry !== undefined) {
				mesh.rotation.y = ry;
				if(alignToGrid && this.global_settings.grid.active)
					mesh.rotation.y = Math.round(mesh.rotation.y / grid_angle) * grid_angle;
				mesh.userData.e.ry = mesh.rotation.y;
			}
			if(rz !== undefined) {
				mesh.rotation.z = rz;
				if(alignToGrid && this.global_settings.grid.active)
					mesh.rotation.z = Math.round(mesh.rotation.z / grid_angle) * grid_angle;
				mesh.userData.e.rz = mesh.rotation.z;
			}

			mesh.updateMatrixWorld();

			if(type == "base") {
				let links = this.findLinksOfBase(mesh, this.scene[view]);
				for(let link_id in links) {
					this.updateLinkGeometry(links[link_id], view);
				}

			}

			this.draw_needed = true;
		}

	}

	resizeMesh(view, type, id, sx, sy, sz, alignToGrid) {
		let mesh = this.findMesh(type, id, this.scene[view]);
		let resize_step = this.global_settings.grid.resize;
		if(mesh) {
			if (sx != null) {
				if(alignToGrid && this.global_settings.grid.active)
					sx = Math.round(sx / resize_step) * resize_step;
				if(sx >= .1)
					mesh.userData.e.sx = sx;
			}
			if (sy != null) {
				if(alignToGrid && this.global_settings.grid.active)
					sy = Math.round(sy / resize_step) * resize_step;
				if(sy >= .1)
					mesh.userData.e.sy = sy;
			}
			if (sz != null) {
				if(alignToGrid && this.global_settings.grid.active)
					sz = Math.round(sz / resize_step) * resize_step;
				if(sz >= .1)
					mesh.userData.e.sz = sz;
			}
			if(type == "device") {
				this.updateDeviceGeometry(id, view);
				this.addDeviceName(mesh);
			}
			else if(type == "symbol")
				this.updateSymbolGeometry(mesh);

			this.draw_needed = true;
		}
	}

	resizeMesh_Base(view, id, sx, sy, sz, alignToGrid) {
		let mesh = this.findMesh("base", id, this.scene[view]);
		let resize_step = this.global_settings.grid.resize;
		
		if(mesh) {
			if (sx != null) {
				if(alignToGrid && this.global_settings.grid.active)
					sx = Math.round(sx / resize_step) * resize_step;
				if(sx < 1) sx = 1;
				mesh.userData.e.sx = sx;
			}
			if (sy != null) {
				if(alignToGrid && this.global_settings.grid.active)
					sy = Math.round(sy / resize_step) * resize_step;
				if(sy < .5) sy = .5;
				mesh.userData.e.sy = sy;
			}
			if (sz != null) { 
				if(alignToGrid && this.global_settings.grid.active)
					sz = Math.round(sz / resize_step) * resize_step;
				if(sz < 1) sz = 1;
				mesh.userData.e.sz = sz;
			}
			this.updateCubeFloorGeometry(id, view);			
		}	
	}

	settingsMesh_Base(view, id, name, subtype, color1, color2, t1name, t2name, sy, tsx, tsy) {
		let mesh = this.findMesh("base", id, this.scene[view]);

		if (mesh) {
			mesh.userData.e.name = name;
			mesh.userData.e.subtype = subtype;
			mesh.userData.e.color1 = color1;
			mesh.userData.e.color2 = color2;
			mesh.userData.e.t1name = t1name;
			mesh.userData.e.t2name = t2name;
			mesh.userData.e.sy = sy;
			mesh.userData.e.tsx = tsx;
			mesh.userData.e.tsy = tsy;
			this.updateCubeFloorGeometry(id, view);
			this.updateCubeFloorTextures(id, view);

			for(let x = 0; x < mesh.children.length; x++) {
				if(mesh.children[x].userData.type == "device") {
					mesh.children[x].position.y = sy;

					let listlinks = this.findLinksOfDevice(mesh.children[x].userData.id, this.scene[view]);
					for (let x = 0; x < listlinks.length; x++) {
						this.updateLinkGeometry(listlinks[x], view);
					}
				}
				else if(mesh.children[x].userData.type == "text") {
					mesh.children[x].position.y = sy + mesh.children[x].userData.e.py;
				}
				else if(mesh.children[x].userData.type == "symbol") {
					mesh.children[x].position.y = sy;
				}
			}
		}
	}

	settingsMesh_L2Device(id, name, color1, color2, ifnaming) {
		let mesh = this.findMesh("device", id, this.scene["L2"]);
		if(mesh) {
			mesh.userData.e.name = name;
			mesh.userData.e.color1 = color1;
			mesh.userData.e.color2 = color2;
			mesh.userData.e.ifnaming = ifnaming
			this.updateDeviceColor(id, "L2");
			this.addDeviceName(mesh);
		}
	}

	settingsMesh_L2Link(id, type, order, color, weight, height) {
		let mesh = this.findMesh("link", id, this.scene["L2"]);
		if(mesh) {
			mesh.userData.e.type = type;
			mesh.userData.e.order = order;
			mesh.userData.e.linedata.color = color;
			mesh.userData.e.linedata.weight = weight;
			mesh.userData.e.linedata.height = height;
			this.updateLinkGeometry(mesh, "L2");
		}
	}

	settingsMesh_L2Text(id, text, py, height, depth, color) {
		let mesh = this.findMesh("text", id, this.scene["L2"]);
		if(mesh) {
			mesh.userData.e.text = text;
			mesh.userData.e.py = py;
			mesh.userData.e.height = height;
			mesh.userData.e.depth = depth;
			mesh.userData.e.color = color;

			mesh.geometry = this.createTextGeometry(text, height, depth, "center");
			mesh.material = new THREE.MeshStandardMaterial({color: color});

			mesh.position.y = py + mesh.parent.userData.e.sy;

			this.draw_needed = true;
		}
	}

	settingsMesh_L2Symbol(id, data) {
		let mesh = this.findMesh("symbol", id, this.scene["L2"]);
		if(mesh) {
			if(mesh.userData.e.type == "F") {
				mesh.userData.e.color = data.color;
				mesh.userData.e.cd.flagcolor = data.flagcolor;
				this.updateSymbolGeometryFlag(mesh);
			}
		}
	}

	configMesh_L2Device(id, name, vlans, vrfs, svis, los) {
		let mesh = this.findMesh("device", id, this.scene["L2"]);
		if(mesh) {
			mesh.userData.e.vlans = vlans;
			mesh.userData.e.vrfs = vrfs;
			mesh.userData.e.svis = svis;
			mesh.userData.e.los = los;
		}
	}

	configMesh_L2Link(id, ifbindings, lag_name, lacp, transceiver) {
		let mesh = this.findMesh("link", id, this.scene["L2"]);
		if(mesh) {
			if(!("phy" in mesh.userData.e)) {
				mesh.userData.e.phy = {};
			}
			mesh.userData.e.phy.ifbindings = ifbindings;
			mesh.userData.e.phy.lag_name = lag_name;
			mesh.userData.e.phy.lacp = lacp;
			mesh.userData.e.phy.transceiver = transceiver;
		}
	}

	configMesh_L2LinkDevice(id, dev_index, if_function, vlans, native_vlan, subinterfaces) {
		let mesh = this.findMesh("link", id, this.scene["L2"]);
		if(mesh) {
			if(!("data" in mesh.userData.e.devs[dev_index])) {
				mesh.userData.e.devs[dev_index].data = {
					function: "none", function_data: {}
				};
			}
			
			mesh.userData.e.devs[dev_index].data.function = if_function;
			if(if_function == "switching") {
				mesh.userData.e.devs[dev_index].data.function_data = {
					vlans: vlans,
					native_vlan: native_vlan,
				}
			}
			else if(if_function == "routing") {
				mesh.userData.e.devs[dev_index].data.function_data = {
					subinterfaces: subinterfaces
				}
			}
			else
				mesh.userData.e.devs[dev_index].data.function_data = {};	
		}		
	}

	deleteMesh(view, type, id) {
		let mesh = this.findMesh(type, id, this.scene[view]);
		while(mesh) {
			mesh.parent.remove(mesh);
			this.draw_needed = true;

			if (type == "device") {
				let listlinks = this.findLinksOfDevice(id, this.scene[view]);
				for (let x = 0; x < listlinks.length; x++) {
					listlinks[x].parent.remove(listlinks[x]);
				}
			}
			mesh = this.findMesh(type, id, this.scene[view]);
		}
	}

	deleteJoint(view, link_id, joint_index) {
		let mesh = this.findMesh("link", link_id, this.scene[view]);
		if(mesh) {
			mesh.userData.e.linedata.points.splice(joint_index, 1);
			this.updateLinkGeometry(mesh, "L2");
		}
	}

	pickObject(x, y) {
		this.pickvector.x = ((x-this.domelement.offsetLeft) / this.domelement.clientWidth) * 2 - 1;
		this.pickvector.y = ((-y+this.domelement.offsetTop) / this.domelement.clientHeight) * 2 + 1;
		this.raycaster.setFromCamera( this.pickvector, this.camera[this.view][this.camera.current] );

		let intersects = this.raycaster.intersectObjects( this.scene[this.view].children, true );

		let result = [];

		for ( let i = 0; i < intersects.length; i++ ) {
			if("id" in intersects[i].object.userData) {
				result.push( {
					view: this.view, 
					p: intersects[i].point,
					mesh: intersects[i].object,
				});
			}
		}

		return result;
	}
	
	pickLevel(x,y, height) {
		this.pickvector.x = (x / this.domelement.clientWidth) * 2 - 1;
		this.pickvector.y = (-y / this.domelement.clientHeight) * 2 + 1;
		this.raycaster.setFromCamera( this.pickvector, this.camera[this.view][this.camera.current] );

		let plane = new THREE.Plane($WGL_V3(0,1,0), -height);
		return this.raycaster.ray.intersectPlane( plane );
	}

	convertWorld2MeshCoordinates(view, type, id, x, y, z) {
		let mesh = this.findMesh(type, id, this.scene[view]);

		this.tempVector.set(x,y,z);
		mesh.worldToLocal(this.tempVector);

		return this.tempVector;
	}

	convertMesh2WorldCoordinates(view, type, id, x, y, z) {
		let mesh = this.findMesh(type, id, this.scene[view]);

		this.tempVector.set(x,y,z);
		mesh.localToWorld(this.tempVector);

		return this.tempVector;
	}

	updateGlobalSettings_show_device_name(show_device_name) {
		this.global_settings.show_device_name = show_device_name;
		
		// Update visibilit of device names
		for(let view in this.scene) {
			for(let x = 0; x < this.scene[view].children.length; x++) {
				let be = this.scene[view].children[x];
				if (be.userData.type === "base") {
					for(let y = 0; y < be.children.length; y++) {
						if(be.children[y].userData.type === "device") {
							this.updateDeviceNameVisibility(be.children[y]);
						}
					}
				}
			}
		}

		this.draw_needed = true;
	}

	updateGlobalSettings_grid(active, x, z, angle, resize) {
		this.global_settings.grid.active = active;
		this.global_settings.grid.x = parseFloat(x);
		this.global_settings.grid.z = parseFloat(z);
		this.global_settings.grid.angle = parseFloat(angle);
		this.global_settings.grid.resize = parseFloat(resize);
	}

	alignVectorToGrid(vector) {
		if(this.global_settings.grid.active) {
			vector.x = Math.round(vector.x / this.global_settings.grid.x) * this.global_settings.grid.x;
			vector.z = Math.round(vector.z / this.global_settings.grid.z) * this.global_settings.grid.z;
		}
	}

	// ***********************************************
	// Functions to create/update meshes
	// ***********************************************
	findMeshesOfGroup(meshgroup) {
		let m1 = null; let m2 = null;
		for(let x = 0; x < meshgroup.children.length; x++) {
			if (meshgroup.children[x].userData.submesh === 1)
				m1 = meshgroup.children[x];
			else if (meshgroup.children[x].userData.submesh === 2)
				m2 = meshgroup.children[x];

			if((m1 != null) && (m2 != null))
				break;
		}

		return [m1, m2];
	}

	addListVertex(l, vl) {
		for(let x = 0; x < vl.length; x++) {
			l.push($WGL_V3(vl[x][0], vl[x][1], vl[x][2]));
		}
	}

	addListFaces(l, l2, fl, uvl) {
		for(let x = 0; x < fl.length; x++) {
			l.push($WGL_F3(fl[x][0], fl[x][1],fl[x][2]))
			l2.push([
				$WGL_V2(uvl[x][0][0], uvl[x][0][1]),
				$WGL_V2(uvl[x][1][0], uvl[x][1][1]),
				$WGL_V2(uvl[x][2][0], uvl[x][2][1]),
				])
		}
	}

	addCubeToGeometry(g, x1, x2, y1, y2, z1, z2, tu1, tu2, tv1, tv2) {
		let v = g.vertices;
		let f = g.faces;
		let uv = g.faceVertexUvs[0];
		let i = v.length;

		this.addListVertex(v, [
			[x2, y1, z1], [x1,y1,z1], [x1, y1, z2], [x2, y1, z2],
			[x2, y2, z1], [x1,y2,z1], [x1, y2, z2], [x2, y2, z2],
			]);
		this.addListFaces(f, uv,
			[
				[i, i+1, i+5], [i, i+5, i+4],
				[i+1, i+2, i+6], [i+1, i+6, i+5],
				[i+2, i+3, i+7], [i+2, i+7, i+6],
				[i+3, i, i+4], [i+3, i+4, i+7],
				[i, i+2, i+1], [i, i+3, i+2],
				[i+4, i+5, i+6], [i+4, i+6, i+7],
			],
			[ 
				[[tu1, tv1], [tu2, tv1], [tu2, tv2]], [[tu1, tv1], [tu2, tv2], [tu1, tv2]], 
				[[tu1, tv1], [tu2, tv1], [tu2, tv2]], [[tu1, tv1], [tu2, tv2], [tu1, tv2]], 
				[[tu1, tv1], [tu2, tv1], [tu2, tv2]], [[tu1, tv1], [tu2, tv2], [tu1, tv2]], 
				[[tu1, tv1], [tu2, tv1], [tu2, tv2]], [[tu1, tv1], [tu2, tv2], [tu1, tv2]], 
				[[tu1, tu1], [tu2, tu2], [tu2, tu1]], [[tu1, tu1], [tu1, tu2], [tu2, tu2]], 
				[[tu1, tu1], [tu2, tu1], [tu2, tu2]], [[tu1, tu1], [tu2, tu2], [tu1, tu2]], 
			]);
	}

	setGeometryUpdated(geometry_list, flat_normals) {
		for(let x = 0; x < geometry_list.length; x++) {
			geometry_list[x].verticesNeedUpdate = true;
			geometry_list[x].elementsNeedUpdate = true;
			geometry_list[x].uvsNeedUpdate = true;

			geometry_list[x].computeBoundingBox();
			geometry_list[x].computeBoundingSphere();
			if(flat_normals) {
				geometry_list[x].computeFaceNormals();
				geometry_list[x].computeFlatVertexNormals();
			}
			else {
				geometry_list[x].computeVertexNormals();
			}
		}

		this.draw_needed = true;
	}

	updateCubeFloorGeometry_height_float(g, w2, h, b, d2, tu1, tv1) {
		let v = g.vertices;
		let f = g.faces;
		let uv = g.faceVertexUvs[0];

		v.push($WGL_V3(	-w2, 	h, 		d2));
		v.push($WGL_V3(	w2, 	h, 		d2));
		v.push($WGL_V3(	w2, 	h, 		-d2));
		v.push($WGL_V3(	-w2, 	h, 		-d2));

		v.push($WGL_V3(	-w2-.10, 	h-.05, 	d2+.10));
		v.push($WGL_V3(	w2+.10, 	h-.05, 	d2+.10));
		v.push($WGL_V3(	w2+.10, 	h-.05, 	-d2-.10));
		v.push($WGL_V3(	-w2-.10, 	h-.05, 	-d2-.10));

		v.push($WGL_V3(	-w2-.10, 	b, 	d2+.10));
		v.push($WGL_V3(	w2+.10, 	b, 	d2+.10));
		v.push($WGL_V3(	w2+.10, 	b, 	-d2-.10));
		v.push($WGL_V3(	-w2-.10, 	b, 	-d2-.10));

		for(let i = 0; i < 8; i+=4) {
			let tv = .1;
			if(i > 0)
				tv = h-b;
			for(let x = 0; x < 4; x++) {
				let x1 = i + x;
				let x2 = i + (x+1)%4;
				let tf=.5;
				f.push($WGL_F3(x1, 4+x2,   x2));
				f.push($WGL_F3(x1, 4+x1, 4+x2));
				uv.push([$WGL_V2(0,tv*tf), $WGL_V2(w2*tf*2,0), $WGL_V2(w2*tf*2,tv*tf)] )
				uv.push([$WGL_V2(0,tv*tf), $WGL_V2(0,0), $WGL_V2(w2*tf*2,0)] )
			}
		}
		f.push($WGL_F3(8, 10, 9));
		uv.push([$WGL_V2(0,0), $WGL_V2(tu1, tv1), $WGL_V2(0,tv1)])
		f.push($WGL_F3(8, 11, 10));
		uv.push([$WGL_V2(0,0), $WGL_V2(tu1, 0), $WGL_V2(tu1,tv1)])
	}

	updateCubeFloorGeometry_height_platform(g, w2, h, b, d2, tu1, tv1) {
		this.updateCubeFloorGeometry_height_float(g, w2, h, b, d2, tu1, tv1);

		// Add 4 columns to the geometry
		let col_x = w2*.89;
		let col_w = w2*.1;
		let col_z = d2*.89;
		let col_d = d2*.1;
		this.addCubeToGeometry(g, -col_x-col_w, -col_x+col_w, 0, h-.1, -col_z-col_d, -col_z+col_d, 0, col_w, 0, h*.5);
		this.addCubeToGeometry(g, -col_x-col_w, -col_x+col_w, 0, h-.1, col_z-col_d, col_z+col_d, 0, col_w, 0, h*.5);
		this.addCubeToGeometry(g, col_x-col_w, col_x+col_w, 0, h-.1, -col_z-col_d, -col_z+col_d, 0, col_w, 0, h*.5);
		this.addCubeToGeometry(g, col_x-col_w, col_x+col_w, 0, h-.1, col_z-col_d, col_z+col_d, 0, col_w, 0, h*.5);
	}

	updateCubeFloorGeometry(id, sceneid) {
		let meshgroup = this.findMesh("base", id, this.scene[sceneid]);
		let m = this.findMeshesOfGroup(meshgroup);
		let g = [m[0].geometry, m[1].geometry]
		let subtype = meshgroup.userData.e.subtype;
		let sx = meshgroup.userData.e.sx;
		let sz = meshgroup.userData.e.sz;
		let h = meshgroup.userData.e.sy;
		let tu1 = sx * meshgroup.userData.e.tsx;
		let tv1 = sz * meshgroup.userData.e.tsy;

		let w2 = sx/2.0;
		let d2 = sz/2.0;

		// The flat surface
		g[0].vertices = [];
		g[0].faces = []
		g[0].faceVertexUvs[0] = []
		let v1 = g[0].vertices;
		let f1 = g[0].faces;
		let uv1 = g[0].faceVertexUvs[0];

		v1.push($WGL_V3(-w2, h, d2));
		v1.push($WGL_V3(w2, h, d2));
		v1.push($WGL_V3(w2, h, -d2));
		v1.push($WGL_V3(-w2, h, -d2));

		f1.push($WGL_F3(0,1,2));
		uv1.push([$WGL_V2(0,tv1), $WGL_V2(tu1,tv1), $WGL_V2(tu1,0)])
		f1.push($WGL_F3(0,2,3));
		uv1.push([$WGL_V2(0,tv1), $WGL_V2(tu1,0), $WGL_V2(0,0)])

		// The elevation part
		g[1].vertices = [];
		g[1].faces = [];
		g[1].faceVertexUvs[0] = [];

		if(subtype == "n") {}
		else if(subtype == "f") {
			this.updateCubeFloorGeometry_height_float(g[1], w2, h, h-.1, d2, tu1, tv1);
		}
		else if(subtype == "p") {
			this.updateCubeFloorGeometry_height_platform(g[1], w2, h, h-.1, d2, tu1, tv1);
		}
		else
			this.updateCubeFloorGeometry_height_float(g[1], w2, h, 0, d2, tu1, tv1);

		// Mark vertex, faces, normals as updated and compute bounding boxes
		this.setGeometryUpdated(g, true);
	}

	updateCubeFloorTextures(id, sceneid) {
		let meshgroup = this.findMesh("base", id, this.scene[sceneid]);
		let m = this.findMeshesOfGroup(meshgroup);

		let color1 = meshgroup.userData.e.color1;
		let color2 = meshgroup.userData.e.color2;
		let t1name = meshgroup.userData.e.t1name;
		let t2name = meshgroup.userData.e.t2name;
		
		let texture1 = new THREE.TextureLoader().load( staticurl + "/static/textures/" + t1name + ".png", (t) => {this.processLoadedTexture(t)} );
		let texture2 = new THREE.TextureLoader().load( staticurl + "/static/textures/" + t2name + ".png", (t) => {this.processLoadedTexture(t)} );
		//let material1 = new THREE.MeshLambertMaterial({map: texture1})
		//let material2 = new THREE.MeshLambertMaterial({map: texture2})
		let material1 = new THREE.MeshStandardMaterial({map: texture1, bumpMap: texture1, metalness:.05, bumpScale:.2})
		let material2 = new THREE.MeshStandardMaterial({map: texture2, bumpMap: texture2, metalness:.05, bumpScale:.2})

		material1.color.r = (color1 >> 16) / 256;
		material1.color.g = ((color1 >> 8) & 0xFF) / 256;
		material1.color.b = (color1 & 0xFF) / 256;

		material2.color.r = (color2 >> 16) / 256;
		material2.color.g = ((color2 >> 8) & 0xFF) / 256;
		material2.color.b = (color2 & 0xFF) / 256;

		m[0].material = material1;
		m[1].material = material2;

		this.draw_needed = true;
	}

	addCubeFloor(id, sceneid, e) {
		let geometry1 = new THREE.Geometry();
		let geometry2 = new THREE.Geometry();
		let texture1 = new THREE.TextureLoader().load( staticurl + "/static/textures/" + e.t1name + ".png", (t) => {this.processLoadedTexture(t)} );
		let texture2 = new THREE.TextureLoader().load( staticurl + "/static/textures/" + e.t2name + ".png", (t) => {this.processLoadedTexture(t)} );
		//let material1 = new THREE.MeshLambertMaterial({map: texture1})
		//let material2 = new THREE.MeshLambertMaterial({map: texture2})
		let material1 = new THREE.MeshStandardMaterial({map: texture1, bumpMap: texture1, metalness:.05, bumpScale:.2})
		let material2 = new THREE.MeshStandardMaterial({map: texture2, bumpMap: texture2, metalness:.05, bumpScale:.2})

		material1.color.r = (e.color1 >> 16) / 256;
		material1.color.g = ((e.color1 >> 8) & 0xFF) / 256;
		material1.color.b = (e.color1 & 0xFF) / 256;
		material2.color.r = (e.color2 >> 16) / 256;
		material2.color.g = ((e.color2 >> 8) & 0xFF) / 256;
		material2.color.b = (e.color2 & 0xFF) / 256;

		let mesh1 = new THREE.Mesh( geometry1, material1 );
		mesh1.userData.submesh = 1;		
		let mesh2 = new THREE.Mesh( geometry2, material2 );
		mesh2.userData.submesh = 2;

		let group = new THREE.Group();

		group.add(mesh1);
		group.add(mesh2);

		mesh1.userData.id = id;
		mesh1.userData.type = "base";
		mesh1.userData.e = e
		mesh2.userData.id = id;
		mesh2.userData.type = "base";
		mesh2.userData.e = e
		group.userData.id = id;
		group.userData.type = "base";
		group.userData.e = e

		this.scene[sceneid].add(group);

		this.updateCubeFloorGeometry(id, sceneid);

		group.position.x = e.px;
		group.position.y = e.py;
		group.position.z = e.pz;
		group.rotation.x = e.rx;
		group.rotation.y = e.ry;
		group.rotation.z = e.rz;

		group.updateMatrixWorld();

		mesh1.receiveShadow = true;
		mesh2.receiveShadow = true;
		group.receiveShadow = true;
		mesh1.castShadow = true;
		mesh2.castShadow = true;

		return id;
	}

	updateDeviceCubeGeometry(meshgroup, base_sx, base_sy, base_sz) {
		let m = this.findMeshesOfGroup(meshgroup);
		let g = [m[0].geometry, m[1].geometry]
		
		let sx = meshgroup.userData.e.sx * base_sx;
		let sz = meshgroup.userData.e.sz * base_sz;
		let h = meshgroup.userData.e.sy * base_sy;

		// Set to 0
		g[0].vertices = [];
		g[0].faces = []
		g[0].faceVertexUvs[0] = []
		g[1].vertices = [];
		g[1].faces = []
		g[1].faceVertexUvs[0] = []
		let v1 = g[0].vertices;
		let f1 = g[0].faces;
		let uv1 = g[0].faceVertexUvs[0];
		let v2 = g[1].vertices;
		let f2 = g[1].faces;
		let uv2 = g[1].faceVertexUvs[0];

		v1.push($WGL_V3(-sx*.45, h, sz*.45)); 
		v1.push($WGL_V3(sx*.45, h, sz*.45)); 
		v1.push($WGL_V3(sx*.45, h, -sz*.45)); 
		v1.push($WGL_V3(-sx*.45, h, -sz*.45))
		f1.push($WGL_F3(0,1,2)); f1.push($WGL_F3(0,2,3))
		uv1.push([$WGL_V2(0,1), $WGL_V2(1,1), $WGL_V2(1,0)])
		uv1.push([$WGL_V2(0,1), $WGL_V2(1,0), $WGL_V2(0,0)])
		v1.push($WGL_V3(-sx*.45, 0, sz*.45))
		v1.push($WGL_V3(sx*.45, 0, sz*.45))
		v1.push($WGL_V3(sx*.45, 0, -sz*.45))
		v1.push($WGL_V3(-sx*.45, 0, -sz*.45))
		f1.push($WGL_F3(4,6,5)); f1.push($WGL_F3(4,7,6))
		uv1.push([$WGL_V2(0,1), $WGL_V2(1,0), $WGL_V2(1,1)])
		uv1.push([$WGL_V2(0,1), $WGL_V2(0,0), $WGL_V2(1,0)])

		v2.push($WGL_V3(-sx*.45, h, sz*.45)); 
		v2.push($WGL_V3(sx*.45, h, sz*.45)); 
		v2.push($WGL_V3(sx*.45, h, -sz*.45)); 
		v2.push($WGL_V3(-sx*.45, h, -sz*.45))
		v2.push($WGL_V3(-sx*.5, h, sz*.5)); 
		v2.push($WGL_V3(sx*.5, h, sz*.5)); 
		v2.push($WGL_V3(sx*.5, h, -sz*.5)); 
		v2.push($WGL_V3(-sx*.5, h, -sz*.5))
		v2.push($WGL_V3(-sx*.5, 0, sz*.5)); 
		v2.push($WGL_V3(sx*.5, 0, sz*.5)); 
		v2.push($WGL_V3(sx*.5, 0, -sz*.5)); 
		v2.push($WGL_V3(-sx*.5, 0, -sz*.5))
		v2.push($WGL_V3(-sx*.45, 0, sz*.45)); 
		v2.push($WGL_V3(sx*.45, 0, sz*.45)); 
		v2.push($WGL_V3(sx*.45, 0, -sz*.45)); 
		v2.push($WGL_V3(-sx*.45, 0, -sz*.45))
		for(let x = 0; x < 12; x+=4) {
			f2.push($WGL_F3(x+0,x+5,x+1)); f2.push($WGL_F3(x+0,x+4,x+5))
			f2.push($WGL_F3(x+1,x+6,x+2)); f2.push($WGL_F3(x+1,x+5,x+6))
			f2.push($WGL_F3(x+2,x+7,x+3)); f2.push($WGL_F3(x+2,x+6,x+7))
			f2.push($WGL_F3(x+3,x+4,x+0)); f2.push($WGL_F3(x+3,x+7,x+4))
			if(x == 4) {
				uv2.push([$WGL_V2(0,0), $WGL_V2(sx,h), $WGL_V2(sx,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,h), $WGL_V2(sx,h)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sz,h), $WGL_V2(sz,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,h), $WGL_V2(sz,h)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sx,h), $WGL_V2(sx,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,h), $WGL_V2(sx,h)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sz,h), $WGL_V2(sz,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,h), $WGL_V2(sz,h)])
			}
			else {
				uv2.push([$WGL_V2(0,0), $WGL_V2(sx,sz*.05), $WGL_V2(sx,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,sz*.05),  $WGL_V2(sx,sz*.05)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sz,sx*.05), $WGL_V2(sz,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,sx*.05),  $WGL_V2(sz,sx*.05)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sx,sz*.05), $WGL_V2(sx,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,sz*.05),  $WGL_V2(sx,sz*.05)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sz,sx*.05), $WGL_V2(sz,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,sx*.05),  $WGL_V2(sz,sx*.05)])
			}
		}
		// Mark vertex, faces, normals as updated and compute bounding boxes
		this.setGeometryUpdated(g, true);
	}


	updateDeviceLBGeometry(meshgroup, base_sx, base_sy, base_sz, back_factor_x, back_factor_y) {
		let m = this.findMeshesOfGroup(meshgroup);
		let g = [m[0].geometry, m[1].geometry]
		
		let sx = meshgroup.userData.e.sx * base_sx;
		let sz = meshgroup.userData.e.sz * base_sz;
		let h = meshgroup.userData.e.sy * base_sy;

		// Set to 0
		g[0].vertices = [];
		g[0].faces = []
		g[0].faceVertexUvs[0] = []
		g[1].vertices = [];
		g[1].faces = []
		g[1].faceVertexUvs[0] = []
		let v1 = g[0].vertices;
		let f1 = g[0].faces;
		let uv1 = g[0].faceVertexUvs[0];
		let v2 = g[1].vertices;
		let f2 = g[1].faces;
		let uv2 = g[1].faceVertexUvs[0];

		let fxt = (1-back_factor_x)*.5;
		v1.push($WGL_V3(-sx*.45, h, sz*.45)); 
		v1.push($WGL_V3(sx*.45, h, sz*.45)); 
		v1.push($WGL_V3(sx*.45*back_factor_x, h*back_factor_y, -sz*.45)); 
		v1.push($WGL_V3(-sx*.45*back_factor_x, h*back_factor_y, -sz*.45))
		f1.push($WGL_F3(0,1,2)); f1.push($WGL_F3(0,2,3))
		uv1.push([$WGL_V2(0,1), $WGL_V2(1,1), $WGL_V2(1-fxt,0)])
		uv1.push([$WGL_V2(0,1), $WGL_V2(1-fxt,0), $WGL_V2(fxt,0)])
		v1.push($WGL_V3(-sx*.45, 0, sz*.45))
		v1.push($WGL_V3(sx*.45, 0, sz*.45))
		v1.push($WGL_V3(sx*.45*back_factor_x, h*(1-back_factor_y), -sz*.45))
		v1.push($WGL_V3(-sx*.45*back_factor_x, h*(1-back_factor_y), -sz*.45))
		f1.push($WGL_F3(4,6,5)); f1.push($WGL_F3(4,7,6))
		uv1.push([$WGL_V2(0,1), $WGL_V2(1-fxt,0), $WGL_V2(1,1)])
		uv1.push([$WGL_V2(0,1), $WGL_V2(fxt,0), $WGL_V2(1-fxt,0)])

		v2.push($WGL_V3(-sx*.45, h, sz*.45)); 
		v2.push($WGL_V3(sx*.45, h, sz*.45)); 
		v2.push($WGL_V3(sx*.45*back_factor_x, h*back_factor_y, -sz*.45)); 
		v2.push($WGL_V3(-sx*.45*back_factor_x, h*back_factor_y, -sz*.45))
		v2.push($WGL_V3(-sx*.5, h, sz*.5)); 
		v2.push($WGL_V3(sx*.5, h, sz*.5)); 
		v2.push($WGL_V3(sx*.5*back_factor_x, h*back_factor_y, -sz*.5)); 
		v2.push($WGL_V3(-sx*.5*back_factor_x, h*back_factor_y, -sz*.5))
		v2.push($WGL_V3(-sx*.5, 0, sz*.5)); 
		v2.push($WGL_V3(sx*.5, 0, sz*.5)); 
		v2.push($WGL_V3(sx*.5*back_factor_x, h*(1-back_factor_y), -sz*.5)); 
		v2.push($WGL_V3(-sx*.5*back_factor_x, h*(1-back_factor_y), -sz*.5))
		v2.push($WGL_V3(-sx*.45, 0, sz*.45)); 
		v2.push($WGL_V3(sx*.45, 0, sz*.45)); 
		v2.push($WGL_V3(sx*.45*back_factor_x, h*(1-back_factor_y), -sz*.45)); 
		v2.push($WGL_V3(-sx*.45*back_factor_x, h*(1-back_factor_y), -sz*.45))
		for(let x = 0; x < 12; x+=4) {
			f2.push($WGL_F3(x+0,x+5,x+1)); f2.push($WGL_F3(x+0,x+4,x+5))
			f2.push($WGL_F3(x+1,x+6,x+2)); f2.push($WGL_F3(x+1,x+5,x+6))
			f2.push($WGL_F3(x+2,x+7,x+3)); f2.push($WGL_F3(x+2,x+6,x+7))
			f2.push($WGL_F3(x+3,x+4,x+0)); f2.push($WGL_F3(x+3,x+7,x+4))
			if(x == 4) {
				uv2.push([$WGL_V2(0,0), $WGL_V2(sx,h), $WGL_V2(sx,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,h), $WGL_V2(sx,h)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sz,h), $WGL_V2(sz,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,h), $WGL_V2(sz,h)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sx,h), $WGL_V2(sx,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,h), $WGL_V2(sx,h)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sz,h), $WGL_V2(sz,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,h), $WGL_V2(sz,h)])
			}
			else {
				uv2.push([$WGL_V2(0,0), $WGL_V2(sx,sz*.05), $WGL_V2(sx,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,sz*.05),  $WGL_V2(sx,sz*.05)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sz,sx*.05), $WGL_V2(sz,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,sx*.05),  $WGL_V2(sz,sx*.05)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sx,sz*.05), $WGL_V2(sx,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,sz*.05),  $WGL_V2(sx,sz*.05)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(sz,sx*.05), $WGL_V2(sz,0)])
				uv2.push([$WGL_V2(0,0), $WGL_V2(0,sx*.05),  $WGL_V2(sz,sx*.05)])
			}
		}
		// Mark vertex, faces, normals as updated and compute bounding boxes
		this.setGeometryUpdated(g, true);
	}

	updateStandardDeviceGeometry(meshgroup) {
		let template_geometry = GEOMETRY.DEVICE.UNKNOWN;
		if(meshgroup.userData.e.type in GEOMETRY.DEVICE)
			template_geometry = GEOMETRY.DEVICE[meshgroup.userData.e.type];

		let m = this.findMeshesOfGroup(meshgroup);
		let g = [m[0].geometry, m[1].geometry]

		g[1].vertices = [];
		g[1].faces = []
		g[1].faceVertexUvs[0] = []

		for(let g_index = 0; g_index < 2; g_index++) {
			g[g_index].vertices = [];
			g[g_index].faces = [];
			g[g_index].faceVertexUvs[0] = [];
			if(! (g_index in template_geometry.v))
				continue;
			let v = g[g_index].vertices
			let f = g[g_index].faces;
			let uv = g[g_index].faceVertexUvs[0];

			for(let i = 0; i < template_geometry.v[g_index].length; i++) {
				let tv = template_geometry.v[g_index][i];
				v.push($WGL_V3(
					tv[0] * meshgroup.userData.e.sx * template_geometry.base_scale[0],
					tv[1] * meshgroup.userData.e.sy * template_geometry.base_scale[1],
					tv[2] * meshgroup.userData.e.sz * template_geometry.base_scale[2]
					));
			}
			for(let i = 0; i < template_geometry.f[g_index].length; i++) {
				let tf = template_geometry.f[g_index][i];
				let tuv = template_geometry.uv[g_index][i];
				f.push($WGL_F3(tf[0], tf[1], tf[2]))
				uv.push([
					$WGL_V2(tuv[0][0], tuv[0][1]),
					$WGL_V2(tuv[1][0], tuv[1][1]),
					$WGL_V2(tuv[2][0], tuv[2][1]),
					])				
			}
		}
		this.setGeometryUpdated(g, template_geometry.flat_normals);
	}

	updateDeviceGeometry(id, sceneid) {
		let meshgroup = this.findMesh("device", id, this.scene[sceneid]);

		if(meshgroup.userData.e.type == "S")
			this.updateDeviceCubeGeometry(meshgroup, 1, .4, 1);
		else if(meshgroup.userData.e.type == "F")
			this.updateDeviceCubeGeometry(meshgroup, 1, 1.2, .6);
		else if(meshgroup.userData.e.type == "LB")
			this.updateDeviceLBGeometry(meshgroup, 1, .4, 1, .6, .8);
		else
			this.updateStandardDeviceGeometry(meshgroup);
	}

	updateDeviceColor(id, sceneid) {
		let meshgroup = this.findMesh("device", id, this.scene[sceneid]);
		let m = this.findMeshesOfGroup(meshgroup);

		let color = [meshgroup.userData.e.color1, meshgroup.userData.e.color2];

		
		for(let x = 0; x < 2; x++) {
			
			m[x].material.uniforms.mycolor.value.r = (color[x] >> 16) / 256;
			m[x].material.uniforms.mycolor.value.g = ((color[x] >> 8) & 0xFF) / 256;
			m[x].material.uniforms.mycolor.value.b = (color[x] & 0xFF) / 256;
		}
		
		this.draw_needed = true;
	}

	getDeviceTextureByType(type, index) {
		if(type in GEOMETRY.DEVICE)
			return GEOMETRY.DEVICE[type].texture[index];
		else if(type == "S")
			return "S_" + (index+1) + ".png";
		else if (type == "F")
			return "F_" + (index+1) + ".png";
		else if (type == "LB")
			return "LB_" + (index+1) + ".png";
		else
			return GEOMETRY.DEVICE["UNKNOWN"].texture[index];
	}

	addDevice(id, sceneid, e, alignToGrid) {
		let geometry1 = new THREE.Geometry();
		let geometry2 = new THREE.Geometry();
		let texture1 = new THREE.TextureLoader().load( staticurl + "/static/textures/" + this.getDeviceTextureByType(e.type, 0), (t) => {this.processLoadedTexture(t)} );
		let texture2 = new THREE.TextureLoader().load( staticurl + "/static/textures/" + this.getDeviceTextureByType(e.type, 1), (t) => {this.processLoadedTexture(t)} );		
		//let material1 = new THREE.MeshLambertMaterial({lightMap: texture1, lightMapIntensity:8})
		//let material2 = new THREE.MeshLambertMaterial({map: texture2})
		let material1 = WGL_createDeviceMaterial({map: texture1, mycolor: e.color1})
		let material2 = WGL_createDeviceMaterial({map: texture2, mycolor: e.color2})

		let mesh1 = new THREE.Mesh( geometry1, material1 );
		mesh1.userData.submesh = 1;
		let mesh2 = new THREE.Mesh( geometry2, material2 );
		mesh2.userData.submesh = 2;

		let group = new THREE.Group();

		group.add(mesh1);
		group.add(mesh2);

		mesh1.userData.id = id;
		mesh1.userData.type = "device";
		mesh1.userData.e = e
		mesh2.userData.id = id;
		mesh2.userData.type = "device";
		mesh2.userData.e = e
		group.userData.id = id;
		group.userData.type = "device";
		group.userData.e = e

		let basemesh = this.findMesh("base", e.base, this.scene[sceneid]);
		basemesh.add(group);

		this.updateDeviceGeometry(id, sceneid);
		this.updateDeviceColor(id, sceneid);

		this.moveMesh(sceneid, "device", id, e.px, basemesh.userData.e.sy, e.pz, null, alignToGrid);
		group.rotation.x = e.rx;
		group.rotation.y = e.ry;
		group.rotation.z = e.rz;
		group.updateMatrixWorld();

		mesh1.castShadow = true;
		mesh2.castShadow = true;

		// Name
		this.addDeviceName(group);	

		return id;
	}

	updateDeviceNameVisibility(group) {
		for(let x = 0; x < group.children.length; x++) {
			if (group.children[x].userData.submesh === "name") {
				group.children[x].visible = this.global_settings.show_device_name;
				break;
			}
		}
	}

	addDeviceName(group) {
		let name = group.userData.e.name;

		let m = null;
		let height = 0;
		for(let x = 0; x < group.children.length; x++) {
			if (group.children[x].userData.submesh === "name") {
				m = group.children[x];
			}
			else {
				if(group.children[x].geometry.boundingBox.max.y > height)
					height = group.children[x].geometry.boundingBox.max.y;
			}
		}
		if(m != null) {
			group.remove(m);
		}

		if(name == "")
			return;

		let g = this.createTextGeometry(name, .3, .01, "center")

		let material = this.namematerial;
		let mesh = new THREE.Mesh(g, material);
		mesh.userData.id = group.userData.id;
		mesh.userData.type = group.userData.type;
		mesh.userData.e = group.userData.e;
		mesh.userData.submesh = "name";

		mesh.position.x = 0;
		mesh.position.y = height+.5;
		mesh.position.z = 0;
		mesh.rotation.order = "YXZ";
		mesh.rotation.x = -Math.PI/4;
		mesh.rotation.y = 0;

		group.add(mesh);

		mesh.visible = this.global_settings.show_device_name;

		this.draw_needed = true;
	}

	updateLinkSegmentGeometryLine(g, x1, y1, z1, x2, y2, z2, radius) {
		g.vertices = [];
		g.faces = [];
		g.faceVertexUvs[0] = [];

		let dir_vector = new THREE.Vector3(x2-x1, y2-y1, z2-z1);
		let length = dir_vector.length();

		let vl = [];
		let fl = [];
		let uvl = [];
		let w2 = 2*Math.PI/8;
		for(let y = 0; y < 2; y++) 
			for(let x = 0; x < 8; x++) {
				vl.push([
						Math.sin(x*2*Math.PI/8)*radius, 
						Math.cos(x*2*Math.PI/8)*radius,
						y*length,
					]);
			}
		for(let x = 0; x < 8; x++) {
			let x2 = (x+1)%8;
			fl.push([ x, x+8, x2+8]);
			fl.push([ x, x2+8, x2]);
			uvl.push([ [0,0], [0,length], [w2,length] ]);
			uvl.push([ [0,0], [w2,length], [w2,0] ]);
		}
		this.addListVertex(g.vertices, vl);
		this.addListFaces(g.faces, g.faceVertexUvs[0], fl, uvl);

		g.lookAt(dir_vector);

		this.setGeometryUpdated([g], false);
	}

	addLinkSegment(id, e, meshgroup, x1, y1, z1, x2, y2, z2, material, index) {
		let g = new THREE.Geometry();
		this.updateLinkSegmentGeometryLine(g, x1, y1, z1, x2, y2, z2, e.linedata.weight);
		let m = new THREE.Mesh(g, material);
		m.position.x = x1; m.position.y = y1; m.position.z = z1;

		m.userData.id = id;
		m.userData.type = "link";
		m.userData.subtype = "segment";
		m.userData.index = index;
		m.userData.e = e
		m.castShadow = true;
		meshgroup.add(m);
	}

	addLinkJoint(id, e, meshgroup, x, y, z, material, index) {
		let g = new THREE.SphereGeometry(e.linedata.weight*1.0, 10,10);
		let m = new THREE.Mesh(g, material);
		m.position.x = x, m.position.y = y, m.position.z = z;
		m.userData.id = id;
		m.userData.type = "link";
		m.userData.subtype = "joint";
		m.userData.joint_index = index;
		m.userData.e = e
		meshgroup.add(m);		
	}

	updateLinkGeometry(meshgroup, sceneid) {
		meshgroup.children = [];
		
		let e = meshgroup.userData.e;
		let id = meshgroup.userData.id;

		let material = new THREE.MeshStandardMaterial({color: e.linedata.color});

		let dev1 = this.findMesh("device", e.devs[0].id, this.scene[sceneid]);
		let dev2 = this.findMesh("device", e.devs[1].id, this.scene[sceneid]);

		this.tempVector = dev1.getWorldPosition();
		let x1 = this.tempVector.x;
		let y1 = this.tempVector.y+e.linedata.height;
		let z1 = this.tempVector.z;
		let points = e.linedata.points;

		if(e.type == 0) {
			for(let x = 0; x < points.length; x++) {
				// Create intermediate link segmnets
				this.addLinkSegment(id, e, meshgroup, x1, y1, z1, points[x][0], points[x][1], points[x][2], material, x);

				// Create joint
				this.addLinkJoint(id, e, meshgroup, points[x][0], points[x][1], points[x][2], material, x);

				x1 = points[x][0]; y1 = points[x][1]; z1 = points[x][2];
			}

			dev2.getWorldPosition(this.tempVector);
			let x2 = this.tempVector.x;
			let y2 = this.tempVector.y+e.linedata.height;
			let z2 = this.tempVector.z;
			// Create last segment
			this.addLinkSegment(id, e, meshgroup, x1, y1, z1, x2, y2, z2, material, points.length);

		}
		else if (e.type == 1) {
			dev2.getWorldPosition(this.tempVector);
			let x2 = this.tempVector.x;
			let y2 = this.tempVector.y+e.linedata.height;
			let z2 = this.tempVector.z;

			for(let x = 0; x < 2; x++) {
				if ((e.order[x] == "X") && (x1 !== x2)) {
					this.addLinkSegment(id, e, meshgroup, x1, y1, z1, x2, y1, z1, material, 0);
					if ((x1 !== x2) || (y1 !== y2) || (z1 !== z2))
						this.addLinkJoint(id, e, meshgroup, x2, y1, z1, material, 0);
					x1 = x2;
				}
				else if ((e.order[x] == "Y") && (y1 !== y2)) {
					this.addLinkSegment(id, e, meshgroup, x1, y1, z1, x1, y2, z1, material, 0);
					if ((x1 !== x2) || (y1 !== y2) || (z1 !== z2))
						this.addLinkJoint(id, e, meshgroup, x1, y2, z1, material, 0);
					y1 = y2;
				}
				else if ((e.order[x] == "Z") && (z1 !== z2)) {
					this.addLinkSegment(id, e, meshgroup, x1, y1, z1, x1, y1, z2, material, 0);
					if ((x1 !== x2) || (y1 !== y2) || (z1 !== z2))
						this.addLinkJoint(id, e, meshgroup, x1, y1, z2, material, 0);
					z1 = z2;
				}
			}
			if ((x1 !== x2) || (y1 !== y2) || (z1 !== z2))
				this.addLinkSegment(id, e, meshgroup, x1, y1, z1, x2, y2, z2, material, 0);
		}
	}

	addLink(id, sceneid, e) {
		let meshgroup = new THREE.Group ();

		meshgroup.userData.id = id;
		meshgroup.userData.type = "link";
		meshgroup.userData.e = e

		this.updateLinkGeometry(meshgroup, sceneid);

		this.scene[sceneid].add(meshgroup);

		return meshgroup;
	}

	addJoint(link_id, joint_index, sceneid, px, py, pz) {
		let link = this.getMesh(sceneid, "link", link_id);
		link.userData.e.linedata.points.splice(joint_index, 0, [px, py, pz]);
        d.wgl.updateLinkGeometry(link, sceneid);
	}

	updateLine(mesh) {
		let e = mesh.userData.e;
		mesh.position.x = e.x1;
		mesh.position.y = e.y1;
		mesh.position.z = e.z1;
		this.updateLinkSegmentGeometryLine(mesh.geometry, e.x1, e.y1, e.z1, e.x2, e.y2, e.z2, e.radius);
	}

	updateLineColor(mesh) {
		if (mesh.material.color.getHex() != mesh.userData.e.color) {
			mesh.material.color.set(mesh.userData.e.color);
			mesh.material.needsUpdate = true;
		}
	}

	addLine(id, sceneid, e) {
		let material = new THREE.MeshStandardMaterial({color: e.color});
		let g = new THREE.Geometry();
		let mesh = new THREE.Mesh(g, material);
		mesh.userData.id = id;
		mesh.userData.type = "line";
		mesh.userData.e = e;
		this.updateLine(mesh);

		this.scene[sceneid].add(mesh);

		return mesh;
	}

	emptyTextBuffer() {
		if(this.font === null)
			return;

		while(this.textBuffer.length > 0) {
			let textdata = this.textBuffer.pop();
			this[textdata[0]](textdata[1]);
		}
	}

	alignText(geometry, alignment) {
		geometry.computeBoundingBox();

		let b = geometry.boundingBox;
		if(alignment === "center")
			geometry.translate(
				-b.min.x - (b.max.x-b.min.x)/2,
				-b.min.y,
				-b.min.z - (b.max.z-b.min.z)/2
			);
		else if (alignment === "left")
			geometry.translate(
				-b.min.x,
				-b.min.y,
				-b.min.z - (b.max.z-b.min.z)/2
			);
		else if (alignment === "right")
			geometry.translate(
				-b.max.x,
				-b.min.y,
				-b.min.z - (b.max.z-b.min.z)/2
			);

		this.draw_needed = true;
	}

	createTextGeometry(text, height, depth, alignment) {
		let g = new THREE.TextGeometry(text, {
			font: this.font,
			size: height,
			height: depth,
			curveSegments: 6,
			bevelEnabled: false,
		});
		this.alignText(g, alignment);

		return g;
	}

	addText(id, sceneid, e, alignToGrid) {
		let base = this.findMesh("base", e.base, this.scene[sceneid]);
		let g = this.createTextGeometry(e.text, e.height, e.depth, "center")

		let material = new THREE.MeshStandardMaterial({color: e.color});
		let mesh = new THREE.Mesh(g, material);
		mesh.userData.id = id;
		mesh.userData.type = "text";
		mesh.userData.e = e;

		base.add(mesh);

		this.moveMesh(sceneid, "text", id, e.px, e.py + base.userData.e.sy, e.pz, null, alignToGrid);
		/*mesh.position.x = e.px;
		mesh.position.y = e.py + base.userData.e.sy;
		mesh.position.z = e.pz; */
		mesh.rotation.order = "YXZ";
		mesh.rotation.x = e.rx;
		mesh.rotation.y = e.ry;

		mesh.castShadow = true;
		this.draw_needed = true;

		return mesh;
	}


	updateSymbolGeometryFlag(meshgroup) {
		let e = meshgroup.userData.e;

		let g1 = new THREE.Geometry();
		let g2 = new THREE.Geometry();

		let m1 = new THREE.MeshPhongMaterial({color: e.color});
		let m2 = new THREE.MeshPhongMaterial({color: e.cd.flagcolor});

		let WB = .2, WT = .07, HM = .1, H = 1, HP = 1.2, WF = 1, DF = .05, HF = .5;
		let fvuv = []
		for(let x = 0; x < 26; x++)
			fvuv.push([[0,0],[0,0],[0,0]]);
		this.addListVertex(g1.vertices, [
			[0,0,WB], [WB,0,0], [0,0,-WB], [-WB,0,0],
			[0,HM,WT], [WT,HM,0], [0,HM,-WT], [-WT,HM,0],
			[0,H,WT], [WT,H,0], [0,H,-WT], [-WT,H,0],
			[0,HP,0]
		]);
		this.addListFaces(g1.faces, g1.faceVertexUvs[0], [
			[0,2,1], [0,3,2],
			[0,1,5], [0,5,4], [1,2,6],[1,6,5], [2,3,7],[2,7,6], [3,0,4],[3,4,7],
			[4,5,9], [4,9,8], [5,6,10],[5,10,9], [6,7,11],[6,11,10], [7,4,8],[7,8,11],
			[8,9,12], [9,10,12],[10,11,12], [11,8,12],
		], fvuv);

		let mesh1 = new THREE.Mesh(g1, m1);
		meshgroup.add(mesh1);

		this.addListVertex(g2.vertices, [
			[WT,H,DF], [WF, H, DF], [WF, HF, DF], [WT, HF, DF],
			[WT,H,-DF], [WF, H, -DF], [WF, HF, -DF], [WT, HF, -DF],
			])
		this.addListFaces(g2.faces, g2.faceVertexUvs[0], [
			[0,2,1], [0,3,2],
			[4,5,6], [4,6,7],
			[0,1,5], [0,5,4], [1,2,6],[1,6,5], [2,3,7],[2,7,6], [3,0,4],[3,4,7],
		], fvuv);

		let mesh2 = new THREE.Mesh(g2, m2);
		meshgroup.add(mesh2);

		mesh1.userData.id = meshgroup.userData.id;
		mesh1.userData.type = meshgroup.userData.type;
		mesh1.userData.e = meshgroup.userData.e
		mesh2.userData.id = meshgroup.userData.id;
		mesh2.userData.type = meshgroup.userData.type;
		mesh2.userData.e = meshgroup.userData.e

		mesh1.castShadow = true;
		mesh2.castShadow = true;

		this.setGeometryUpdated([g1, g2], true);
	}

	getDummyFVUVs(faces) {
		let fvuvs = []
		for(let x = 0; x < faces.length; x++)
			fvuvs.push([[0,0],[0,0],[0,0]]);

		return fvuvs;
	}

	getDataSymbolFlag(meshgroup) {
		let data = [{color: meshgroup.userData.e.color}, {color: meshgroup.userData.e.cd.flagcolor}]

		let WB = .2, WT = .07, HM = .1, H = 1, HP = 1.2, WF = 1, DF = .05, HF = .5;

		data[0].vertices = [
			[0,0,WB], [WB,0,0], [0,0,-WB], [-WB,0,0],
			[0,HM,WT], [WT,HM,0], [0,HM,-WT], [-WT,HM,0],
			[0,H,WT], [WT,H,0], [0,H,-WT], [-WT,H,0],
			[0,HP,0]
		];

		data[0].faces = [
			[0,2,1], [0,3,2],
			[0,1,5], [0,5,4], [1,2,6],[1,6,5], [2,3,7],[2,7,6], [3,0,4],[3,4,7],
			[4,5,9], [4,9,8], [5,6,10],[5,10,9], [6,7,11],[6,11,10], [7,4,8],[7,8,11],
			[8,9,12], [9,10,12],[10,11,12], [11,8,12],
		];

		data[0].fvuvs = this.getDummyFVUVs(data[0].faces);

		data[1].vertices = [
			[WT,H,DF], [WF, H, DF], [WF, HF, DF], [WT, HF, DF],
			[WT,H,-DF], [WF, H, -DF], [WF, HF, -DF], [WT, HF, -DF],
			]
		
		data[1].faces = [
			[0,2,1], [0,3,2],
			[4,5,6], [4,6,7],
			[0,1,5], [0,5,4], [1,2,6],[1,6,5], [2,3,7],[2,7,6], [3,0,4],[3,4,7],
		];

		data[1].fvuvs = this.getDummyFVUVs(data[1].faces);

		return data;
	}

	getDataSymbolX(meshgroup) {
		let data = [{color: meshgroup.userData.e.color}];
		data[0].vertices = [ 
			[-.5,.9,.1],  [-.4,1,.1],  [.4,1,.1],  [.5,.9,.1],  [.5,.1,.1],  [.4,0,.1],  [-.4,0,.1],  [-.5,.1,.1],
			[-.5,.9,-.1], [-.4,1,-.1], [.4,1,-.1], [.5,.9,-.1], [.5,.1,-.1], [.4,0,-.1], [-.4,0,-.1], [-.5,.1,-.1],
		]
		data[0].faces = [
			[0,4,1], [0,5,4], [2,6,3], [2,7,6],
			[8,9,12], [8,12,13], [10,11,14], [10,14,15],
			[0,9,8], [0,1,9], [1,4,12], [1,12,9], [4,5,13], [4,13,12], [5,0,8], [5,8,13],
			[2,11,10], [2,3,11], [3,6,14], [3,14,11], [6,7,15], [6,15,14], [7,2,10], [7,10,15]
		];
		data[0].fvuvs = this.getDummyFVUVs(data[0].faces);

		return data;
	}

	getDataSymbolV(meshgroup) {
		let data = [{color: meshgroup.userData.e.color}];
		data[0].vertices = [ 
			[-.5,.6,.1],  [-.3,.6,.1],  [.3,1,.1],  [.5,1,.1],  [.1,0,.1],  [-.1,0,.1],  [.1,0,.1],  [-.1,0,.1],
			[-.5,.6,-.1], [-.3,.6,-.1], [.3,1,-.1], [.5,1,-.1], [.1,0,-.1], [-.1,0,-.1], [.1,0,-.1], [-.1,0,-.1],
		]
		data[0].faces = [
			[0,4,1], [0,5,4], [2,6,3], [2,7,6],
			[8,9,12], [8,12,13], [10,11,14], [10,14,15],
			[0,9,8], [0,1,9], [1,4,12], [1,12,9], [4,5,13], [4,13,12], [5,0,8], [5,8,13],
			[2,11,10], [2,3,11], [3,6,14], [3,14,11], [6,7,15], [6,15,14], [7,2,10], [7,10,15]
		];
		data[0].fvuvs = this.getDummyFVUVs(data[0].faces);

		return data;
	}

	updateSymbolGeometry(meshgroup) {
		meshgroup.children = [];
		let data = null;

		if (meshgroup.userData.e.type === "F")
			data = this.getDataSymbolFlag(meshgroup);
		else if (meshgroup.userData.e.type === "X")
			data = this.getDataSymbolX(meshgroup);
		else if (meshgroup.userData.e.type === "V")
			data = this.getDataSymbolV(meshgroup);
		else
			data = this.getDataSymbolX(meshgroup);

		for(let data_i = 0; data_i < data.length; data_i++) {
			for(let v_i = 0; v_i < data[data_i].vertices.length; v_i++) {
				data[data_i].vertices[v_i][0] = data[data_i].vertices[v_i][0] * meshgroup.userData.e.sx;
				data[data_i].vertices[v_i][1] = data[data_i].vertices[v_i][1] * meshgroup.userData.e.sy;
				data[data_i].vertices[v_i][2] = data[data_i].vertices[v_i][2] * meshgroup.userData.e.sz;
			}
		}
		for(let x = 0; x < data.length; x++) {
			let geometry = new THREE.Geometry();
			let material = new THREE.MeshPhongMaterial({color: data[x].color});
			this.addListVertex(geometry.vertices, data[x].vertices);
			this.addListFaces(geometry.faces, geometry.faceVertexUvs[0], data[x].faces, data[x].fvuvs);

			geometry.verticesNeedUpdate = true;
			geometry.elementsNeedUpdate = true;
			geometry.uvsNeedUpdate = true;

			geometry.computeBoundingBox();
			geometry.computeBoundingSphere();
			geometry.computeVertexNormals();
			geometry.computeFlatVertexNormals();

			let mesh = new THREE.Mesh(geometry, material);
			meshgroup.add(mesh);

			mesh.userData.id = meshgroup.userData.id;
			mesh.userData.type = meshgroup.userData.type;
			mesh.userData.e = meshgroup.userData.e

			mesh.castShadow = true;
		}

		this.draw_needed = true;
	}

	addSymbol(id, sceneid, e, alignToGrid) {
		let base = this.findMesh("base", e.base, this.scene[sceneid]);
		let meshgroup = new THREE.Group ();

		meshgroup.userData.id = id;
		meshgroup.userData.type = "symbol";
		meshgroup.userData.e = e

		this.updateSymbolGeometry(meshgroup);

		base.add(meshgroup);

		this.moveMesh(sceneid, "symbol", id, e.px, base.userData.e.sy, e.pz, null, alignToGrid);

		meshgroup.rotation.x = e.rx;
		meshgroup.rotation.y = e.ry;
		meshgroup.rotation.z = e.rz;
		//meshgroup.scale.x = e.sx;
		//meshgroup.scale.y = e.sy;
		//meshgroup.scale.z = e.sz;

		return meshgroup;
	}
}

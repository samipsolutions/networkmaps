let g = require("./geometries")

let elements_to_do = {
	"2": {
		"R": {name: "Router", id: "0"},	
		"S": {name: "Switch", id: "1"},	
		"ML": {name: "ML Dev", id: "2"},	
		"LB": {name: "Load B", id: "3"},	
		"_NC": {name: "Cloud", id: "4"},	
		"_NA": {name: "ATM", id: "5"},	
		"_NM": {name: "ML Sw", id: "6"},	
		"_NT": {name: "T.Server", id: "7"},	
		"_NW": {name: "Wireless", id: "8"},	
		"_NW2": {name: "Wireless", id: "9"},	
		"_NME": {name: "MPLS PE", id: "10"},	
		"_NMP": {name: "MPLS P", id: "11"},	
		"_NVX": {name: "VxLAN", id: "12"},	
		"_NVS": {name: "V.Switch", id: "13"},	
		"_NVR": {name: "V.Router", id: "14"},	
		"_NVP": {name: "IP PBX", id: "15"},	
		"_NVG": {name: "VoIP G.", id: "16"},	
	},
	"3": {
		"_CU": {id: "0", name: "User"},
		"_CD": {id: "1", name: "Desktop"},
		"_CL": {id: "2", name: "Laptop"},
		"_CT": {id: "3", name: "Tablet"},
		"_CP": {id: "4", name: "Phone"},
		"_CP2": {id: "5", name: "Phone"},
		"_CPT": {id: "6", name: "Printer"},
		"_CBH": {id: "7", name: "Home"},
		"_CBO": {id: "8", name: "Office"},
		"_CBQ": {id: "9", name: "HQ"},
		"_CTC": {id: "10", name: "Car"},
		"_COM": {id: "11", name: "Mac"},
		"_COW": {id: "12", name: "Windows"},
		"_COL": {id: "13", name: "Linux"},
	},
	"4": {
		"SR" : {id: "0", name: "Server"},
		"ST" : {id: "1", name: "Storage"},
		"_SDB" : {id: "2", name: "DB"},
		"_SW" : {id: "3", name: "Web"},
		"_SM" : {id: "4", name: "Mail"},
		"_SD" : {id: "5", name: "DNS"},
		"_SL" : {id: "6", name: "Log"},
		"_SC" : {id: "7", name: "MemDB"},
		"_SA" : {id: "8", name: "LDAP"},
		"_SR" : {id: "9", name: "Robot"},
		"_SMM" : {id: "10", name: "Monitor"},
		"_SVG" : {id: "11", name: "V.Guest"},
		"_SVH" : {id: "12", name: "V.Host"},
		"_SN" : {id: "13", name: "GPU"},
		"_SOW" : {id: "14", name: "Windows"},
		"_SOL" : {id: "15", name: "Linux"},
		"_SOM" : {id: "16", name: "Mac"},
	},
	"5": {
		"F" : {id: "0", name: "Firewall"},
		"_XF" : {id: "1", name: "Firewall"},
		"_XP" : {id: "2", name: "Proxy"},
		"_XI" : {id: "3", name: "IPSec"},
		"_XS" : {id: "4", name: "ssl vpn"},
		"_XC" : {id: "5", name: "Cert"},
		"_XT" : {id: "6", name: "Treat"},
		"_XTP" : {id: "7", name: "TreatP"},
		"_XB" : {id: "8", name: "Bug"},
		"_XV" : {id: "9", name: "Virus"},
		"_XAV" : {id: "10", name: "A.Virus"},
		"_XAS" : {id: "11", name: "A.Spam"},
		"_XWF" : {id: "12", name: "Web F"},
		"_XPL" : {id: "13", name: "Led"},
		"_XL" : {id: "14", name: "Lock"},
		"_XH" : {id: "15", name: "Hacker"},
	}
};

let result = {};
for(let group_id in elements_to_do) {
	result[group_id] = {};
	for(let k in elements_to_do[group_id]) {
		console.log(k);
		let id = elements_to_do[group_id][k].id;
		let name = elements_to_do[group_id][k].name;
		let original = g.geometry.DEVICE[k];

		let element = {
			"name": name,
			"description": "",
			"comment": "Legacy " + k,
			"base_scale": original.base_scale,
			"shapes": [],
		};
		if("v" in original) for(let x = 0; x < original.v.length; x++) {
			let shape = {
				"flat_normals": original.flat_normals,
				"texture": original.texture[x],
				"color": original.color[x],
				"is_texture_light": true,
				"elements": [
					{
						"type": "vertex_list",
						"v": original.v[x],
						"f": original.f[x],
						"uv": original.uv[x],
					}
				],
			}

			element.shapes.push(shape);
		}
		result[group_id][id] = element;
	}
}

for(let key in result) {
	let data = JSON.stringify(result[key]);
	let filename = "definition_" + key + ".json";
	fs.writeFile(filename, data, (err) => { if(err) console.log(err)});
}
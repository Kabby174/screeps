const { UNITS, ACTIONS } = require('constants');
const UnitManager = require('units.manager');
const ActionManager = require('action.manager');
const {
	isTowerDamagedStructure,
} = require("utils");
const Squad = require('squad');
const MemoryLists = require('memory.lists');

const calcDist = (posA, posB) => {
	return Math.sqrt(Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2));
}

const fillSquad = spawn => {
	const roomName = spawn.room.name;
	const roomKey = {
		roomName,
		level: MemoryLists.LEVEL.ROOM,
	};
	const squads = Object.assign({},
		// MemoryLists.get({
		// 	level: MemoryLists.LEVEL.EMPIRE,
		// }),
		MemoryLists.get(roomKey)
	);
	// console.log("My Squads", Object.keys(squads.WORKFORCE));
	// console.log("Squads", Object.keys(squads));

	let squadList,
		mySquad,
		missingUnits,
		unit,
		largestUnit,
		creepName,
		role;

	const energyCap = spawn.room.energyCapacityAvailable;
	let maxEnergy;
	for(const key in squads){
		squadList = squads[key];
		for(const party in squadList){
			// console.log("Party",party);
			mySquad = Squad.getParty(squadList[party]);
			missingUnits = mySquad.getMissingUnits();
			for(const index in missingUnits){
				role = missingUnits[index];
				unit = UnitManager.getUnit(role);
				// console.log(Object.keys(mySquad.squad).length);
				maxEnergy = Object.keys(mySquad.squad).length < 2 ? 300 : energyCap;
				const { largestUnit, cost } = UnitManager.getLargestUnit({
					energyCap: maxEnergy,
					// energyCap,
					parts: unit.parts,
				});
				// console.log("Use: "+spawn.room.name, cost,maxEnergy);
				// if(roomName == "W7N3" && role == "PALADIN"){
				// 	console.log("Build a Paladin", roomName, largestUnit.length, unit.minParts, cost+"/"+spawn.room.energyAvailable);
				// }
				// console.log("Parts", largestUnit.length, unit.minParts);
				if(largestUnit.length < unit.minParts){
					// if(roomName == "W7N3" && role == "PALADIN"){
					// 	console.log("Parts");
					// }
					continue;
				}
				if(cost <= maxEnergy){
					// if(roomName == "W7N3" && role == "PALADIN"){
					// 	console.log("Build it");
					// }
					creepName = UnitManager.buildUnit({
						role,
						home: roomName,
						parts: largestUnit,
					});
					if(creepName){
						mySquad.addCreep({
							name: creepName,
							role
						});
						return;
					}
				}
			}
		}
	}
}
const addStorage = spawn => {
	const { x, y } = spawn.pos;
	const minDist = 2;
	const maxDist = 5;

	// for(var ii = minDist; ii < maxDist; ++ii){

	// 	for(var xx = -1; xx <= 1; xx++){
	// 		spawn.room.createConstructionSite(x + ii, y + xx, STRUCTURE_CONTAINER);
	// 		// spawn.room.createFlag(x + ii, y + xx, x + ii+","+y + xx);
	// 	}
	// }

	const contPos = spawn.room.controller.pos;
	const contDist = 2;
	const area = spawn.room.lookAtArea(contPos.y - contDist, contPos.x - contDist, contPos.y + contDist, contPos.x + contDist, true);
	let found = false;

	// area.forEach( object => {
	// 	const xDist = Math.abs(object.x - x);
	// 	const yDist = Math.abs(object.y - y);

	// 	if(!found && object.type == "terrain" && object.terrain == "plain" && xDist > 1 && yDist > 1){
	// 		// spawn.room.createFlag(object.x, object.y, "["+spawn.room.name+":"+(object.x+object.y)+"]");
	// 		spawn.room.createConstructionSite(object.x, object.y, STRUCTURE_STORAGE);
	// 		found = true;
	// 	}
	// });
}
const addExtensions = spawn => {
	return;
	const extensionCount = spawn.room.find(FIND_STRUCTURES, {
		filter: structure => {
			return structure.structureType == STRUCTURE_EXTENSION;
		}
	}).length + spawn.room.find(FIND_CONSTRUCTION_SITES, {
		filter: structure => {
			return structure.structureType == STRUCTURE_EXTENSION;
		}
	}).length;
	const extensionMax = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][ spawn.room.controller.level ];

	if(extensionCount >= extensionMax){
		return;
	}

	const { x, y } = spawn.pos;
	const maxDist = 5;//spawn.room.controller.level - 1;

	// console.log([extensionCount],"of",extensionMax);
	// const colors = [COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_PURPLE];
	const area = spawn.room.lookAtArea(y - maxDist, x - maxDist, y + maxDist, x + maxDist, true);
	let xDist;
	let yDist;
	for(let ii = 1; ii <= maxDist; ++ii){
		if(ii % 2 == 0){
			continue;
		}
		area.forEach( object => {
			xDist = Math.abs(object.x - x);
			yDist = Math.abs(object.y - y);
			if(xDist + yDist < 2){
				return;
			}

			if(xDist + yDist == ii){
				// console.log( ii, Math.pow(xDist, 2) + Math.pow(yDist, 2) );
				// spawn.room.createFlag(object.x, object.y, object.x+","+object.y, colors[ii - 1]);
				spawn.room.createConstructionSite(object.x, object.y, STRUCTURE_EXTENSION);
				return;
			}
		});
	}

	// for(var name in Game.flags){
	// 	Game.flags[name].remove();
	// }

	/*
	const constructionSites = Game.constructionSites;
	var object;
	for(var name in constructionSites){
		object = constructionSites[ name ];
		// if(!object.room){
			object.remove()
		}
	}//*/
}
const manageTowers = spawn => {
	const towers = spawn.room.find(FIND_STRUCTURES, {
		filter: structure => {
			return structure.structureType == STRUCTURE_TOWER;
		}
	});

	if(towers.length > 0){
		const target = spawn.room.find(FIND_HOSTILE_CREEPS)[0];
		const friendly = spawn.room.find(FIND_MY_CREEPS, {
			filter: creep => {
				return creep.hits < creep.hitsMax;
			}
		})[0];
		const damagedStructure = spawn.room.find(FIND_STRUCTURES, {
			filter: isTowerDamagedStructure
		})[0];

		// console.log("New Target", target);
		if(!target && !friendly && !damagedStructure){
			return;
		}
		let myTower;
		for(const index in towers){
			myTower = towers[index];
			if(myTower.energy == 0){
				continue;
			}

			if(target){
				myTower.attack(target);
			}else if(friendly){
				myTower.heal(friendly);
			}else if(damagedStructure){
				myTower.repair(damagedStructure);
			}else{
				return;
			}
		}
	}
}

module.exports = {
	run: spawn => {
		Memory.spawns = Memory.spawns || {};
		if(!Memory.spawns[ spawn.name ]){
			Memory.spawns[ spawn.name ] = {};
		}

		// spawnUnits( spawn );
		fillSquad( spawn );

		// addExtensions( spawn );
		// addStorage( spawn );
		manageTowers( spawn );
	}
};

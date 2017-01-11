const { UNITS, ACTIONS } = require('constants');
const UnitManager = require('units.manager');
const ActionManager = require('action.manager');
const {
	isTowerDamagedStructure,
} = require("utils");

const calcMiners = spawn => {
	const mines = spawn.room.find(FIND_SOURCES);
	let spotCount = 0;
	mines.forEach( mine => {
		const {x,y} = mine.pos;
		const spots = spawn.room.lookAtArea(y - 1, x - 1, y + 1, x + 1, true);

		spots.forEach( object => {
			if(object.type == "terrain" && (object.terrain == "plain" || object.terrain == "swamp")){
				spotCount++;
			}
		});
	});
	return spotCount;
}
const calcDist = (posA, posB) => {
	return Math.sqrt(Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2));
}
const calcUnits = ({ role, unitCount, spawn}) => {
	// console.log();
	let count;
	switch(role){
		case UNITS.BUILDER:
			count = unitCount[ UNITS.RUNNER ] == 0 ? 2 : Math.max(Math.ceil(spawn.room.controller.level * .75), 2);
			// console.log(UNITS.BUILDER, unitCount[ role]+"/"+count);
			return count;
		default:
			return UnitManager.UNIT_TYPES[ role ].minUnits;
	}
}
const spawnUnits = spawn => {
	const roomName = spawn.room.name;
	let unitCount = {};
	let unitTypes = Object.assign({}, UnitManager.UNIT_TYPES);
	// let unitTypes;
	delete unitTypes[ UNITS.DEFAULT ];
	const buildOrder = [
		UNITS.DEFAULT,
		UNITS.MINER,
		UNITS.HARVESTER,
		UNITS.BUILDER,
		UNITS.RUNNER,
		UNITS.REPAIRMAN,
		UNITS.RAIDER,
		UNITS.SETTLER,
		// UNITS.REMOTE_MINER,
		UNITS.EXPLORER,
		// UNITS.REMOTE_BUILDER,
		UNITS.ORE_HARVESTER,
		UNITS.MERCHANT,
	];

	for(const role in unitTypes){
		unitCount[role] = 0;
	}

	Memory.spawns[ spawn.name ].miners = Memory.spawns[ spawn.name ].miners || calcMiners( spawn );
	let creep;
	let totalCreeps = 0;
	let actions;
	let props = {};
	for(const index in Game.creeps){
		creep = Game.creeps[ index ];
		const { name, memory: { role, home }, carry} = creep;

		//Only control your own units
		if(home != roomName || buildOrder.indexOf(role) < 0){
			continue;
		}

		//Count the unit
		if(role != UNITS.DEFAULT){
			unitCount[role]++;
		}
		totalCreeps++;

		//Assign Job
		actions = UnitManager.UNIT_TYPES[ creep.memory.role || UNITS.DEFAULT ].actions;
		props = {};
		switch(role){
			case UNITS.DEFAULT:
				actions = totalCreeps >= 6 ?
					[ACTIONS.MINING, ACTIONS.SCAVENGE, ACTIONS.WITHDRAW, ACTIONS.TRANSFER, ACTIONS.UPGRADE] :
					UnitManager.UNIT_TYPES[ UNITS.DEFAULT ].actions;
				break;
			// case UNITS.REMOTE_BUILDER:
				// if(unitCount[role] % 4 == 0){
				// 	actions = [ACTIONS.WITHDRAW, ACTIONS.SCAVENGE, ACTIONS.GOTO_WORKSITE, ACTIONS.REPAIR, ACTIONS.UPGRADE, ACTIONS.CALL_WORKER];
				// }
				// break;

			case UNITS.RUNNER:
				actions = unitCount[role] % 2 ?
					[ACTIONS.SCAVENGE, ACTIONS.TRANSFER, ACTIONS.STORE, ACTIONS.PASS] :
					[ACTIONS.SCAVENGE, ACTIONS.SEND_LINK, ACTIONS.STORE, ACTIONS.TRANSFER, ACTIONS.PASS];
				break;
			case UNITS.HARVESTER:
				actions = unitCount[role] % 2 ?
					[ACTIONS.WITHDRAW, ACTIONS.SCAVENGE, ACTIONS.UPGRADE] :
					[ACTIONS.WITHDRAW, ACTIONS.SCAVENGE, ACTIONS.TRANSFER, ACTIONS.UPGRADE];
				break;
		}

		//Dump other resources
		if(role != UNITS.ORE_HARVESTER){
			for(let resource in carry){
				if(resource != RESOURCE_ENERGY && carry[resource]){
					actions = [ACTIONS.STORE];
				}
			}
		}

		ActionManager.doTasks(creep, actions, props);
	}

	//Starting base
	if(totalCreeps < 4){
		UnitManager.buildUnit({
			role: UNITS.DEFAULT,
			home: roomName,
			unitCount: totalCreeps
		});
	}else{
		const checkMiner = UNITS.MINER;
		let minUnits = Math.max(1, Math.floor(UnitManager.UNIT_TYPES[ checkMiner ].minUnits / 2));
		// console.log();
		// console.log(spawn.name);
		if(unitCount[ checkMiner ] < minUnits){
			UnitManager.buildUnit({
				role: checkMiner,
				home: roomName,
				unitCount: unitCount[checkMiner],
				minUnits,
			});
			return;
		}

		const harvesters = spawn.room.find(FIND_STRUCTURES, {
			filter: structure => {
				return structure.structureType == STRUCTURE_EXTRACTOR;
			}
		})[0];

		let role;
		// console.log();
		// console.log("---",spawn.name+"["+spawn.room.name+"]","---");
		for(const index in buildOrder){
			role = buildOrder[index];
			switch(role){
				case UNITS.HARVESTER:
					minUnits = unitCount[ UNITS.BUILDER ] < unitCount[ role ] / 2 ?
						unitCount[ UNITS.BUILDER ] :
						Math.max(Math.ceil(spawn.room.controller.level * 2.5), 2);
					break;
				case UNITS.BUILDER:
					minUnits = calcUnits({
						role,
						spawn,
						unitCount
					});
					break;
				case UNITS.ORE_HARVESTER:
					minUnits = harvesters ? UnitManager.UNIT_TYPES[ role ].minUnits : 0;
					break;
				case UNITS.RAIDER:
					minUnits = 0;//totalCreeps > 20 ? UnitManager.UNIT_TYPES[ role ].minUnits : 0;
					break;
				case UNITS.MINER:
					minUnits = Memory.spawns[ spawn.name ].miners;
					break;
				case UNITS.RUNNER:
					minUnits = unitCount[ UNITS.MINER ] > 2 ? Math.floor( unitCount[ UNITS.MINER ] * 1 ) : 1;
					break;
				case UNITS.REMOTE_MINER:
					// minUnits = spawn.name == "RobotS" ? 1 : 0;
					minUnits = unitCount[ UNITS.HARVESTER ] >= 4 ? Memory.quarry[ roomName ].length : 0;
					break;
				case UNITS.MERCHANT:
					minUnits = Memory.terminals[ spawn.room.name ] && Memory.terminals[ spawn.room.name ].offer ? 1 : 0;
					break;
				default:
					minUnits = UnitManager.UNIT_TYPES[role].minUnits;
			}

			// console.log(role, unitCount[role]+"/"+minUnits);
			if(unitCount[role] < minUnits){
				if(UnitManager.buildUnit({
					role,
					home: roomName,
					unitCount: unitCount[role],
					minUnits,
				})){
					return;
				};
			}
		}
		// console.log("Available to fill work orders");
		let order;
		for(let index in Memory.workOrders){
			order = Memory.workOrders[index];

			//Someone already completed the work order
			if(order.unitCount >= order.minUnits){
				console.log("Work order["+order.role+"] already completed");
				continue;
			}

			//Fill the workorder
			if(UnitManager.buildUnit({
				role: order.role,
				home: roomName,
				unitCount: order.unitCount,
				minUnits: order.minUnits
			})){
				Memory.workOrders[index].unitCount++;
				return;
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
	// console.log();
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
const markQuarries = spawn => {
	const roomName = spawn.room.name;
	if(!Memory.quarry[ roomName ]){
		Memory.quarry[ roomName ] = [];

		const exits = Game.map.describeExits( roomName );

		console.log();
		let exitName;
		for(let direction in exits){
			exitName = exits[direction];
			if(Memory.quarry[ roomName ].indexOf(exitName) < 0){
				Memory.quarry[ roomName ].push( exitName );
			}
		}
	}
}
const findLinks = spawn => {
	const linksForLevel = CONTROLLER_STRUCTURES.link[spawn.room.controller.level];
	if(linksForLevel == 0){
		return;
	}

	const roomName = spawn.room.name;
	Memory.uplinks[ roomName ] = Memory.uplinks[ roomName ] || [];
	Memory.downlinks[ roomName ] = Memory.downlinks[ roomName ] || [];

	if(Memory.uplinks[ roomName ].length != 0 && Memory.downlinks[ roomName ].length != 0){
		return;
	}
	const unsorted = spawn.room.find(FIND_STRUCTURES, {
		filter: structure => {
			return structure.structureType == STRUCTURE_LINK;
				//  &&
				// Memory.uplinks[ roomName ].indexOf(structure.id) < 0 &&
				// Memory.downlinks[ roomName ].indexOf(structure.id) < 0;
		}
	});

	if(unsorted.length == 0){
		return;
	}

	// console.log();

	let closestLink; //Memory.downlinks[ roomName ][0];
	let link;
	let dist;
	let newUplinks = [];
	for(let index in unsorted){
		link = unsorted[index];
		dist = calcDist(spawn.pos, link.pos);
		if(!closestLink || closestLink.dist > dist){
			closestLink = {
				id: link.id,
				dist
			}
		}else{
			newUplinks.push( link.id );
		}
	}

	if(!Memory.downlinks[ roomName ][0] || Memory.downlinks[ roomName ][0] != closestLink.id){
		Memory.uplinks[ roomName ] = newUplinks;
		Memory.downlinks[ roomName ] = [ closestLink.id ];

		// console.log("Links",roomName,Memory.uplinks[ roomName ],"-", Memory.downlinks[ roomName ]);
	}
}
const sendLinks = spawn => {
	const uplinks = Memory.uplinks[ spawn.room.name ] || [];
	const downlinks = Memory.downlinks[ spawn.room.name ] || [];

	if(uplinks.length && downlinks.length){
		const down = spawn.room.find(FIND_STRUCTURES, {
			filter: structure => {
				return structure.structureType == STRUCTURE_LINK &&
					downlinks.indexOf(structure.id) >= 0 &&
					structure.energy < structure.energyCapacity;
			}
		})[0];

		if(down && down.energy == down.energyCapacity){
			return;
		}

		const linkList = spawn.room.find(FIND_STRUCTURES, {
			filter: structure => {
				return structure.structureType == STRUCTURE_LINK &&
					uplinks.indexOf(structure.id) >= 0 &&
					structure.energy != 0;
			}
		});

		if(linkList.length > 0 && down){
			let link;
			for(let index in linkList){
				link = linkList[index];
				switch(link.transferEnergy(down)){
					case ERR_FULL:
						return true;
				}
			}
		}
	}
}
const SpawnManager = {
	run: spawn => {
		Memory.spawns = Memory.spawns || {};
		if(!Memory.spawns[ spawn.name ]){
			Memory.spawns[ spawn.name ] = {};
		}

		spawnUnits( spawn );
		addExtensions( spawn );
		addStorage( spawn );
		manageTowers( spawn );
		markQuarries( spawn );

		findLinks( spawn );
		sendLinks( spawn );
	}
}
module.exports = SpawnManager;

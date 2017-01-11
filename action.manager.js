const { UNITS, ACTIONS } = require('constants');
const {
	isCreepDamagedStructure,
} = require("utils");
const calcDist = (posA, posB) => {
	return Math.sqrt(Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2));
}
const getHomeBase = creep => {
	return Game.spawns[ Object.keys(Game.spawns).find(obj => {
		return Game.spawns[obj].room.name == creep.memory.home;
	}) ];
}
const transferToStructure = (creep, link) => {
	if(creep.carry[ RESOURCE_ENERGY ] > 0 && link.energy < link.energyCapacity){
		switch(creep.transfer(link, RESOURCE_ENERGY)){
			case ERR_NOT_IN_RANGE:
				if(creep.moveTo(link) == ERR_NO_PATH){
					return false;
				}
			case OK:
				return true;
		}
	}
	// for(let resource in creep.carry){
	// 	if(!creep.carry[resource]){
	// 		continue;
	// 	}
	// 	console.log("Transfer",resource+"["+creep.carry[resource]+"]", structure);
	// 	console.log(structure.store, structure.storeCapacity);
		// if((structure.store[resource] || 0) < structure.storeCapacity){
		// 	switch(creep.transfer(structure, resource)){
		// 		case ERR_NOT_IN_RANGE:
		// 			if(creep.moveTo(structure) == ERR_NO_PATH){
		// 				return false;
		// 			}
		// 		case OK:
		// 			return true;
		// 	}
		// }
	// }
}
const TASKS = {
	[ACTIONS.SEND_LINK]: creep => {
		const uplinks = Memory.uplinks[ creep.room.name ] || [];
		if(uplinks.length && _.sum(creep.carry) > 0){
			const linkList = creep.room.find(FIND_STRUCTURES, {
				filter: structure => {
					return structure.structureType == STRUCTURE_LINK &&
						uplinks.indexOf(structure.id) >= 0 &&
						calcDist(structure.pos, creep.pos) < 10 &&
						structure.energy < structure.energyCapacity;
				}
			});
			if(linkList.length > 0){
				// console.log(creep.name,"transfer to", linkList[0].structureType);
				transferToStructure( creep, linkList[0] );
				return true;
			}
		}
	},
	[ACTIONS.GET_LINK]: creep => {
		const downlinks = Memory.downlinks[ creep.room.name ] || [];
		if(downlinks.length && _.sum(creep.carry) < creep.carryCapacity){
			const linkList = creep.room.find(FIND_STRUCTURES, {
				filter: structure => {
					return structure.structureType == STRUCTURE_LINK &&
						downlinks.indexOf(structure.id) >= 0 &&
						// calcDist(structure.pos, creep.pos) < 10 &&
						structure.energy != structure.energyCapacity;
				}
			});
			if(linkList.length > 0){
				// console.log(creep.name,"transfer to", linkList[0].structureType);
				// console.log("Withdraw from here");
				// transferToStructure( creep, linkList[0] );
				return true;
			}
		}
	},
	[ACTIONS.WITHDRAW]: creep => {
		if(!creep.memory.busy && creep.carry.energy == 0){
			const whiteList = [STRUCTURE_CONTAINER, STRUCTURE_STORAGE, STRUCTURE_LINK, STRUCTURE_TERMINAL];
			const targets = creep.room.find(FIND_STRUCTURES, {
				filter: structure => {
					if(structure.structureType == STRUCTURE_LINK){
						return Memory.downlinks[ creep.room.name ].indexOf(structure.id) >= 0;
					}else if(structure.structureType == STRUCTURE_TERMINAL){
						return Memory.terminals[ creep.room.name ].request;
					}
					return whiteList.indexOf(structure.structureType) >= 0;
				}
			});

			let withdrawTarget;
			if(targets.length){
				for(let index in targets){
					withdrawTarget = targets[index];
					switch(withdrawTarget.structureType){
						case STRUCTURE_LINK:
							if(withdrawTarget.energy > 0){
								switch(creep.withdraw(withdrawTarget, RESOURCE_ENERGY)){
									case ERR_NOT_IN_RANGE:
										creep.moveTo(withdrawTarget);
									case OK:
										return true;
								}
							}
							break;
						default:
							if(withdrawTarget.store[RESOURCE_ENERGY] > 0){
								switch(creep.withdraw(withdrawTarget, RESOURCE_ENERGY)){
									case ERR_NOT_IN_RANGE:
										creep.moveTo(withdrawTarget);
									case OK:
										return true;
								}
							}
					}
				}
			}
		}
	},
	[ACTIONS.SCAVENGE]: creep => {
		//Pickup resources on the ground
		if(!creep.memory.busy && _.sum(creep.carry) < (creep.carryCapacity * .75)){
			const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
			if(dropped){
				switch(creep.pickup(dropped)){
					case ERR_NOT_IN_RANGE:
						creep.moveTo(dropped);
					case OK:
						return true;
				}
			}
		}
	},
	[ACTIONS.HARVEST]: creep => {
		if(_.sum(creep.carry) < creep.carryCapacity){
			const node = creep.room.find(FIND_STRUCTURES,{
				filter: structure => {
					return structure.structureType == STRUCTURE_EXTRACTOR;
				}
			})[0];
			if(node){
				// const objects = creep.room.lookAt(node.pos);
				// console.log("Harvests",objects);
				// let mineral;
				// objects.forEach( object => {
				// 	console.log(object.type);
				// 	if(object.type == LOOK_MINERALS){
				// 		mineral = object;
				// 	}
				// })
				const minerals = creep.room.find(FIND_MINERALS);
				// const mineral = creep.room.find(creep.room.lookAt(node.pos),{
				// 	filter: structure => {
				// 		console.log("Check",Object.keys(structure));
				// 		return false;
				// 		// return structure.structureType == STRUCTURE_MINERAL;
				// 	}
				// });
				let currentMineral;
				for(let type in minerals){
					currentMineral = minerals[ type ];
					// console.log(creep.harvest(currentMineral), Object.keys(currentMineral));
					// console.log("Harvest", _.sum(creep.carry)+"/"+creep.carryCapacity, creep.harvest(currentMineral));
					switch(creep.harvest(currentMineral)){
						case ERR_NOT_IN_RANGE:
							creep.moveTo(currentMineral)
						case ERR_TIRED:
						case OK:
							return true;
					}
				}
				// console.log(minerals);
				// if(mineral){
				// 	console.log(creep.harvest(mineral), Object.keys(mineral));
				// 	switch(creep.harvest(mineral)){
				// 		case ERR_NOT_IN_RANGE:
				// 			creep.moveTo(mineral)
				// 		case OK:
				// 			return true;
				// 	}
				// }
			}
		}
	},
	[ACTIONS.MINING]: creep => {
		if(!creep.memory.busy && _.sum(creep.carry) < creep.carryCapacity){
			const numSources = Memory.rooms[ creep.room.name ].SOURCES;
			let node;
			if(numSources > 1){
				node = creep.pos.findClosestByRange(FIND_SOURCES, {
					filter: structure => {
						return creep.memory.blocked != structure.id;
					}
				});
			}else{
				node = creep.room.find(FIND_SOURCES)[0];
			}

			if(node){
				switch(creep.harvest(node)){
					case ERR_NOT_IN_RANGE:
						if(creep.moveTo(node) == ERR_NO_PATH && numSources > 1){
							creep.memory.blocked = node.id;
						}
					case OK:
						return true;
				}
			}else{
				// console.log("No available nodes");
				creep.memory.blocked = null;
			}
		}
	},
	[ACTIONS.DROP]: creep => {
		if(creep.carry.energy == 0){
			creep.memory.busy = false;
			return;
		}
		creep.drop(RESOURCE_ENERGY, creep.carry.energy);
	},
	[ACTIONS.TRANSFER]: creep => {
		creep.memory.busy = ACTIONS.TRANSFER;
		if(creep.carry.energy == 0){
			creep.memory.busy = false;
			return;
		}

		const whiteList = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER];
		// const targets = creep.room.find(FIND_STRUCTURES, {
		const transferTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
			filter: structure => {
				return whiteList.indexOf(structure.structureType) >= 0 &&
					structure.energy < structure.energyCapacity;
			}
		});
		if(transferTarget){
			switch(creep.transfer(transferTarget, RESOURCE_ENERGY)){
				case ERR_NOT_IN_RANGE:
					creep.moveTo(transferTarget);
				case OK:
					return true;
			}
		}
		// let transferTarget;
		// if(targets.length > 0){
		// 	for(var name in targets){
		// 		transferTarget = targets[name];
		// 		if(transferTarget.energy < transferTarget.energyCapacity){
		// 			switch(creep.transfer(transferTarget, RESOURCE_ENERGY)){
		// 				case ERR_NOT_IN_RANGE:
		// 					creep.moveTo(transferTarget);
		// 				case OK:
		// 					return true;
		// 			}
		// 		}
		// 	}
		// }
	},
	[ACTIONS.UPGRADE]: creep => {
		creep.memory.busy = ACTIONS.UPGRADE;
		if(creep.carry.energy == 0){
			creep.memory.busy = false;
			return;
		}
		switch(creep.upgradeController(creep.room.controller)){
			case ERR_NOT_IN_RANGE:
				creep.moveTo(creep.room.controller);
			case OK:
				return true;
		}
	},
	[ACTIONS.BUILD]: creep => {
		if(creep.carry.energy == 0){
			creep.memory.busy = false;
			return;
		}else{
			creep.memory.busy = ACTIONS.BUILD;
		}

		const nextUp = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);

		if(nextUp){
			switch(creep.build(nextUp)){
				case ERR_NOT_IN_RANGE:
					creep.moveTo(nextUp);
				case OK:
					return true;
			}
		}
	},
	[ACTIONS.STORE]: creep => {
		creep.memory.busy = ACTIONS.STORE;
		if(_.sum(creep.carry) == 0){
			creep.memory.busy = false;
			return;
		}
		const whiteList = [STRUCTURE_STORAGE, STRUCTURE_CONTAINER];
		const targets = creep.room.find(FIND_STRUCTURES, {
			filter: structure => {
				return whiteList.indexOf(structure.structureType) >= 0;
			}
		});
		let transferTarget;
		if(targets.length > 0){
			for(let name in targets){
				transferTarget = targets[name];
				for(let resource in creep.carry){
					if(!creep.carry[resource] || creep.carry[resource] == 0){
						continue;
					}
					if((transferTarget.store[resource] || 0) < transferTarget.storeCapacity){
						switch(creep.transfer(transferTarget, resource)){
							case ERR_NOT_IN_RANGE:
								if(creep.moveTo(transferTarget) == ERR_NO_PATH){
									return false;
								}
							case OK:
								return true;
						}
					}
				}
			}
		}else{
			creep.memory.busy = false;
			return;
		}
	},
	[ACTIONS.REPAIR]: creep => {
		creep.memory.busy = ACTIONS.REPAIR;
		if(creep.carry.energy == 0){
			return;
		}
		const target = creep.room.find(FIND_STRUCTURES, {
			filter: isCreepDamagedStructure
		})[0];
		if(target){
			switch(creep.repair(target)){
				case ERR_NOT_IN_RANGE:
					creep.moveTo(target);
				case OK:
					return true;
			}
		}
	},
	[ACTIONS.GO_HOME]: creep => {
		const homeRoom = getHomeBase(creep).room.name;
		if(creep.carry.energy == creep.carryCapacity && creep.room.name != homeRoom){//Go Home
			const path = Game.map.findRoute(creep.room, homeRoom);
			const exit = creep.pos.findClosestByRange( path[0].exit );
			creep.moveTo(exit);
			return true;
		}else if(creep.room.name == homeRoom){
			const { x, y } = creep.pos;
			if(x == 0 || y == 0 || x == 49 || y == 49){
				creep.moveTo(25, 25);
				return true;
			}else{
				creep.cancelOrder('moveTo');
			}
		}
	},
	[ACTIONS.DROP_OFF]: creep => {
		const homeRoom = getHomeBase(creep).room.name;
		if(creep.room.name == homeRoom){//Go Home
			if(creep.pos.x == 34 && creep.pos.y == 7){
				creep.drop(RESOURCE_ENERGY, creep.carry.energy);
			}else{
				creep.moveTo(34, 7);
			}
		}
	},
	[ACTIONS.SETTLE]: creep => {
		const { room, memory: { destination, busy }} = creep;

		if(room.name != destination){
			creep.memory.busy = ACTIONS.SETTLE;
			const path = Game.map.findRoute(room, destination);
			const exit = creep.pos.findClosestByRange( path[0].exit );
			creep.moveTo(exit);
			return true;
		}else if(room.name == destination && busy == ACTIONS.SETTLE){
			const { x, y } = creep.pos;
			if(x == 0 || y == 0 || x == 49 || y == 49){
				creep.moveTo(25, 25);
				return true;
			}else{
				creep.memory.busy = false;
				creep.cancelOrder('moveTo');
			}
		}else{
			creep.say("Mine");
		    const controller = room.controller;
			switch(creep.claimController(controller)){
				case ERR_NOT_IN_RANGE:
					creep.moveTo(controller);
				case OK:
					return true;
			}
		}
	},
	[ACTIONS.EXPLORE]: creep => {
		return;
		creep.memory.busy = ACTIONS.EXPLORE;
		const homeRoom = getHomeBase(creep).room.name;

		if(!creep.memory.destination){
			const exits = Game.map.describeExits( creep.room.name );
			let foundNewRoom;
			for(var room in exits){
				if(Memory.roomsToExplore.indexOf(exits[room]) < 0 &&
					Memory.exploredRooms.indexOf(exits[room]) < 0){

					Memory.roomsToExplore.push( exits[room] );
					foundNewRoom = true;
				}
			}

			let keyIndex;
			if(foundNewRoom){
				// creep.say("Find New Destination");
				//Find a new destination
				const exitKeys = Object.keys( exits );
				keyIndex = Math.floor(Math.random() * exitKeys.length);
				creep.memory.destination = exits[ exitKeys[keyIndex] ];
			}else if(Memory.roomsToExplore.length > 0){
				// creep.say("Find Near room");
				keyIndex = Math.floor(Math.random() * Memory.roomsToExplore.length);
				creep.memory.destination = Memory.roomsToExplore[ keyIndex ];
			}else{
				// creep.say("Find Near Explored");
				keyIndex = Math.floor(Math.random() * Memory.exploredRooms.length);
				creep.memory.destination = Memory.exploredRooms[ keyIndex ];
			}
		}else if(creep.room.name != creep.memory.destination){
			// creep.say(creep.memory.destination);
			const path = Game.map.findRoute(creep.room, creep.memory.destination);
			const exit = creep.pos.findClosestByRange( path[0].exit );
			creep.moveTo(exit);
			return true;
		}else if(creep.room.name == creep.memory.destination){
			const { x, y } = creep.pos;
			if(x == 0 || y == 0 || x == 49 || y == 49){
				creep.moveTo(25, 25);
				return true;
			}else{
				creep.cancelOrder('moveTo');
			}

			const roomIndex = Memory.roomsToExplore.indexOf( creep.memory.destination );
			if(roomIndex >= 0){
				Memory.roomsToExplore.splice(roomIndex,1);
			}
			if(Memory.exploredRooms.indexOf( creep.memory.destination ) < 0){
				Memory.exploredRooms.push( creep.memory.destination );
			}

			const enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES, {
				filter: structure => {
					return structure.structureType != STRUCTURE_KEEPER_LAIR;
				}
			});
			const enemies = creep.room.find(FIND_HOSTILE_CREEPS);
			const aiStructures = creep.room.find(FIND_HOSTILE_STRUCTURES, {
				filter: structure => {
					return structure.structureType == STRUCTURE_KEEPER_LAIR;
				}
			});
			const sources = creep.room.find(FIND_SOURCES, {
				filter: structure => {
					return structure.energy != 0 && creep.memory.blocked != structure.id;
				}
			});
			if(enemyStructures.length > 0){
				//Setup a battlefield
				if(Memory.playerRooms.indexOf( creep.room.name ) < 0){
					Memory.playerRooms.push(creep.room.name);
				}
			}else if(enemies.length > 0){
				//Send a raiding party
				if(Memory.battleFields.indexOf( creep.room.name ) < 0){
					Memory.battleFields.push(creep.room.name);
				}
			}else if(aiStructures.length > 0){
				if(Memory.botRooms.indexOf( creep.room.name ) < 0){
					Memory.botRooms.push(creep.room.name);
				}
			}else if(sources.length >= 2){
				if(Memory.quarry.indexOf( creep.room.name ) < 0){
					Memory.quarry.push(creep.room.name);
				}
			}

			creep.memory.destination = null;
			return true;
		}
	},
	[ACTIONS.GOTO_BATTLEZONE]: creep => {
		const battlezone = "W7N4";
		if(creep.room.name != battlezone){
			const path = Game.map.findRoute(creep.room, battlezone);
			const exit = creep.pos.findClosestByRange( path[0].exit );
			creep.moveTo(exit);
			return true;
		}else{
			// const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 10);
			const targets = creep.room.find(FIND_HOSTILE_CREEPS);
			if(targets.length > 0) {
				switch(creep.rangedAttack(targets[0])){
					case ERR_NOT_IN_RANGE:
						creep.moveTo(targets[0]);
					case OK:
						return true;
				}
			}else{
				creep.moveTo(34, 20);
			}
		}
	},
	[ACTIONS.PARTY_UP]: (creep, props) => {
		const homeRoom = getHomeBase(creep).room.name;
		if(creep.room.name == homeRoom){
			console.log(props.wait);
			// if(props.wait){
			// 	creep.moveTo(25, 10);
			// 	return true;
			// }
		}
	},
	[ACTIONS.HUNT]: creep => {
		let targets = creep.room.find(FIND_HOSTILE_CREEPS);
		if(targets.length > 0) {
			let myTarget;
			if(!creep.memory.target){
				myTarget = targets[0];
			}else{
				myTarget = targets.find( enemy => {
					return enemy.id == creep.memory.target;
				}) || targets[0];
			}

			creep.memory.target = myTarget.id;
			switch(creep.attack(myTarget)){
				case ERR_NOT_IN_RANGE:
					creep.moveTo(myTarget);
				case OK:
					return true;
			}
			return;
		}
		// console.log("Hostiles", targets.length);
		if(Memory.battleFields.length > 0){
			const battlezone = Memory.battleFields[ 0 ];
			if(creep.room.name != battlezone){
				const path = Game.map.findRoute(creep.room, battlezone);
				const exit = creep.pos.findClosestByRange( path[0].exit );
				creep.moveTo(exit);
				return true;
			}else{
				targets = creep.room.find(FIND_HOSTILE_CREEPS);
				if(targets.length > 0) {
					switch(creep.attack(targets[0])){
						case ERR_NOT_IN_RANGE:
							creep.moveTo(targets[0]);
						case OK:
							return true;
					}
				}
			}
		} else {
			creep.moveTo(25, 10);
			targets = creep.room.find(FIND_HOSTILE_CREEPS);
			if(targets.length > 0) {
				switch(creep.attack(targets[0])){
					case ERR_NOT_IN_RANGE:
						creep.moveTo(targets[0]);
					case OK:
						return true;
				}
			}
		}
	},
	[ACTIONS.ADD_ROAD]: creep => {
		const { x, y } = creep.pos;
		const standingOn = creep.room.lookAt(x, y);
		let hasStructure;
		standingOn.forEach( object => {
			if(object.type == LOOK_STRUCTURES || object.type == LOOK_CONSTRUCTION_SITES){
				hasStructure = true;
			}
		});

		if(!hasStructure){
			creep.room.createConstructionSite(x, y, STRUCTURE_ROAD);
		}
	},
	[ACTIONS.CALL_WORKER]: creep => {
		const underConstruction = creep.room.find(FIND_CONSTRUCTION_SITES);
		const brokenRoads = creep.room.find(STRUCTURE_ROAD, {
			filter: structure => {
				return structure.hits < structure.hitsMax;
			}
		});
		if(underConstruction.length > 0 || brokenRoads.length > 0){
			if(Memory.worksites.indexOf( creep.room.name ) < 0){
				Memory.worksites.push(creep.room.name);
			}
		}else{
			const roomIndex = Memory.worksites.indexOf( creep.room.name );
			if(roomIndex >= 0){
				Memory.worksites.splice(roomIndex, 1);
			}
		}
	},
	[ACTIONS.FIND_MINING_SITE]: creep => {
		const {
			memory: { busy, destination },
			pos: { x, y }
		} = creep;
		const carry = _.sum(creep.carry);

		if(creep.room.name != destination && carry == 0){
			creep.memory.busy = ACTIONS.FIND_MINING_SITE;
			const path = Game.map.findRoute(creep.room, destination);
			const exit = creep.pos.findClosestByRange( path[0].exit );
			creep.moveTo(exit);
			return true;
		}else if(creep.room.name == destination && busy == ACTIONS.FIND_MINING_SITE){
			if(x == 0 || y == 0 || x == 49 || y == 49){
				creep.moveTo(25, 25);
				return true;
			}else{
				creep.memory.busy = false;
				creep.cancelOrder('moveTo');
			}
		}
	},
	[ACTIONS.GOTO_WORKSITE]: creep => {
		const {
			memory: { busy, destination },
			pos: { x, y }
		} = creep;
		const carry = _.sum(creep.carry);

		if(creep.room.name != destination && carry > 0){
			creep.memory.busy = ACTIONS.GOTO_WORKSITE;
			const path = Game.map.findRoute(creep.room, destination);
			const exit = creep.pos.findClosestByRange( path[0].exit );
			creep.moveTo(exit);
			return true;
		}else if(creep.room.name == destination && busy == ACTIONS.GOTO_WORKSITE){
				// console.log(creep.name,"go to",destination,"from",creep.room.name);
			if(x == 0 || y == 0 || x == 49 || y == 49){
				// if(creep.name == "Kylie"){
				// 	console.log("Dont block the exits");
				// }
				creep.moveTo(25, 25);
				return true;
			}else{
				creep.memory.busy = false;
				creep.cancelOrder('moveTo');
			}
		}
	},
	[ACTIONS.HEALING]: creep => {
		const injured = creep.room.find(FIND_MY_CREEPS, {
			filter: creep => {
				return creep.hits < creep.hitsMax;
			}
		})
		if(injured.length > 0){
			creep.memory.busy = ACTIONS.HEALING;
			const save = injured[0].name+"!!!";
			if(!creep.saying == save){
				creep.say(save);
			}
			switch(creep.heal(injured[0])){
				case ERR_NOT_IN_RANGE:
					creep.moveTo(injured[0]);
				case OK:
					return true;
			}
		}else{
			creep.memory.busy = false;
			creep.moveTo(14, 28);
		}
	},
	[ACTIONS.PASS]: creep => {
		if(creep.carry.energy == 0){
			creep.memory.busy = false;
			return;
		}
		creep.memory.busy = ACTIONS.PASS;
		const whiteList = [ UNITS.BUILDER, UNITS.HARVESTER];
		// const needy = creep.room.find(FIND_MY_CREEPS, {
		const needy = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
			filter: creep => {
				return whiteList.indexOf(creep.memory.role) >= 0 && creep.carry.energy < creep.carryCapacity * .75;
			}
		})

		if(needy){
			// console.log("Pass to ", needy.name);
			switch(creep.transfer(needy, RESOURCE_ENERGY)){
				case ERR_NOT_IN_RANGE:
					creep.moveTo( needy );
				case OK:
					return true;
			}
		}
	},
	[ACTIONS.CALL_HELP]: creep => {
		const roomName = creep.room.name;
		const enemies = creep.room.find(FIND_HOSTILE_CREEPS);
		if(enemies.length > 0){
			if(Memory.battleFields.indexOf( roomName ) < 0){
				Memory.battleFields.push(roomName);
			}
		}else{
			const roomIndex = Memory.battleFields.indexOf( roomName );
			if(roomIndex >= 0){
				Memory.battleFields.splice(roomIndex,1);
			}
		}
	},
	[ACTIONS.TRADE_TERMINAL]: creep => {
		const terminal = creep.room.find(FIND_STRUCTURES,{
			filter: structure => {
				return structure.structureType == STRUCTURE_TERMINAL;
			}
		})[0];
		if(Memory.terminals[ creep.room.name ] && terminal){
			const { request, offer } = Memory.terminals[ creep.room.name ];

			if(request){
				// console.log("Trading Request:",request);
				if(creep.carry[RESOURCE_ENERGY] == 0){
					switch(creep.withdraw(terminal, RESOURCE_ENERGY)){
						case ERR_NOT_IN_RANGE:
							creep.moveTo(terminal);
						case OK:
							return true;
					}
				}else{
					TASKS[ ACTIONS.STORE ](creep);
					return true;
				}
			}else if(offer){
				// console.log();
				if(creep.carry[RESOURCE_ENERGY] == 0){
					// console.log("Go get the resources");
					TASKS[ ACTIONS.WITHDRAW ](creep);
					return true;
				}else if(terminal.store[RESOURCE_ENERGY] < offer){
					// console.log("Trading Offer:",offer);
					switch(creep.transfer(terminal, RESOURCE_ENERGY)){
						case ERR_NOT_IN_RANGE:
							creep.moveTo(terminal);
						case OK:
							return true;
					}
				}
			}
		}
	},
	[ACTIONS.GET_TERMINAL]: creep => {
		const terminal = creep.room.find(FIND_STRUCTURES,{
			filter: structure => {
				return structure.structureType == STRUCTURE_TERMINAL;
			}
		})[0];
		if(terminal &&
			terminal.store[RESOURCE_ENERGY] > 0 &&
			Memory.terminals[ creep.room.name ] &&
			!Memory.terminals[ creep.room.name ].offer &&
			creep.carry[ RESOURCE_ENERGY ] == 0){
			console.log("Source has energy");
			switch(creep.withdraw(terminal, RESOURCE_ENERGY)){
				case ERR_NOT_IN_RANGE:
					creep.moveTo(terminal);
				case OK:
					console.log("Go get that");
					return true;
			}
		}
	}
};
const ActionManager = {
	doTasks: (creep, actionList, props = {}) => {
		const actions = actionList.slice();
		if(creep.memory.role == UNITS.REMOTE_BUILDER){
			// console.log();
		}
		while(actions.length){
			task = actions.shift();
			if(TASKS[ task ]){
				if(creep.memory.role == UNITS.REMOTE_BUILDER){
					// console.log("Task", task);
				}
				try{
					if(TASKS[task]( creep, props )){
						return;
					}
				}catch(e){
					console.log("Error[", task,"]", e);
				}
			}
		}
	}
}

module.exports = ActionManager;

const {
	isBuiltStructure,
	isSpawn,
	isTerminal,
	isContainer,
	isStorage,
} = require("utils");
const { UNITS } = require('constants');
const ActionManager = require('action.manager');
const UnitManager = require('units.manager');

const ROOM_TYPE = {
	HATCHERY: "HATCHERY",
	OUTPOST: "OUTPOST",
}
const ROOM_LISTS = {
	MODE: "MODE",
	UNEXPLORED: "UNEXPLORED",
	EXPLORED: "EXPLORED",
	BOT: "BOT",
	PLAYER: "PLAYER",
	BATTLEFIELD: "BATTLEFIELD",
	QUARRY: "QUARRY",
	WORKSITE: "WORKSITE",
	// UPLINKS: "UPLINKS",
	// DOWNLINKS: "DOWNLINKS",
	STRUCTURES: "STRUCTURES",
	SOURCES: "SOURCES",
	EXITS: "EXITS",
};

const trade = () => {
	let room;
	let spawns;
	let terminal;
	let allTerminals = [];
	let storage;
	let energyStored;
	let totalEnergyStored = 0;
	let trader;
	let request;
	let terminalName;
	const storageWhitelist = [STRUCTURE_CONTAINER, STRUCTURE_STORAGE];
	// console.log();

	for(let roomName in Game.rooms){
		room = Game.rooms[roomName];
		spawns = room.find(FIND_STRUCTURES,{
			filter: structure => {
				return structure.structureType == STRUCTURE_SPAWN;
			}
		});

		//Has a spawn in the room
		if(spawns.length > 0){
			terminal = room.find(FIND_STRUCTURES,{
				filter: structure => {
					return structure.structureType == STRUCTURE_TERMINAL;
				}
			})[0];

			//Has terminal to trade
			if(terminal){
				Memory.terminals[ terminal.room.name ] = Memory.terminals[ terminal.room.name ] || {};

				storage = room.find(FIND_STRUCTURES,{
					filter: structure => {
						return storageWhitelist.indexOf(structure.structureType) >= 0 && structure.store[RESOURCE_ENERGY] > 0;
					}
				})
				energyStored = 0;//room.energyAvailable;
				for(let name in storage){
					energyStored += storage[name].store[RESOURCE_ENERGY];
				}
				totalEnergyStored += energyStored;
				allTerminals.push({
					terminal,
					energyStored
				});
				// console.log(room.name, energyStored);
			}
		}
	}

	if(allTerminals.length > 0){
		// console.log("Trade", totalEnergyStored, "between", allTerminals.length, "terminals");
		if(totalEnergyStored / allTerminals.length == 0){
			//We're all poor
			return;
		}
		for(let index in allTerminals){
			trader = allTerminals[index];
			request = (totalEnergyStored / allTerminals.length) - trader.energyStored;
			terminalName = trader.terminal.room.name;
			if(request > 500){
				Memory.terminals[ terminalName ] = {
					request
				}
				// console.log(trader.terminal.room.name, "request", request);
			}else if(request < 0){
				Memory.terminals[ terminalName ] = {
					offer: Math.abs(request)
				}
				terminalSend( trader.terminal );
				// console.log(trader.terminal.room.name, "offer", Math.abs(request));
			}else{
				// console.log("Dont worry about the $",request);
			}
		}
	}
}
const terminalSend = terminal => {
	// console.log("Find receiving terminals");
	let request;
	let cost;
	for(let terminalName in Memory.terminals){
		if(terminal.room.name == terminalName){
			continue;
		}

		request = Memory.terminals[ terminalName ].request;
		if(request && terminal.store[RESOURCE_ENERGY] > request){
			terminal.send(RESOURCE_ENERGY, request, terminalName)
			// cost = Game.market.calcTransactionCost(request, terminal.room.name, terminalName);
			// console.log(cost);
			// console.log("send to", terminalName, request, terminal.store.energy);
		}
	}
}

const roomStatus = () => {
	let room;
	let sources;
	let roomMemory;
	let structures;
	let structureCount;
	let builtStructures;
	let exits;
	let exitArray;
	let constructionSite;

	for(let roomName in Game.rooms){
		room = Game.rooms[roomName];
		roomMemory = getRoom(roomName);

		if(!roomName || !room){
			continue;
		}

		//Take inventory of all my structures
		builtStructures = room.find(FIND_STRUCTURES, { filter: isBuiltStructure });
		if(!roomMemory.STRUCTURES ||
			roomMemory.STRUCTURES.count != builtStructures.length){
			structures = {
				[STRUCTURE_SPAWN]: room.find(FIND_STRUCTURES, { filter: isSpawn }).length,
				[STRUCTURE_TERMINAL]: room.find(FIND_STRUCTURES, { filter: isTerminal }).length,
				[STRUCTURE_CONTAINER]: room.find(FIND_STRUCTURES, { filter: isContainer }).length,
				[STRUCTURE_STORAGE]: room.find(FIND_STRUCTURES, { filter: isStorage }).length,
			};
			structureCount = _.sum(structures);
			setRoom(roomName, ROOM_LISTS.STRUCTURES, Object.assign({
					count: structureCount,
				},
				structures
			));
		}

		//Check the amount of sources
		sources = room.find(FIND_SOURCES);
		if(!roomMemory.SOURCES ||
			roomMemory.SOURCES != sources.length){
			setRoom(roomName, ROOM_LISTS.SOURCES, { count: sources.length });
		}

		//Assign the task for each room
		if(roomMemory.STRUCTURES && roomMemory.STRUCTURES[STRUCTURE_SPAWN] > 0){
			setRoom(roomName, ROOM_LISTS.MODE, { type: ROOM_TYPE.HATCHERY });
		}else if(roomMemory.SOURCES > 0){
			setRoom(roomName, ROOM_LISTS.MODE, { type: ROOM_TYPE.OUTPOST });
		}

		//Find the exits
		if(!roomMemory.EXITS &&
			roomMemory.MODE == ROOM_TYPE.HATCHERY){
			exitArray = Game.map.describeExits( roomName );
			exits = [];
			for(let direction in exitArray){
				exits.push( exitArray[ direction ]);
			}
			setRoom(roomName, ROOM_LISTS.EXITS, { exits });
		}

		if(roomMemory.MODE == ROOM_TYPE.OUTPOST){
			if(Memory.worksites.indexOf(roomName) < 0){
				Memory.worksites.push( roomName );
			}
		}
	}
}
const assignRemoteMiners = () => {
	return;
	let creep;
	let roomMemory;
	let minerCount = {};
	// console.log();
	for(let name in Game.creeps){
		creep = Game.creeps[ name ];
		const { role, quarry } = creep.memory;

		if(role != UNITS.REMOTE_MINER){
			continue;
		}

		minerCount[quarry] = minerCount[quarry] + 1 || 0;
	}

	for(let roomName in minerCount){
		roomMemory = getRoom( roomName );
		if(roomMemory[ ROOM_LISTS.MODE ] != ROOM_TYPE.OUTPOST){
			continue;
		}
		// console.log(minerCount[roomName],"of",roomMemory.SOURCES);
	}
}

const initRoom = roomName => {
	// Memory.rooms = {};
	Memory.rooms = Memory.rooms || {};
	Memory.rooms[ roomName ] = Memory.rooms[ roomName ] || {};
}
const getRoom = roomName => {
	initRoom(roomName);
	return Memory.rooms[ roomName ];
}
const setRoom = (roomName, list, props) => {
	initRoom(roomName);
	let updateList;
	switch(list){
		case ROOM_LISTS.MODE:
			updateList = props.type;
			break;
		case ROOM_LISTS.STRUCTURES:
			updateList = props;
			break;
		case ROOM_LISTS.SOURCES:
			updateList = props.count;
			break;
		case ROOM_LISTS.EXITS:
			updateList = props.exits;
			break;
		default:
			return;
	}

	Memory.rooms[ roomName ][ list ] = updateList;
}
const exploreRooms = () => {
	return;
	Memory[ ROOM_LISTS.UNEXPLORED ] = Memory[ ROOM_LISTS.UNEXPLORED ] || [];
	let unexplored = Memory[ ROOM_LISTS.UNEXPLORED ] || [];
	let roomMemory;
	for(let roomName in Memory.rooms){
		roomMemory = getRoom(roomName);

		if(!roomName){
			continue;
		}

		if(unexplored.indexOf(roomName) < 0){
			console.log("Explore room", roomName);
		}

	}
}
const assignWorkers = () => {
	//REMOTE_BUILDER
	const workers = [
		UNITS.REMOTE_BUILDER,
		UNITS.REMOTE_MINER,
	];

	let workOrders;
	let unitCount = {};;
	let creep;
	let actions;
	let props;
	let minUnits;
	let role;
	// console.log("Worksites", Memory.worksites);
	for(const index in workers){
		unitCount[ workers[index] ] = 0;
	}

	for(const index in Game.creeps){
		creep = Game.creeps[ index ];

		if(workers.indexOf( creep.memory.role ) < 0){
			continue;
		}

		const { name, memory: { role, home, destination }, carry} = creep;

		actions = UnitManager.UNIT_TYPES[ role || UNITS.DEFAULT ].actions;
		props = {};
		switch(role){
			case UNITS.REMOTE_BUILDER:
				let newDestination = destination ||
					Memory.worksites.length > 0 ?
					Memory.worksites[ unitCount[role] % Memory.worksites.length ] :
					home;
				// console.log("Go to ", newDestination, unitCount[role] % Memory.worksites.length);
				// creep.memory.destination = destination -|| Memory.
				break;
			case UNITS.REMOTE_MINER:
				// props = {
				// 	minerIndex: unitCount[role]
				// }
				if(!creep.memory.quarry || Memory.quarry["W2N5"].indexOf(creep.memory.quarry) < 0){
					creep.memory.quarry = Memory.quarry["W2N5"][ (unitCount[role] - 1) % Memory.quarry["W2N5"].length ] ;
				}
				break;
		}

		unitCount[ role ]++;
		ActionManager.doTasks(creep, actions, props);
	}

	//Request new work orders
	workOrders = [];
	for(const index in workers){
		role = workers[index];
		switch(role){
			case UNITS.REMOTE_BUILDER:
				minUnits = Memory.worksites.length * 4;
				if(Memory.worksites.length > 0 &&
					unitCount[ role ] < minUnits){
					workOrders.push({
						role,
						unitCount: unitCount[ role ],
						minUnits
					});
				}
				break;
			case UNITS.REMOTE_MINER:
				minUnits = Memory.quarry["W2N5"].length;
				if(unitCount[role] < minUnits){
					workOrders.push({
						role,
						unitCount: unitCount[ role ],
						minUnits
					});
				}
				break;
		}
	}
	Memory.workOrders = workOrders;
	// console.log("Work orders", workOrders.length, workOrders[0] && workOrders[0].role );
}

const HiveMind = {
	ROOM_LISTS,
	ROOM_TYPE,
	getRoom,
	setRoom,
	handleTasks: () => {
		Memory.workOrders = Memory.workOrders || [];
		roomStatus();
		trade();
		assignWorkers();
		// assignRemoteMiners();
		exploreRooms();
	},
}

module.exports = HiveMind;

const {
	isBuiltStructure,
	isSpawn,
	isTerminal,
	isContainer,
	isStorage,
	isEnemy,
	countUnitsByType,
	getUnitsWithDestination,
	isCreepDamagedStructure,
} = require("utils");
const { UNITS } = require('constants');
const ActionManager = require('action.manager');
const UnitManager = require('units.manager');
const Warpath = require('warpath.manager');
const Squad = require('squad');
const MemoryLists = require('memory.lists');

const ROOM_TYPE = {
	HATCHERY: "HATCHERY",
	OUTPOST: "OUTPOST",
  	HOSTILE: "HOSTILE",
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
	CONSTRUCTION_SITE: "CONSTRUCTION_SITE",
	NAME: "NAME",
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

const sortRooms = () => {
	let room;
	let sources;
	let roomMemory;
	let structures;
	let structureCount;
	let builtStructures;
	let exits;
	let exitArray;
	let constructionSite;
	let enemyStructures;
	let sites;
	let siteIndex;
	let squad;
	let roomKey;

	for(let roomName in Game.rooms){
		room = Game.rooms[roomName];
		roomMemory = getRoom(roomName);

		if(!roomName || !room){
			continue;
		}

		if(!roomMemory.NAME){
			setRoom(roomName, ROOM_LISTS.NAME, { name: roomName });
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

		enemyStructures = room.find(FIND_HOSTILE_STRUCTURES, isEnemy);

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

		//Assign the task for each room
		if(enemyStructures.length > 0){
			setRoom(roomName, ROOM_LISTS.MODE, { type: ROOM_TYPE.HOSTILE });
		}else if(roomMemory.STRUCTURES && roomMemory.STRUCTURES[STRUCTURE_SPAWN] > 0){
			// console.log("Hatchery", roomName, roomMemory.NAME);
			roomKey = {
				roomName,
				level: MemoryLists.LEVEL.ROOM,
				type: MemoryLists.TYPES.WORKFORCE,
				groupName: roomName+"_1"
			};

			if(!MemoryLists.get(roomKey)){
				spotCount = 0;
				MemoryLists.add(Object.assign({}, roomKey, {
					squad: Squad.createParty({
						type: Squad.TYPES.WORKERS,
						props: {
							roomName
						}
					})
				}));
			}
			setRoom(roomName, ROOM_LISTS.MODE, { type: ROOM_TYPE.HATCHERY });
		}else if(roomMemory.SOURCES > 0){
			setRoom(roomName, ROOM_LISTS.MODE, { type: ROOM_TYPE.OUTPOST });
		}

		siteIndex = Memory.worksites.indexOf(roomName);
		switch(roomMemory.MODE){
			case ROOM_TYPE.OUTPOST:
				// console.log("Add worksite", roomName)
				addWorksite(roomName);
				sites = room.find(FIND_CONSTRUCTION_SITES).length +
					room.find(FIND_STRUCTURES, {
						filter: isCreepDamagedStructure
					}).length;
				if(sites > 0){
					if(siteIndex < 0){
						Memory.worksites.push( roomName );
					}
				}else if(siteIndex >= 0){
					Memory.worksites.splice(siteIndex,1);
				}
				break;
			case ROOM_TYPE.HATCHERY:
			case ROOM_TYPE.HOSTILE:
				Memory.worksites.splice(siteIndex,1);
				break;
		}
	}
}
const addWorksite = name => {
	if(Memory.worksites.indexOf(name) < 0){
		Memory.worksites.push(name);
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
		case ROOM_LISTS.CONSTRUCTION_SITE:
			updateList = props.sites;
			break;
		case ROOM_LISTS.NAME:
			updateList = props.name;
			break;
		default:
			return;
	}

	Memory.rooms[ roomName ][ list ] = updateList;
}
const exploreRooms = () => {
	Memory[ ROOM_LISTS.UNEXPLORED ] = Memory[ ROOM_LISTS.UNEXPLORED ] || [];
	let unexplored = Memory[ ROOM_LISTS.UNEXPLORED ] || [];
	let roomMemory;
	for(let roomName in Memory.rooms){
		roomMemory = getRoom(roomName);

		if(!roomName){
			continue;
		}

		if(unexplored.indexOf(roomName) < 0){
			// console.log("Explore room", roomName);
		}
	}
}
const readTheFlags = () => {
	let flag;
	let settleLoc = [];
	let playerStructures;
	let roomName;
	let room;

	for(const name in Game.flags){
		flag = Game.flags[name];
		roomName = flag.pos.roomName;
		switch(flag.color){
			case COLOR_BLUE:
				// console.log("New expansion");
				room = Game.rooms[ roomName ];
				if(!room || !room.controller.my){
					// console.log(getUnitsWithDestination( roomName, UNITS.SETTLER ),"units going to",roomName);
					// console.log("Build a settler");
					settleLoc.push({
						role: UNITS.SETTLER,
						unitCount: getUnitsWithDestination( roomName, UNITS.SETTLER ),
						minUnits: 1,
						destination: roomName,
					});
				}else if(room.controller.my){
					// console.log(flag.pos.x, flag.pos.y, flag.name);
					// console.log("Build a spawn");
					switch(room.createConstructionSite(flag.pos.x, flag.pos.y, STRUCTURE_SPAWN)){
						case OK:
							flag.remove();
							return;
					}
				}
				break;
			case COLOR_ORANGE:
				// console.log("Rally Point");
				if(Warpath.ready()){
					Warpath.assault();
				}else{
					Warpath.rally(flag);
				}
				break;
		}
	}
	Memory.settlers = settleLoc;
}
const getQuarryInfo = room => {
	return room.MODE == ROOM_TYPE.OUTPOST &&
		room.SOURCES > 0 &&
		room.NAME &&
		Memory.hostileRooms.indexOf(room.name) < 0;
}
const getQuarryArray = () => {
	const quarries = _.filter(Memory.rooms, getQuarryInfo);
	const sourceList = [];
	let room;
	for(const name in quarries){
		room = quarries[name];
		for(let ii = 0; ii < room[ROOM_LISTS.SOURCES]; ++ii){
			sourceList.push(room[ROOM_LISTS.NAME]);
		}
	}

	return sourceList;
}
const getHostileRooms = rooms => {
	let hostileRooms = [];
	let room;
	for(const name in rooms){
		room = rooms[name];
		if(room.MODE == ROOM_TYPE.HOSTILE && room.NAME){
			hostileRooms.push(room.NAME);
		}
	}
	return hostileRooms;
}
const isRoomExplored = room => {
	return room[ ROOM_LISTS.MODE ] && room[ ROOM_LISTS.NAME ] && room[ ROOM_LISTS.MODE ] != ROOM_TYPE.HOSTILE;
}
const findUnexploredRooms = () => {
	const knownRooms = _.filter(Memory.rooms, isRoomExplored);
	const knownRoomNames = [];
	const exits = [];
	let currentRoom;

	for(const name in knownRooms){
		knownRoomNames.push(knownRooms[name].NAME);
	}
	for(const index in knownRoomNames){
		currentRoom = Memory.rooms[knownRoomNames[index]][ ROOM_LISTS.EXITS ];
		for(const exitIndex in currentRoom){
			if(knownRoomNames.indexOf( currentRoom[exitIndex] ) < 0){
				exits.push(currentRoom[exitIndex]);
			}
		}
	}
	// console.log("Known Rooms", knownRoomNames);
	// console.log("Unexplored Rooms", exits);
}
const assignWorkers = () => {
	//REMOTE_BUILDER
	const workers = [
		UNITS.REMOTE_BUILDER,
		UNITS.REMOTE_MINER,
		UNITS.SETTLER,
	];

	let workOrders;
	let unitCount = {};
	let creep;
	let actions;
	let props;
	let minUnits;
	let role;

	Memory.hostileRooms = getHostileRooms(Memory.rooms);
	const worksites = Memory.worksites;
	// console.log("Worksites", Memory.worksites,'|', worksites, worksites.length);
	const quarries = getQuarryArray();
	// const = _.filter(Memory.rooms, getQuarryInfo);
	// const quarryKeys = Object.keys(quarries);
	const exploreSites = findUnexploredRooms();

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
				if(worksites.length){
					creep.memory.destination = worksites[ unitCount[role] % worksites.length ];
				}else{
					creep.memory.destination = creep.memory.home;
				}
				break;
			case UNITS.REMOTE_MINER:
				if(quarries.length){
					creep.memory.destination = quarries[ unitCount[role] % quarries.length ];
				}else{
					creep.memory.destination = creep.memory.home;
				}
				break;
			case UNITS.SETTLER:
				if(!creep.memory.destination){
					creep.memory.destination = Memory.settlers[0] || creep.memory.home;
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
				minUnits = worksites.length * 4;
				if(minUnits > 0 &&
					unitCount[ role ] < minUnits){
					workOrders.push({
						role,
						unitCount: unitCount[ role ],
						minUnits
					});
				}
				break;
			case UNITS.REMOTE_MINER:
				// minUnits = quarries.length * 2;
				minUnits = 0;
				if(minUnits > 0 && unitCount[role] < minUnits){
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
}

const HiveMind = {
	ROOM_LISTS,
	ROOM_TYPE,
	getRoom,
	setRoom,
	sortRooms,
	assignWorkers,
	handleTasks: () => {
		// Memory.workOrders = Memory.workOrders || [];
		// sortRooms();
		// exploreRooms();
		// trade();
		assignWorkers();
		// readTheFlags();
	},
}

module.exports = HiveMind;

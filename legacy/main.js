const SpawnManager = require('spawn.manager');
const ActionManager = require('action.manager');
const { UNIT_TYPES } = require('units.manager');
const HiveMind = require('hivemind');
const MemoryLists = require('memory.lists');
const {
	UNITS: {
		DEFAULT,
		HARVESTER, RUNNER,
		MINER, REMOTE_MINER,
		BUILDER, REMOTE_BUILDER,
		BOWMAN,
		EXPLORER, SETTLER,
		MEDIC,
	},
	ACTIONS: {
		MINING, TRANSFER, UPGRADE, BUILD, STORE, SCAVENGE, DROP, REPAIR, WITHDRAW,
		DROP_OFF,
		GO_HOME,
		EXPLORE, SETTLE,
		HUNT, GOTO_BATTLEZONE,
		FIND_MINING_SITE,
		ADD_ROAD, CALL_WORKER,
		GOTO_WORKSITE, PARTY_UP,
		HEALUP,
		HEALING,
		PASS
	},
} = require('constants');

const setupRooms = () => {
	Memory.roomsToExplore = Memory.roomsToExplore || [];
	Memory.exploredRooms = Memory.exploredRooms || [];
	Memory.botRooms = Memory.botRooms || [];
	Memory.playerRooms = Memory.playerRooms || [];
	Memory.battleFields = Memory.battleFields || [];
	Memory.quarry = Memory.quarry || {};
	Memory.worksites = Memory.worksites || [];
	Memory.uplinks = Memory.uplinks || {};
	Memory.downlinks = Memory.downlinks || {};
	Memory.terminals = Memory.terminals || {};
}
module.exports.loop = () => {
	// const homeBase = Game.spawns[homeName];
	setupRooms();

	let creep;
	let actions;
	let unitFound;
	let mySquad;
	const squads = MemoryLists.getSquads();

	for(const index in Memory.creeps) {
		creep = Game.creeps[index];

		//Garbage collection
		if(!creep){
			delete Memory.creeps[index];
			continue;
		}

		actions = UNIT_TYPES[ creep.memory.role || DEFAULT ].actions;

		unitFound = false;
		for(const index in squads){
			mySquad = Object.keys(squads[index].squad);
			if(mySquad.indexOf(creep.name) >= 0){
				unitFound = true;
				break;
			}
		}
		if(!unitFound){
			ActionManager.doTasks(creep, [SCAVENGE, MINING, WITHDRAW, TRANSFER, UPGRADE]);
		}
	}

	//Oversoul
	HiveMind.sortRooms();
	HiveMind.handleTasks();

	//Manage Spawns
	for( const name in Game.spawns ){
		SpawnManager.run( Game.spawns[name] );
	}

	//Manage Squads
	for(const index in squads){
		squads[index].delegateTasks();
	}
}

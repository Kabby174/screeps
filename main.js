const SpawnManager = require('spawn.manager');
const ActionManager = require('action.manager');
const { UNIT_TYPES } = require('units.manager');
const HiveMind = require('hivemind');
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
	for(let index in Memory.creeps) {
		creep = Game.creeps[index];

		//Garbage collection
		if(!creep){
			delete Memory.creeps[index];
			continue;
		}
	}

	//Oversoul
	HiveMind.sortRooms();
	HiveMind.handleTasks();

	//Manage Spawns
	for( let name in Game.spawns ){
		SpawnManager.run( Game.spawns[name] );
	}
}

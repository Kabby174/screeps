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
		BOWMAN, RAIDER,
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
	Memory.exploredRooms = Memory.exploredRooms || [];//[ homeRoom ];
	Memory.botRooms = Memory.botRooms || [];
	Memory.playerRooms = Memory.playerRooms || [];
	Memory.battleFields = Memory.battleFields || [];
	Memory.quarry = Memory.quarry || {};//["W2N4","W3N5", "W1N4", "W2N3","W2N6"] || Memory.quarry || [];
	Memory.worksites = Memory.worksites || [];
	Memory.uplinks = Memory.uplinks || {};
	Memory.downlinks = Memory.downlinks || {};
	Memory.terminals = Memory.terminals || {};

	// const homeRoom = Game.spawns[homeName].room.name;
	// const roomIndex = Memory.worksites.indexOf( homeRoom );
	// if(roomIndex >= 0){
	// 	Memory.worksites.splice(roomIndex,1);
	// }
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

		// creep.suicide();
		/*const { name, memory: { role, home }} = creep;

		//Assign Job
		switch(role){
			case UNITS.REMOTE_BUILDER:
				// if(unitCount[role] % 4 == 0){
				// 	actions = [ACTIONS.WITHDRAW, ACTIONS.SCAVENGE, ACTIONS.GOTO_WORKSITE, ACTIONS.REPAIR, ACTIONS.UPGRADE, ACTIONS.CALL_WORKER];
				// }
				break;
			case UNITS.REMOTE_MINER:
				// props = {
				// 	minerIndex: unitCount[role]
				// }
				break;
			case UNITS.RUNNER:
				// actions = unitCount[role] % 2 ? 
				// 	[ACTIONS.SCAVENGE, ACTIONS.SEND_LINK, ACTIONS.TRANSFER, ACTIONS.STORE, ACTIONS.PASS] : 
				// 	[ACTIONS.SCAVENGE, ACTIONS.SEND_LINK, ACTIONS.STORE, ACTIONS.TRANSFER, ACTIONS.PASS];
				break;
			case DEFAULT:
				actions = (UNIT_TYPES[ role ])
		}
		// actions = UNIT_TYPES[ creep.memory.role || DEFAULT ].actions;
		*/
	}

	//Oversoul
	HiveMind.handleTasks();
	
	//Manage Spawns
	for( let name in Game.spawns ){
		SpawnManager.run( Game.spawns[name] );
	}
}
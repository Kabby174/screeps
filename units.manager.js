const {
	UNITS: {
		DEFAULT,
		HARVESTER, RUNNER,
		ORE_HARVESTER,
		MINER, REMOTE_MINER,
		BUILDER, REMOTE_BUILDER,
		EXPLORER, SETTLER,
		MEDIC,
		MERCHANT,
		SCIENTIST,
		REPAIRMAN,

		PALADIN,
		FOOTMAN,
		RIFLEMAN,
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
		PASS,
		CALL_HELP,

		SEND_LINK,
		GET_LINK,
		HARVEST,
		TRADE_TERMINAL,
		GET_TERMINAL
	},
} = require('constants');

const UNIT_TYPES = {
	[DEFAULT]: {
		minUnits: 4,
		parts: [WORK, CARRY, MOVE],
		actions: [MINING, SCAVENGE, WITHDRAW, TRANSFER, UPGRADE]
	},
	[MEDIC]: {
		minUnits: 0,
		minParts: 2,
		parts: [HEAL, MOVE],
		actions: [HEALING, WITHDRAW, SCAVENGE, TRANSFER, UPGRADE],
	},
	[MINER]: {
		minUnits: 5,
		minParts: 3,
		parts: [WORK, MOVE, CARRY, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE],
		actions: [MINING, DROP],
	},
	[HARVESTER]: {
		minUnits: 12,
		minParts: 3,
		parts: [WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, CARRY, WORK, CARRY],
		actions: [WITHDRAW, SCAVENGE, UPGRADE],
	},
	[ORE_HARVESTER]: {
		minUnits: 2,
		minParts: 7,
		parts: [WORK, WORK, WORK, WORK, MOVE, CARRY, MOVE, MOVE],
		actions: [HARVEST, STORE],
	},
	[BUILDER]: {
		minUnits: 4, //MEMORY.worksites.length > 0 ? 6 : 0,
		minParts: 3,
		parts: [WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE],
		actions: [GO_HOME, WITHDRAW, SCAVENGE, BUILD, TRANSFER, REPAIR, UPGRADE],
	},
	[REPAIRMAN]: {
		minUnits: 2, //MEMORY.worksites.length > 0 ? 6 : 0,
		minParts: 3,
		parts: [WORK, CARRY, MOVE, CARRY, MOVE, WORK],
		// actions: [WITHDRAW, SCAVENGE, REPAIR, TRANSFER, BUILD, UPGRADE],
		actions: [WITHDRAW, SCAVENGE, TRANSFER, REPAIR, BUILD, UPGRADE],
	},
	[REMOTE_BUILDER]: {
		minUnits: 0, //MEMORY.worksites.length > 0 ? 6 : 0,
		minParts: 9,
		parts: [WORK, WORK, CARRY, CARRY, MOVE, MOVE, CARRY, CARRY, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE],
		actions: [WITHDRAW, SCAVENGE, MINING, GOTO_WORKSITE, BUILD, REPAIR],
		// actions: [WITHDRAW, SCAVENGE, REPAIR, BUILD, TRANSFER, UPGRADE],
		// actions: [ WITHDRAW, SCAVENGE, BUILD, STORE ]
	},
	[RUNNER]: {
		minUnits: 4,
		minParts: 3,
		parts: [
				CARRY, MOVE,
				CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
				CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
				CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
			],
		actions: [GET_TERMINAL, SCAVENGE, SEND_LINK, TRANSFER, STORE, PASS],
	},
	[REMOTE_MINER]: {
		minUnits: 2,
		minParts: 3,
		parts: [WORK, CARRY, MOVE, WORK, MOVE, CARRY, WORK, WORK, MOVE, MOVE, CARRY, CARRY, MOVE, MOVE],
		actions: [CALL_HELP, CALL_WORKER, FIND_MINING_SITE, SCAVENGE, MINING, BUILD, GO_HOME, SEND_LINK, STORE, TRANSFER, BUILD],
		// actions: [CALL_HELP, CALL_WORKER, FIND_MINING_SITE, SCAVENGE, MINING, GO_HOME, STORE, BUILD, TRANSFER],
		// actions: [CALL_WORKER, FIND_MINING_SITE, MINING, GO_HOME, STORE],
	},
	[EXPLORER]: {
		minUnits: 0,
		minParts: 3,
		parts: [MOVE, MOVE, MOVE],
		actions: [EXPLORE]
	},
	[SETTLER]: {
		minUnits: 0,
		minParts: 2,
		parts: [CLAIM, MOVE],
		actions: [SETTLE],
	},
	[MERCHANT]: {
		minUnits: 0,
		minParts: 6,
		parts: [MOVE, MOVE, CARRY, CARRY, CARRY, MOVE],
		actions: [TRADE_TERMINAL],
	},
		//move 50,
		//work 100,
		//carry 50,
		//attack 80,
		//ranged_attack 150,
		//heal 250,
		//claim 600,
		//tough 10
		//500, 160, 
	[PALADIN]: {
		minUnits: 0,
		minParts: 15,
		parts: [TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, MOVE, ATTACK, MOVE, MOVE, ATTACK, ATTACK, MOVE, HEAL, HEAL, MOVE],
		actions: [],
	},
	[FOOTMAN]: {
		minUnits: 0,
		minParts: 15,
		parts: [TOUGH, TOUGH, CARRY, CARRY, CARRY, ATTACK, MOVE, ATTACK, MOVE, MOVE, ATTACK, ATTACK, MOVE, ATTACK, MOVE],
		actions: [],
	},
	[RIFLEMAN]: {
		minUnits: 0,
		minParts: 8,
		parts: [TOUGH, TOUGH, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE],
		actions: [],
	},
		// PALADIN,
		// FOOTMAN,
		// RIFLEMAN,
}
const UnitManager = {
	UNIT_TYPES,
	buildUnit: unit => {
		if(!UNIT_TYPES[unit.role]){
			console.log("UNKNOWN UNIT TYPE: ", unit.role);
			return;
		}
		const { minParts, parts,
			role, home, destination,
			unitCount, minUnits } = Object.assign({},
				UNIT_TYPES[unit.role],
				unit);

		const homeBase = Game.spawns[ Object.keys(Game.spawns).find(obj => {
			return Game.spawns[obj].room.name == home;
		}) ];
		let viable = parts.slice();

		while(homeBase.canCreateCreep(viable) != OK && viable.length > Math.min(minParts, parts.length)){
			viable = viable.slice(0, -1);
		}

		if(homeBase.canCreateCreep(viable) == OK){
			const newName = homeBase.createCreep(viable, undefined, {
				role,
				home,
				destination,
			});
			console.log(homeBase.name,"Spawning new "+role+": " + newName,
				"["+Math.round(viable.length / parts.length * 1000) / 10 +"%]",
				unitCount + 1,"/",minUnits);
			return true;
		}
	}
}

module.exports = UnitManager;

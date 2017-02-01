const MemoryLists = require('memory.lists');
const SpawnManager = require('spawn.manager');
const Squad = require('squad');
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

module.exports.loop = () => {
    //Wipes
    const whiteListNames = ["creeps","botRooms","SQUADS","spawns","rooms"];
    for(const name in Memory){
        console.log();
        if(whiteListNames.indexOf(name) < 0){
            delete Memory[name];
        }
    }

	let creep,
        unitFound,
        mySquad;
	const squads = MemoryLists.getSquads();
	for(const index in Memory.creeps) {
		creep = Game.creeps[index];

		//Garbage collection
		if(!creep){
			delete Memory.creeps[index];
			continue;
		}

        unitFound = false;
		for(const index in squads){
			mySquad = Object.keys(squads[index].squad);
			if(mySquad.indexOf(creep.name) >= 0){
				unitFound = true;
				break;
			}
		}
		if(!unitFound){
			mySquad = Squad.getParty(Memory.SQUADS[creep.room.name].WORKFORCE[creep.room.name+"_1"]);
            mySquad.addCreep({
                name: creep.name,
                role: creep.memory.role
            });
		}
	}

	//Manage Spawns
	let roomKey;
	let roomName;
	for( const name in Game.spawns ){
		console.log("Spawn",name);
		roomName = Game.spawns[name].room.name;
		roomKey = {
			roomName,
			level: MemoryLists.LEVEL.ROOM,
			type: MemoryLists.TYPES.WORKFORCE,
			groupName: roomName+"_1"
		};

		if(!MemoryLists.get(roomKey)){
			MemoryLists.add(Object.assign({}, roomKey, {
				squad: Squad.createParty({
					type: Squad.TYPES.WORKERS,
					props: {
						roomName,
						groupName: roomKey.groupName,
						groupType: roomKey.type,
					}
				})
			}));
		}
		SpawnManager.run( Game.spawns[name] );
	}

	//Manage Squads
	for(const index in squads){
		squads[index].delegateTasks();
	}
}

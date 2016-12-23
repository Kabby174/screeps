const roleHarvester = require('role.harvester');
const structureBase = require('structure.base');

let ROLE = {
    HARVESTER: {
        id: "HARVESTER",
        parts: [WORK,CARRY,MOVE,WORK,CARRY,CARRY,MOVE,MOVE],
        minParts: 3,
        min: 4,
        validStructs: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION]
    },
    MINER: {
        id: "MINER",
        parts: [WORK,CARRY,MOVE,WORK,CARRY,CARRY,MOVE,CARRY,MOVE,MOVE],
        minParts: 9,
        min: 6,
        validStructs: [STRUCTURE_CONTAINER]
    }
    //GOPHER
}

let STRUCTURES = {
    [STRUCTURE_EXTENSION]: 5
}

const homeName = "Skynet";

module.exports.loop = function () {
    const homeBase = Game.spawns[homeName];
    let unitCount = {}
    //Setup unit counting
    for(const role in ROLE) {
        let { id } = ROLE[ role ];
        unitCount[ id ] = 0;
    }
    //Set all creep actions
    let creep;
    for(const name in Memory.creeps) {
        creep = Game.creeps[name];
        //Garbage collection
        if(!creep){
            delete Memory.creeps[name];
            continue;
        }
        let { role } = creep.memory;
        switch(role){
            case ROLE.MINER.id:
            case ROLE.HARVESTER.id:
                unitCount[ role ]++;
                roleHarvester.run(creep, unitCount[ role ] % 2, ROLE[role].validStructs);
                break;
            default:
                creep.memory.role = ROLE.HARVESTER.id;
                roleHarvester.run(creep, unitCount[ role ] % 2, ROLE.HARVESTER.validStructs);
        }
    }
    //Build my bases
    for(const name in Game.spawns){
        structureBase.run( Game.spawns[name] );
    }

    //Report number of creeps and spawn more creeps
    let viable;
    for(const role in ROLE) {
        const { id, min, parts, minParts } = ROLE[ role ];
        const count = unitCount[ id ];
        if(count < min){
            viable = parts;
            while(homeBase.canCreateCreep(viable) != OK && viable.length > Math.min(minParts,parts.length)){
                viable = viable.slice(0, -1);
            }

            if(homeBase.canCreateCreep(viable) === OK){
                const newName = homeBase.createCreep(viable, undefined, {role: id});
                console.log("Spawning new "+id+": " + newName, viable,"["+viable.length+"]");
            }
        }
    }
}

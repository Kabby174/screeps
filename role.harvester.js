var roleHarvester = {
    test: "something",
    run: (creep, odd, validStructs) => {
        const { memory, carry, carryCapacity } = creep;
        //Gather
	    if(!creep.memory.busy && creep.carry.energy < creep.carryCapacity) {
            if(creep.memory.role == "HARVESTER"){
                //Pull from the containers first
                    const containers = creep.room.find(FIND_STRUCTURES,{
                        filter: structure => {
                            return structure.structureType == STRUCTURE_CONTAINER;
                        }
                    });
                    let node;
                    for(var ii = 0; ii < containers.length; ++ii){
                        node = containers[ii];
                        if(!node.store[RESOURCE_ENERGY]){
                            continue;
                        }else{
                            if(creep.withdraw(node,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(node);
                            }
                            return;
                        }
                    }
            }
	        //Pickup resources on the ground
	        const dropped = creep.room.find(FIND_DROPPED_RESOURCES)[0];
	        if(dropped && creep.pickup(dropped) == ERR_NOT_IN_RANGE) {
                creep.moveTo(dropped);
                return;
	        }
            const sources = creep.room.find(FIND_SOURCES);
            const node = sources[odd];
            if(node && creep.harvest(node) == ERR_NOT_IN_RANGE) {
                creep.moveTo(node);
            }
            // const sourceLocs = [];
            // let closestNode;

            // for(var ii in sources){
            //     dist = calcDist(sources[ii].pos, creep.pos);

            //     if(sources[ii.energy] == 0){
            //         console.log("Source",ii,"Empty");
            //     }
            //     if(sourceLocs[0] == null || sourceLocs[0].dist > dist){
            //         sourceLocs.unshift({
            //             node: sources[ii],
            //             dist,
            //             index: ii
            //         });
            //     }
            // }

            // for(var index in sourceLocs){
                // const { node } = sourceLocs[index];
                //Set the blocked node
                // if(creep.harvest(node) == ERR_NOT_IN_RANGE) {
                //     creep.moveTo(node);
                    // switch( creep.moveTo(node) ){
                    //     case OK:
                    //         return;
                    // }
                // }
            // }
        } else {
            //Work
            creep.memory.busy = true;
            if(creep.carry.energy == 0){
                creep.memory.busy = false;
                return;
            }

            if(creep.memory.role != "HARVESTER"){
                //Build
                const buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if(buildTargets.length){
                    const buildConst = buildTargets[0];
                    if(creep.build(buildConst) == ERR_NOT_IN_RANGE){
                        creep.moveTo(buildConst);
                    }
                    return;
                }
            }

            const transferTargets = creep.room.find(FIND_STRUCTURES,{
                filter: structure => {
                    return validStructs.indexOf(structure.structureType) >= 0;
                }
            });

            let target;
            //Transfer
            for(var ii = 0; ii < transferTargets.length; ++ii){
                if(creep.carry.energy == 0){
                    creep.memory.busy = false;
                    return;
                }
                target = transferTargets[ii];
                switch(target.structureType){
                    case STRUCTURE_CONTAINER:
                        if(target.hits < target.hitsMax){
                            switch(creep.repair(target)){
                                case ERR_NOT_IN_RANGE:
                                    creep.moveTo(target);
                                    return;
                            }
                        }else if(target.store[RESOURCE_ENERGY] < target.storeCapacity){
                            switch(creep.transfer(target, RESOURCE_ENERGY)){
                                case ERR_NOT_IN_RANGE:
                                    creep.moveTo(target);
                                    return;
                            }
                        }
                        break;
                    case STRUCTURE_EXTENSION:
                    case STRUCTURE_SPAWN:
                        if(target.energy < target.energyCapacity){
                            // creep.say(target.structureType);
                            switch(creep.transfer(target, RESOURCE_ENERGY)){
                                case ERR_NOT_IN_RANGE:
                                    creep.moveTo(target);
                                    return;
                            }
                        }
                        break;
                }
            }

            if(creep.carry.energy == 0){
                creep.memory.busy = false;
                return;
            }
            upgradeController(creep);
        }
	}
};
const upgradeController = creep => {
    //Upgrage controller
    const target = creep.room.find(FIND_STRUCTURES, {
        filter: structure => {
            return structure.structureType == STRUCTURE_CONTROLLER;
        }
    })[0];

    if(target && target.level < 8 && creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}
const calcDist = (posA, posB) => {
    return Math.sqrt(Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2));
}
module.exports = roleHarvester;

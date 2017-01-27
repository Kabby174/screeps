const { UNITS } = require('constants');
const TYPES = {
    WORKERS: "WORKERS",
    WARRIORS: "WARRIORS",
}
const ActionManager = require('action.manager');
const {
    ACTIONS: {
        MINING, TRANSFER, UPGRADE, BUILD, STORE, SCAVENGE, DROP, REPAIR, WITHDRAW,
        HARVEST,
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
class Party {
    //Party is a list of units that makes up this group
    //Squad is a list of units that exist
	constructor(props = {}) {
        this.partyList = props.partyList || [];
        this.squad = props.squad || {};
        this.type = props.type || null;
        this.groupName = props.groupName || null;
        this.groupType = props.groupType || null;
        this.misc = props.misc || {};
    }
    setParty(party){
        //Setup the party list
        const list = [];
        let obj;
        let count;
        for(let index in party){
            obj = party[index];
            switch( typeof(obj) ){
                case "object":
                    for(const key in obj){
                        count = obj[key];
                        for(let ii = 0; ii < count; ++ii){
                            list.push(key);
                        }
                    }
                    break;
                case "string":
                    list.push(obj);
                    break;
            }
            // console.log("Party Member", index, this.party[0], typeof(this.party[0]));
        }
        this.partyList = list;
    }
    getMissingUnits(){
        const needed = this.partyList.slice();
        let role,
            index;

        for(const name in this.squad){
            if(!Game.creeps[name]){
                delete this.squad[name];
                continue;
            }
            role = this.squad[name].role;
            index = needed.indexOf(role);
            if(index >= 0){
                needed.splice(index, 1);
            }
        }
        // if(this.roomName == "W4N3"){
        //     console.log();
        //     console.log(this.roomName, Object.keys(this.squad));
        //     console.log("Desired Party",this.partyList);
        //     console.log("Needed",needed, this.sourcePositions);
        // }
        return needed;
    }
    //Required props
    //name the unit name
    //role the unit's role
    addCreep(props){
        const { name, role } = props;
        this.squad[name] = {
            role
        };
    }
    removeCreep(name){
        delete this.squad[name];
    }
    delegateTasks(){}
    update(){
        Memory.SQUADS[ this.roomName ][ this.groupType ][ this.groupName ] = this;
    }
}
class Workers extends Party {
	constructor(props = {}) {
		super(props);

        this.type = TYPES.WORKERS;
        this.roomName = props.roomName;
        if(!this.roomName){
            return;
        }

        const room = Game.rooms[ this.roomName ];
    	const sources = room.find(FIND_SOURCES);
        this.sourcePositions = props.sourcePositions || this.getSourcePositions(room, sources);
        // for(const pos in this.sourcePositions){
        //     this.sourcePositions[pos].worker = null;
        // }
        this.misc.availableSpots = this.misc.availableSpots || this.sourcePositions.length;
        this.misc.additionalWorkers = (this.misc.additionalWorkers || 0) + this.checkSources(sources);

        this.setParty([
            // { [UNITS.WORKER]: this.misc.availableSpots + this.misc.additionalWorkers },
            { [UNITS.WORKER]: this.misc.availableSpots * 4 },
        ]);

        this.update();
        // this.addCreep({
        //     name: "Johnny",
        //     role: UNITS.WORKER
        // });
        // this.addCreep({
        //     name: "Julie",
        //     role: UNITS.WORKER
        // });
        // console.log("Party List", this.getParty());
        // console.log("Units in the squad", this.getUnitNames());
        // console.log("Missing Units", this.getMissingUnits());
    }
    checkSources(sources){
        let moreWorkers = 0;
        let s;
        for(const index in sources){
            s = sources[index];
            if(s.ticksToRegeneration < 10 && s.energy > 0){
                moreWorkers++;
            }
        }
        return moreWorkers;
        // console.log("Call for "+moreWorkers+" more workers ("+this.misc.additionalWorkers+")");
    }
    getSourcePositions(room, sources){
        const miningSpots = [];
        let spots;
        for(const index in sources){
            const {x,y} = sources[index].pos;
            spots = room.lookAtArea(y - 1, x - 1, y + 1, x + 1, true);
            spots.forEach( object => {
                if(object.type == "terrain" && (object.terrain == "plain" || object.terrain == "swamp")){
                    miningSpots.push({
                        id: sources[index].id,
                        pos: {
                            x: object.x,
                            y: object.y
                        }
                    });
                }
            });
        }
        return miningSpots;
    }
    attemptMining({creep, source}){
        // if(){
        //
        // }
        // console.log("My Creep",creep.name,sources.length);
    }
    getUnitsWithTask(task){

    }
    executeTask({creep, task, target, pos}){
        switch(creep[task](target)){
            case ERR_NOT_IN_RANGE:
                pos
                    ? creep.moveTo(pos.x, pos.y)
                    : creep.moveTo(target);
            case OK:
                return true;
        }
    }
    delegateTasks(){
        if(!this.roomName){
            return;
        }
        const room = Game.rooms[ this.roomName ];
        const sources = room.find(FIND_SOURCES, {
            filter: source => {
                return source.energy > 0;
            }
        });
        const droppedSources = room.find(FIND_DROPPED_RESOURCES);
        this.misc.tasks = this.misc.tasks || {};
        /*
            [MINING]: {
                a: "",
                b: "",
                c: ""
            },
            tasks {
                [SCAVENGE]:{

                },
                [UPGRADE]:{

                }
            }
        */
        // const dropped = {
        //     needed: droppedSources.length,
        //     assigned: this.misc.tasks.dropped || 0
        // }
        let creep;
        let index = 0;
        let source;
        let dropped;

        for(const name in this.squad){
            creep = Game.creeps[name];
            if(creep){
                // if(!creep.memory.busy && _.sum(creep.carry) < creep.carryCapacity){
                //         source = this.misc.availableSpots;
                //         this.attemptMining({ creep, source })
                // }


                //See if the creep is carrying anything
                // if(!creep.memory.busy && _.sum(creep.carry) < creep.carryCapacity){
                //     // //Handle dropped things
                //     // if(droppedSources.length){
                //     //     dropped = _.find();
                //     // }
                //
                //     // if(dropped.needed < dropped.assigned){
                //     //     console.log("Go get some resources");
                //     // }else{
                //     //
                //     // }
                //
                //     //Do mining
                //     source = _.find(this.sourcePositions, (obj) => {
                //         return obj.worker == creep.name;
                //     }) || _.find(this.sourcePositions, (obj) => {
                //         return !obj.worker;
                //     });
                //     if(source){
                //         if(this.executeTask({
                //             creep,
                //             task: "harvest",
                //             target: _.find(sources, {id: source.id}),
                //             // pos: source.pos
                //         })){
                //             source.worker = creep.name;
                //             continue;
                //         };
                //     }else{
                //         //Need to send idle workers somewhere
                //         // creep.moveTo(25,25);
                //     }
                // }else{
                //     //Clear the worker
                //     source = _.find(this.sourcePositions, (obj) => {
                //         return obj.worker == creep.name;
                //     });
                //     if(source){
                //         source.worker = null;
                //     }
                // }

                if(index >= 10 && index <= 11){
                    ActionManager.doTasks(creep, [HARVEST, STORE]);
                }else if(index > 11 && index <= 15){
                    //Dump any materials
                    if(!this.dumpCarriedMinerals(creep)){
                        ActionManager.doTasks(creep, [SCAVENGE, MINING, STORE]);
                    };
                }else{
                    //Dump any materials
                    if(!this.dumpCarriedMinerals(creep)){
                        switch(index % 3){
                            case 0:
                                ActionManager.doTasks(creep, [SCAVENGE, MINING, WITHDRAW, TRANSFER, UPGRADE]);
                                break;
                            case 1:
                                ActionManager.doTasks(creep, [SCAVENGE, WITHDRAW, MINING, UPGRADE]);
                                break;
                            case 2:
                                ActionManager.doTasks(creep, [SCAVENGE, WITHDRAW, MINING, BUILD, REPAIR, TRANSFER, UPGRADE]);
                                break;
                        }
                    };
                }
                // if(index < 2){
                //     ActionManager.doTasks(creep, [SCAVENGE, WITHDRAW, TRANSFER, UPGRADE]);
                // }else if(index < 6){
                //     ActionManager.doTasks(creep, [SCAVENGE, WITHDRAW, UPGRADE]);
                // }else{
                //     ActionManager.doTasks(creep, [SCAVENGE, WITHDRAW, TRANSFER, REPAIR, BUILD, UPGRADE]);
                // }
                index++;
            }else{
                source = _.find(this.sourcePositions, (obj) => {
                    return obj.worker == name;
                });
                if(source){
                    source.worker = null;
                }

            }
        }

        this.update();
    }
    dumpCarriedMinerals(creep) {
        for(let resource in creep.carry){
            if(resource != RESOURCE_ENERGY && creep.carry[resource]){
                ActionManager.doTasks(creep, [STORE]);
                return true;
            }
        }
    }
}
class Warriors extends Party {
	constructor(props = {}) {
		super(props);

        this.type = TYPES.WARRIORS;

        this.setParty([
            { [UNITS.PALADIN]: 2 },
            { [UNITS.FOOTMAN]: 2 },
            // { [UNITS.WORKER]: this.misc.availableSpots },
        ]);
    }
    delegateTasks(){
        for(const name in this.squad){
            creep = Game.creeps[name];
            if(creep){

            }
        }
    }
}
module.exports = {
    TYPES,
    createParty: ({ type, props = {} }) => {
        const { WORKERS, WARRIORS } = TYPES;
        let squad;
        switch(type){
            case WORKERS:
                return new Workers(props);
            case WARRIORS:
                return new Warriors(props);
        }
    },
    getParty: data => {
        const { WORKERS, WARRIORS } = TYPES;
        switch(data.type){
            case WORKERS:
                return new Workers(data);
            case WARRIORS:
                return new Warriors(data);
            default:
                return new Party(data);
        }
    }
};

const { UNITS, ACTIONS } = require('constants');
const TYPES = {
    WORKERS: "WORKERS",
    REMOTE_WORKERS: "REMOTE_WORKERS",
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
        this.update();
    }
    removeCreep(name){
        delete this.squad[name];
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
    delegateTasks(){}
    update(){
        Memory.SQUADS[ this.roomName || "EMPIRE" ][ this.groupType ][ this.groupName ] = this;
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

        this.rooms = this.rooms || {};
        this.addRoom({room, sources});

        this.setParty([
            { [UNITS.WORKER]: this.getRoom({roomName: this.roomName}).sourcePositions.length * 3},
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
    addRoom({roomName, room, sources, explorer}){
        const name = roomName || room.name;
        this.rooms[name] = this.rooms[name] || {
            sourcePositions: !sources ? null : this.getSourcePositions(room, sources),
            explorer
        };
    }
    getRoom({roomName}){
        return this.rooms[ roomName ];
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
    findRooms(creep){
        const exits = Game.map.describeExits( this.roomName );
        let foundNewRoom;
        for(var room in exits){
            if(Memory.roomsToExplore.indexOf(exits[room]) < 0 &&
                Memory.exploredRooms.indexOf(exits[room]) < 0){

                Memory.roomsToExplore.push( exits[room] );
                foundNewRoom = true;
            }
        }
    }
    findNewRoom(creep){
        console.log();
        console.log("Need a new source", creep.room.name);
        const roomIndex = Math.max(Object.keys(this.rooms).indexOf(creep.room.name), 0);
        let exitArray;
        let room;
        let roomName;
        // for(let ii = roomIndex; roomIndex)
        if(roomIndex == Object.keys(this.rooms).length - 1){
            console.log("Need to find a new room");
            exitArray = Game.map.describeExits( creep.room.name );
			for(const direction in exitArray){
                roomName = exitArray[direction];
                room = this.rooms[roomName];
                if(!room){
                    //Needs to be charted
                    console.log("Chart the room", roomName);
                    this.addRoom({
                        roomName,
                        explorer: creep.name
                    });
                    // if(!Memory.rooms[ roomName ]){
                    //     // Memory.rooms
                    // }
                }else if(room.sourcePositions){
                    //All the way handled
                    console.log("Room Handled", roomName);
                }else if(!room.explorer){
                    //Creep must explore room
                    console.log("Explore the room", roomName);
                }else{
                    //See if creep can go to this room
                    console.log("Heading to room", roomName);
                }
            }
        }else{
            console.log("See if another room is available");
        }
    }
    isExploringRoom({creep}){
        return _.find(this.rooms, obj => {
            if(obj.explorer && !this.squad[obj.explorer]){
                this.squad[obj.explorer] = null;
            }
            console.log("Obj", Object.keys(obj), obj.explorer, creep.name);
            return !obj.sourcePositions && obj.explorer && obj.explorer == creep.name
        });
    }
    getSourcesInRoom({creep}){
        const roomName = creep.room.name;
        return _.find(this.rooms[roomName].sourcePositions, obj => obj.worker == creep.name)
            || _.find(this.rooms[roomName].sourcePositions, obj => !obj.worker && Game.getObjectById(obj.id).energy > 0);
    }
    delegateTasks(){
        if(!this.roomName){
            return;
        }
        const room = Game.rooms[ this.roomName ];
        // const sources = room.find(FIND_SOURCES, {
        //     filter: source => {
        //         return source.energy > 0;
        //     }
        // });
        const droppedSources = room.find(FIND_DROPPED_RESOURCES);
        let creep;
        let index = 0;
        let source;
        let dropped;
        let exits;
        let clearRoom;

        //Clear old worker
        for(const name in this.rooms){
            clearRoom = this.rooms[name];
            for(const index in clearRoom.sourcePositions){
                source = clearRoom.sourcePositions[index];
                if(source.worker && !this.squad[source.worker]){
                    console.log("Clear old workers");
                    source.worker = null;
                }
            }
        }
        for(const name in this.squad){
            creep = Game.creeps[name];
            if(creep){
                //See if the creep is carrying anything
                if(this.roomName == "W7N3" && this.isExploringRoom({creep})){
                    console.log("Head to the room", creep.name);
                }else if(!creep.memory.busy && _.sum(creep.carry) < creep.carryCapacity){
                    //Check for dropped resources

                    //Go Mining
                    source = this.getSourcesInRoom({creep});
                    if(source){
                        if(this.executeTask({
                            creep,
                            task: "harvest",
                            target: Game.getObjectById(source.id),
                            pos: source.pos
                        })){
                            source.worker = creep.name;
                            continue;
                        }
                    }else{
                        if(this.roomName == "W7N3"){
                            this.findNewRoom(creep);
                        }
                    };
                }else{
                    source = this.getSourcesInRoom({creep});
                    if(source){
                        source.worker = null
                    }
                }
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

                if(creep.room.name != creep.memory.home){
                    ActionManager.doTasks(creep, [GO_HOME]);
                //     Gather exotic minerals
                //     ActionManager.doTasks(creep, [HARVEST, STORE]);
                //     //Dump any materials
                //     if(!this.dumpCarriedMinerals(creep)){
                //         ActionManager.doTasks(creep, [SCAVENGE, STORE]);
                //     };
                }else{
                    //Dump any materials
                    if(!this.dumpCarriedMinerals(creep)){
                        switch(index % 3){
                            case 0:
                                ActionManager.doTasks(creep, [SCAVENGE, WITHDRAW, TRANSFER, UPGRADE]);
                                break;
                            case 1:
                                ActionManager.doTasks(creep, [SCAVENGE, WITHDRAW, UPGRADE]);
                                break;
                            case 2:
                                ActionManager.doTasks(creep, [SCAVENGE, WITHDRAW, BUILD, REPAIR, TRANSFER, UPGRADE]);
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
        this.rally = "W5N3";
        this.killzone = "W5N4";
        this.mode = props.mode;
        this.modes = {
            RALLY: "RALLY",
            ATTACK: "ATTACK",
            RAID: "RAID",
        }

        this.setParty([
            // { [UNITS.PALADIN]: 0 },
            // { [UNITS.FOOTMAN]: 2 },
            // { [UNITS.WORKER]:  },
        ]);
    }
    gotoRoom(creep, destination){
		const {
			memory: { busy },
			pos: { x, y }
		} = creep;
		const carry = _.sum(creep.carry);


		if(creep.room.name != destination){
			creep.memory.busy = ACTIONS.GOTO_WORKSITE;
			const path = Game.map.findRoute(creep.room, destination);
			const exit = creep.pos.findClosestByRange( path[0].exit );
			creep.moveTo(exit);
			return true;
		}else if(creep.room.name == destination && busy == ACTIONS.GOTO_RALLY){
			if(x == 0 || y == 0 || x == 49 || y == 49){
				creep.moveTo(25, 25);
				return true;
			}else{
				creep.memory.busy = false;
				creep.cancelOrder('moveTo');
			}
		}
    }
    delegateTasks(){
        let creep;
        let rallyPoint;
        let enemy;
        let readyUnits = 0;
        // console.log(Object.keys(this.squad));
        this.mode = "RALLY"//"ATTACK";//this.mode || this.modes.RALLY;
        // console.log("Ready mode",this.mode);
        let injured = [];
        for(const name in this.squad){
            creep = Game.creeps[name];
            if(creep){
                if(creep.hits < creep.hitsMax){
                    injured.push(creep);
                }
            }
        }
        for(const name in this.squad){
            creep = Game.creeps[name];
            if(creep){
                switch(this.mode){
                    case this.modes.RALLY:
                        if(creep.room.name != this.rally){
                            this.gotoRoom(creep, this.rally);
                        }else{
                            readyUnits++;
                            // console.log("Ready",readyUnits,"/",Object.keys(this.squad).length);
                            if(readyUnits == Object.keys(this.squad).length){
                                // console.log("Launch an attack");
                                this.mode = "ATTACK";
                            }
                            if(!rallyPoint){
                                rallyPoint = creep.room.find(FIND_STRUCTURES, {
                                    filter: structure => {
                                        return structure.structureType == STRUCTURE_SPAWN;
                                    }
                                })[0];
                            }
                            creep.moveTo(rallyPoint);
                            // console.log("Rally ",rallyPoint);
                            // rallyPoint.renewCreep(creep);
                            // console.log("Renew",rallyPoint.renewCreep(creep));
                        }
                        break;
                case this.modes.ATTACK:
                    if(creep.room.name != this.killzone){
                        this.gotoRoom(creep, this.killzone);
                    }else{
                        if(!enemy){
                            enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS
                            //     , {
                            //     filter: function(object) {
                            //         return object.getActiveBodyparts(ATTACK) == 0;
                            //     }
                            // }
                            );
                        }
                        if(injured.length > 0){
                            console.log("heal");
                            creep.heal(injured[0]);
                        }
                        if(this.executeTask({
                            creep,
                            task: "attack",
                            target: enemy
                            // pos: source.pos
                        })){
                            // source.worker = creep.name;
                            // continue;
                        };
                    }
                };
            }
        }
        this.update();
    }
}
class RemoteWorkers extends Party {
	constructor(props = {}) {
		super(props);

        this.type = TYPES.REMOTE_WORKERS;
        this.roomName = props.roomName;
        this.worksite = props.worksite;

        // console.log("Remote Workers");
        this.setParty([
            { [UNITS.WORKER]: 6 },
            { [UNITS.SETTLER]: 2 },
        ]);
    }
    delegateTasks(){
        let creep,
            rallyPoint;

        // console.log("Remote", this.roomName, this.worksite);
        for(const name in this.squad){
            creep = Game.creeps[name];
            if(creep){
                creep.memory.destination = this.worksite;
                switch(creep.memory.role){
                    case UNITS.WORKER:
                        ActionManager.doTasks(creep, [FIND_MINING_SITE, SCAVENGE, MINING, BUILD, GO_HOME, STORE, TRANSFER])
                        break;
                    case UNITS.SETTLER:
                        // ActionManager.doTasks(creep, [SETTLE]);
                        break;
                }
            }
        }
    }
}
module.exports = {
    TYPES,
    createParty: ({ type, props = {} }) => {
        const { WORKERS, WARRIORS, REMOTE_WORKERS} = TYPES;
        switch(type){
            case WORKERS:
                return new Workers(props);
            case WARRIORS:
                return new Warriors(props);
            case REMOTE_WORKERS:
                return new RemoteWorkers(props);
        }
    },
    getParty: props => {
        const { WORKERS, WARRIORS, REMOTE_WORKERS} = TYPES;
        switch(props.type){
            case WORKERS:
                return new Workers(props);
            case WARRIORS:
                return new Warriors(props);
            case REMOTE_WORKERS:
                return new RemoteWorkers(props);
            default:
                return new Party(props);
        }
    }
};

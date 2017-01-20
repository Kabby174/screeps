const { UNITS } = require('constants');
const TYPES = {
    WORKERS: "WORKERS",
}
const ActionManager = require('action.manager');
const {
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
class Party {
    //Party is a list of units that makes up this group
    //Squad is a list of units that exist
	constructor(props = {}) {
        this.partyList = props.partyList || [];
        this.squad = props.squad || {};
        this.type = props.type || null;
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
        const needed = this.partyList.splice(0);
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
}
class Workers extends Party {
	constructor(props = {}) {
		super(props);

        this.type = TYPES.WORKERS;
        this.roomName = props.roomName;
        this.sourcePositions = props.sourcePositions || this.getSourcePositions();
        this.setParty([
            { [UNITS.WORKER]: props.sources || 4 },
        ]);
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
    getSourcePositions(){
        // const room = Game.rooms[roomName];
        // sources.forEach( mine => {
        //     const {x,y} = mine.pos;
        //     const spots = room.lookAtArea(y - 1, x - 1, y + 1, x + 1, true);
        //
        //     spots.forEach( object => {
        //         if(object.type == "terrain" && (object.terrain == "plain" || object.terrain == "swamp")){
        //             spotCount++;
        //         }
        //     });
        // });
        // console.log("Find source Positions");
    }
    delegateTasks(){
        let creep;
        for(const name in this.squad){
            creep = Game.creeps[name];
            if(creep){
                ActionManager.doTasks(creep, [SCAVENGE, MINING, WITHDRAW, TRANSFER, UPGRADE]);
            }
        }
    }
}
module.exports = {
    TYPES,
    createParty: ({ type, props = {} }) => {
        const { WORKERS } = TYPES;
        let squad;
        switch(type){
            case WORKERS:
                return new Workers(props);
        }
    },
    getParty: data => {
        const { WORKERS } = TYPES;
        switch(data.type){
            case WORKERS:
                return new Workers(data);
            default:
                return new Party(data);
        }
    }
};

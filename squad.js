const { UNITS } = require('constants');
const TYPES = {
    WORKERS: "WORKERS",
}
class Party {
    //Party is a list of units that makes up this group
    //Squad is a list of units that exist
	constructor(props) {
        this.partyList = [];
        this.squad = {};
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
}
class Workers extends Party {
	constructor(props) {
		super(props);

        this.setParty([
            { [UNITS.WORKER]: 4 },
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
}
module.exports = {
    TYPES,
    createParty: type => {
        const { WORKERS } = TYPES;
        switch(type){
            case WORKERS:
                return new Workers();
        }
    }
};

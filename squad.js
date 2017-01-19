const { UNITS } = require('constants');
const TYPES = {
    WORKERS: "WORKERS",
}
class Party {
	constructor(props) {
        console.log("Constructor", props);
        this.party = [];
    }
    setParty(party){
        this.party = party;
    }
    getParty(){
        return this.party;
    }
    getPartyList(){
        const list = [];
        let obj;
        for(let index in this.party){
            obj = this.party[0];
            switch( typeof(obj) ){
                case "object":
                    console.log("Handle Object");
                    break;
                case "string":
                    break;
            }
            // console.log("Party Member", index, this.party[0], typeof(this.party[0]));
        }
        return list;
    }
}
class Workers extends Party {
	constructor(props) {
		super(props);

        console.log();
        this.setParty([
            { [UNITS.WORKER]: 4 }
        ]);
        console.log("Party List", this.getPartyList());
    }
}
const HATCHERY = {
    // party: [
    	// { UNITS.WORKER: 4 },
    // ];
}
const OUTPOST = {

}
const SQUAD = {

}
module.exports = {
    TYPES,
    createParty: type => {
        const { WORKERS } = TYPES;
        switch(type){
            case WORKERS:
                return new Workers();
                break;
        }
    }
};

const Squad = require('squad');
const TYPES = {
    WORKFORCE: "WORKFORCE",
    WARBAND: "WARBAND",
}
const LEVEL = {
    ROOM: "ROOM",
    EMPIRE: "EMPIRE",
}

const initList = ({ level, roomName, type, groupName }) => {
    const group = !level || level == LEVEL.ROOM ? roomName : LEVEL.EMPIRE;
    Memory.SQUADS = Memory.SQUADS || {};
    Memory.SQUADS[group] = Memory.SQUADS[group] || {};

    if(type){
        Memory.SQUADS[group][type] = Memory.SQUADS[group][type] || {};
    }
    if(groupName){
        Memory.SQUADS[group][type][groupName] = Memory.SQUADS[group][type][groupName] || {};
    }

    return Memory.SQUADS[group];
}
module.exports = {
    TYPES,
    LEVEL,
    get: (obj) => {
        if(obj.type && obj.groupName){
            return initList(obj)[ obj.type ][ obj.groupName ];
        }else if(obj.type){
            return initList(obj)[ obj.type ];
        }else{
            return initList(obj);
        }
    },
    add: obj => {
        initList(obj)[ obj.type ][ obj.groupName ] = obj.squad;
    },
    getSquads: () => {
        Memory.SQUADS = Memory.SQUADS || {};
        const squadList = [];
        let squadsInRoom,
            groupsInRoom,
            mySquad,
            myGroups;

        for(const room in Memory.SQUADS){
            groupsInRoom = Memory.SQUADS[room];
            for(const groupName in groupsInRoom){
                myGroups = groupsInRoom[groupName];
                for(const name in myGroups){
                    mySquad = myGroups[name];
                    squadList.push(Squad.getParty(mySquad));
                }
            }
        }
        return squadList;
    }
};

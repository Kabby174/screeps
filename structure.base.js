/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('structure.base');
 * mod.thing == 'a thing'; // true
 */

var structureBase = {

    run: spawn => {

        //Setup extensions
        let { x, y } = spawn.pos;
        const structPos = [
            {
                x: x-1,
                y: y-1
            },
            {
                x: x,
                y: y+1
            },
            {
                x: x+1,
                y: y-1
            },
            {
                x: x-1,
                y: y+1
            },
            {
                x: x+1,
                y: y+1
            },
        ];
        let constPos;
        let buildTarget;
        for(var index in structPos){
            constPos = structPos[index];
            buildTarget =
                spawn.room.lookForAt(LOOK_CONSTRUCTION_SITES, constPos.x, constPos.y) ||
                spawn.room.lookForAt(LOOK_STRUCTURES, constPos.x, constPos.y);
            if(!buildTarget.length){
                spawn.room.createConstructionSite(constPos.x, constPos.y, STRUCTURE_EXTENSION);
            }
        }
    }
};

module.exports = structureBase;

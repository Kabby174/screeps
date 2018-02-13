module.exports.loop = () => {

    let creep;

    //Garbage collect creeps
    for(const creepIndex in Memory.creeps) {
        creep = Game.creeps[creepIndex];

        if(!creep){
            garbageCollect(creepIndex);
            continue;
        }
    }

    let roomName;
    for(const spawnName in Game.spawns){
        spawnCreep({
            spawner: Game.spawns[spawnName]
        });
    }
}
const garbageCollect = (creepIndex) => {
    delete Memory.creeps[creepIndex];
}
const spawnCreep = ({ spawner }) => {
    const parts = [WORK, CARRY, MOVE];
    const id = Math.floor(Math.random() * 1000);
    const name = `Jerry${id}`;
    console.log('Spawn', spawner.spawnCreep(parts, name, { dryRun: true }) );
    
    switch(spawner.spawnCreep(parts, name, { dryRun: true })) {
        case OK:
            spawner.spawnCreep(parts, name);
            break;
    }
};
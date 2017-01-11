const structureWhiteList = [
	STRUCTURE_SPAWN,
	STRUCTURE_TERMINAL,
	STRUCTURE_CONTAINER,
	STRUCTURE_STORAGE
]
const isBuiltStructure = structure => {
	return structureWhiteList.indexOf(structure.structureType) >= 0;
}
const isSpawn = structure => {
	return structure.structureType == STRUCTURE_SPAWN;
}
const isTerminal = structure => {
	return structure.structureType == STRUCTURE_TERMINAL;
}
const isContainer = structure => {
	return structure.structureType == STRUCTURE_CONTAINER;
}
const isStorage = structure => {
	return structure.structureType == STRUCTURE_STORAGE;
}
const isEnemy = structure => {
	return structure.structureType != STRUCTURE_KEEPER_LAIR;;
}

const minStructureHealth = 10000;
const creepDamagedStructureWhitelist = [
	STRUCTURE_CONTAINER, STRUCTURE_ROAD, STRUCTURE_STORAGE, STRUCTURE_TOWER,
	STRUCTURE_LINK, STRUCTURE_EXTRACTOR, STRUCTURE_TERMINAL,
	STRUCTURE_WALL, STRUCTURE_RAMPART
];
const isCreepDamagedStructure = structure => {
	if(creepDamagedStructureWhitelist.indexOf(structure.structureType) >= 0){
		switch(structure.structureType){
			case STRUCTURE_WALL:
			case STRUCTURE_RAMPART:
				return structure.hits < minStructureHealth;
			default:
				return structure.hits < structure.hitsMax;
		}
	}
}
const towerDamagedStructureWhitelist = [
	STRUCTURE_TOWER, STRUCTURE_WALL, STRUCTURE_RAMPART
];
const isTowerDamagedStructure = structure => {
	if(towerDamagedStructureWhitelist.indexOf(structure.structureType) >= 0){
		switch(structure.structureType){
			case STRUCTURE_WALL:
			case STRUCTURE_RAMPART:
				return structure.hits < minStructureHealth;
			default:
				return structure.hits < structure.hitsMax;
		}
	}
}
const countUnitsByType = role => {
	return _.filter(Game.creeps, creep => {
		return creep.memory.role == role;
	}).length;
}
const getUnitsWithDestination = (dest, role) => {
	return _.filter(Game.creeps, creep => {
		return creep.memory.role == role && 
			creep.memory.destination == dest;
	}).length;
}

const UTILS = {
	isBuiltStructure,
	isSpawn,
	isTerminal,
	isContainer,
	isStorage,
	isEnemy,
	isTowerDamagedStructure,
	isCreepDamagedStructure,
	countUnitsByType,
	getUnitsWithDestination
}

module.exports = UTILS;

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

const UTILS = {
	isBuiltStructure,
	isSpawn,
	isTerminal,
	isContainer,
	isStorage,
}

module.exports = UTILS;

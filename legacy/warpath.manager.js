const {
	isBuiltStructure,
	isSpawn,
	isTerminal,
	isContainer,
	isStorage,
	isEnemy,
	countUnitsByType,
	getUnitsWithDestination,
} = require("utils");
const { UNITS } = require('constants');
const ActionManager = require('action.manager');
const UnitManager = require('units.manager');

const minParties = 1;
const raidingParty = [
	UNITS.FOOTMAN,
	UNITS.PALADIN,
	UNITS.RIFLEMAN
];

const unitsInSquad = squadNumber => {
	const units = [];
	for(const name in Game.creeps){
		const { memory: { role, squad }} = Game.creeps[name];
		if(squad == squadNumber){
			units.push( role );
		}
	}
	return units;
}
const getUnitsToSpawn = (need, have) => {
	const missingUnits = [ ...need ];
	let unitIndex;
	for(const index in have){
		unitIndex = missingUnits.indexOf(have[index]);

		if(unitIndex >= 0){
			missingUnits.splice(unitIndex, 1);
		}
	}
	return missingUnits;
}
const countEnlisted = list => {
	let requiredUnits = {};
	let role;
	for(const index in list){
		role = list[index];
		// console.log("Rolez: ", role, index);
		if(!requiredUnits[role]){
			requiredUnits[role] = 1;
		}else{
			requiredUnits[role]++;
		}
	}
	return requiredUnits;
};
const WarPath = {
	rally: flag => {
		Memory.squads = Memory.squads || [];
		Memory.military = Memory.military || [];
		let needMore = {};
		let neededUnits = [];
		// let role;

		for(let ii = 0; ii < minParties; ++ii){
			if(!Memory.squads[ii]){
				Memory.squads.push({});
			}

			// neededUnits = getUnitsToSpawn(raidingParty, unitsInSquad(ii));
			// needMore = countEnlisted(neededUnits);
			for(const unitIndex in neededUnits){
				// role = neededUnits[unitIndex];
				// console.log("Drafted", drafted[role]);
				// console.log("Needed", neededUnits[role]);
			}
		}
	},
	ready: () => {

	},
	assault: () => {

	},
}

module.exports = WarPath;

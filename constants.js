const UNITS = {
	DEFAULT: "DEFAULT",
	HARVESTER: "HARVESTER",
	ORE_HARVESTER: "ORE_HARVESTER",

	BUILDER: "BUILDER",
	REMOTE_BUILDER: "REMOTE_BUILDER",

	MINER: "MINER",
	REMOTE_MINER: "REMOTE_MINER",

	SETTLER: "SETTLER",
	RUNNER: "RUNNER",
	EXPLORER: "EXPLORER",

	BOWMAN: "BOWMAN",
	RAIDER: "RAIDER",

	MEDIC: "MEDIC",
	MERCHANT: "MERCHANT",
	SCIENTIST: "SCIENTIST",
};
const ACTIONS = {
	MINING: "MINING",
	TRANSFER: "TRANSFER",
	UPGRADE: "UPGRADE",
	BUILD: "BUILD",
	STORE: "STORE",
	SCAVENGE: "SCAVENGE",
	DROP: "DROP",
	REPAIR: "REPAIR",
	WITHDRAW: "WITHDRAW",
	SETTLE: "SETTLE",
	DROP_OFF: "DROP_OFF",

	FIND_MINING_SITE: "FIND_MINING_SITE",

	GOTO_BATTLEZONE: "GOTO_BATTLEZONE",
	HUNT: "HUNT",

	GO_HOME: "GO_HOME",

	EXPLORE: "EXPLORE",

	ADD_ROAD: "ADD_ROAD",
	CALL_WORKER: "CALL_WORKER",
	CALL_HELP: "CALL_HELP",

	GOTO_WORKSITE: "GOTO_WORKSITE",
	PARTY_UP: "PARTY_UP",
	HEALUP: "HEALUP",
	HEALING: "HEALING",
	PASS: "PASS",

	SEND_LINK: "SEND_LINK",
	GET_LINK: "GET_LINK",

	HARVEST: "HARVEST",
	TRADE_TERMINAL: "TRADE_TERMINAL",
	GET_TERMINAL: "GET_TERMINAL",
};

const Constants = {
	UNITS,
	ACTIONS,
}
module.exports = Constants;
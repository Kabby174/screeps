const TYPES = {
    PARTY: "PARTY"
}

class MemoryList {

}
module.exports = {
    TYPES,
    getList: type => {
        console.log("List", type);
    },
    add: (listKey, object) => {
        console.log("List", listKey, object);
    }
};

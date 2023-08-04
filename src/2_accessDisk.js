// retrieve room by its ID
// string -> room
let getRoom = (id) => disk.rooms.find(room => room.id === id);

// get a list of all characters in the passed room
// string -> characters
let getCharactersInRoom = (roomId) => disk.characters.filter(c => c.roomId === roomId);

// get a character by name from a list of characters
// string, characters -> character
let getCharacter = (name, chars = disk.characters) => chars.find(char => objectHasName(char, name));

// get item by name from room with ID
// string, string -> item
let getItemInRoom = (itemName, roomId) => {
  const room = getRoom(roomId);

  return room.items && room.items.find(item => objectHasName(item, itemName))
};

// get item by name from inventory
// string -> item
let getItemInInventory = (name) => disk.inventory.find(item => objectHasName(item, name));

// get item by name
// string -> item
let getItem = (name) => getItemInInventory(name) || getItemInRoom(name, disk.roomId)

// find the exit with the passed direction in the given list
// string, array -> exit
let getExit = (dir, exits) => exits.find(exit =>
    Array.isArray(exit.dir)
      ? exit.dir.includes(dir)
      : exit.dir === dir
);

// retrieves a keyword from a topic
// topic -> string
let getKeywordFromTopic = (topic) => {
if (topic.keyword) {
    return topic.keyword;
}

// find the keyword in the option (the word in all caps)
const keyword = removeExtraSpaces(removePunctuation(topic.option))
    // separate words by spaces
    .split(' ')
    // find the word that is in uppercase
    // (must be at least 2 characters long)
    .find(w => w.length > 1 && w.toUpperCase() === w)
    .toLowerCase();

return keyword;
};
 
// determine whether the passed conversation includes a topic with the passed keyword
// conversation, string -> boolean
let conversationIncludesTopic = (conversation, keyword) => {
// NOTHING is always an option
if (keyword === 'nothing') {
    return true;
}

if (Array.isArray(disk.conversation)) {
    return disk.conversation.find(t => getKeywordFromTopic(t) === keyword);
}

return disk.conversation[keyword];
};
  
// determine whether the passed topic is available for discussion
// character, topic -> boolean
let topicIsAvailable = (character, topic) => {
// topic has no prerequisites, or its prerequisites have been met
const prereqsOk = !topic.prereqs || topic.prereqs.every(keyword => character.chatLog.includes(keyword));
// topic is not removed after read, or it hasn't been read yet
const readOk = !topic.removeOnRead || !character.chatLog.includes(getKeywordFromTopic(topic));

return prereqsOk && readOk;
};

// end the current conversation
let endConversation = () => {
disk.conversant = undefined;
disk.conversation = undefined;
};

// -- helpers

// determine whether the object has the passed name
// item | character, string -> bool
let objectHasName = (obj, name) => {
    const compareNames = n => n.toLowerCase().includes(name.toLowerCase());
  
    return Array.isArray(obj.name)
      ? obj.name.find(compareNames)
      : compareNames(obj.name);
}

// key is the main name - 0 index name - for an item or char
function getKey(itemObj){
    const keyVal = itemObj['name'] || itemObj['dir']
    const key = typeof keyVal === 'object' ? keyVal[0] : keyVal
    return key
}

const context = {
    avaiableItems:() =>  getRoom(disk.roomId).items.concat(disk.inventory).filter(i => !i.isHidden),
    currRoom: () => getRoom(disk.roomId),
    avaiableChars:() => getCharactersInRoom(disk.roomId)
  }
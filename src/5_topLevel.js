// add any default values to the disk
// disk -> disk
let init = (disk) => {
const initializedDisk = Object.assign({}, disk);
initializedDisk.rooms = disk.rooms.map((room) => {
    // number of times a room has been visited
    room.visits = 0;
    return room;
});

if (!initializedDisk.inventory) {
    initializedDisk.inventory = [];
}

if (!initializedDisk.characters) {
    initializedDisk.characters = [];
}

initializedDisk.characters = initializedDisk.characters.map(char => {
    // player's conversation history with this character
    char.chatLog = [];
    return char;
});

return initializedDisk;
};

// register listeners for input events
let setup = () => {
input.addEventListener('keypress', (e) => {
    const ENTER = 13;

    if (e.keyCode === ENTER) {
    applyInput();
    }
});

input.addEventListener('keydown', (e) => {
    input.focus();

    const UP = 38;
    const DOWN = 40;
    const TAB = 9;

    if (e.keyCode === UP) {
    navigateHistory('prev');
    } else if (e.keyCode === DOWN) {
    navigateHistory('next');
    } else if (e.keyCode === TAB) {
    e.stopPropagation();
    e.preventDefault()
    autocomplete();
    }
});

input.addEventListener('focusout', () => {
    input.focus({preventScroll: true});
});
};

// load the passed disk and start the game
// disk -> nothing
let loadDisk = (uninitializedDisk) => {
    if (uninitializedDisk) {
      diskFactory = uninitializedDisk;
      // start listening for user input
      setup();
    }
  
    // initialize the disk
    // (although we expect the disk to be a factory function, we still support the old object format)
    disk = init(typeof diskFactory === 'function' ? diskFactory() : diskFactory);
  
    // start the game
    // getPrompt("getUsername").run()
    enterRoom(disk.roomId);
  
    // focus on the inputte
    input.focus();
  };

requestAnimationFrame(print);

// npm support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = loadDisk;
}
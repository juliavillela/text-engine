// global properties, assigned with let for easy overriding by the user
let diskFactory;
let disk;

// store user input history
let inputs = [];
let inputsPos = 0;

// define list style
let bullet = '•';

// queue output for improved performance
let printQueue = [];

// reference to the input element
let input = document.querySelector('#input');

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

// store player input history
// (optionally accepts a name for the save)
let save = (name = 'save') => {
  localStorage.setItem(name, JSON.stringify(inputs));
  const line = name.length ? `Game saved as "${name}".` : `Game saved.`;
  println(line);
};

// reapply inputs from saved game
// (optionally accepts a name for the save)
let load = (name = 'save') => {
  let save = localStorage.getItem(name);

  if (!save) {
    println(`Save file not found.`);
    return;
  }

  // if the disk provided is an object rather than a factory function, the game state must be reset by reloading
  if (typeof diskFactory !== 'function' && inputs.length) {
    println(`You cannot load this disk in the middle of the game. Please reload the browser, then run the **LOAD** command again.`);
    return;
  }

  inputs = [];
  inputsPos = 0;
  loadDisk();

  applyInputs(save);

  const line = name.length ? `Game "${name}" was loaded.` : `Game loaded.`;
  println(line);
};

// export current game to disk (optionally accepts a filename)
let exportSave = (name) => {
  const filename = `${name.length ? name : 'text-engine-save'}.txt`;
  saveFile(JSON.stringify(inputs), filename);
  println(`Game exported to "${filename}".`);
};

// import a previously exported game from disk
let importSave = () => {
  // if the disk provided is an object rather than a factory function, the game state must be reset by reloading
  if (typeof diskFactory !== 'function' && inputs.length) {
    println(`You cannot load this disk in the middle of the game. Please reload the browser, then run the **LOAD** command again.`);
    return;
  }

  const input = openFile();
  input.onchange = () => {
    const fr = new FileReader();
    const file = input.files[0];

    // register file loaded callback
    fr.onload = () => {
      // load the game
      inputs = [];
      inputsPos = 0;
      loadDisk();
      applyInputs(fr.result);
      println(`Game "${file.name}" was loaded.`);
      input.remove();
    };

    // register error handling
    fr.onerror = (event) => {
      println(`An error occured loading ${file.name}. See console for more information.`);
      console.error(`Reader error: ${fr.error}
        Reader error event: ${event}`);
      input.remove();
    };

    // attempt to load the text from the selected file
    fr.readAsText(file);
  };
};

// saves text from memory to disk
let saveFile = (content, filename) => {
  const a = document.createElement('a');
  const file = new Blob([content], {type: 'text/plain'});

  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();

  URL.revokeObjectURL(a.href);
};

// creates input element to open file prompt (allows user to load exported game from disk)
let openFile = () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.click();

  return input;
};

// applies string representing an array of input strings (used for loading saved games)
let applyInputs = (string) => {
  let ins = [];

  try {
    ins = JSON.parse(string);
  } catch(err) {
    println(`An error occurred. See error console for more details.`);
    console.error(`An error occurred while attempting to parse text-engine inputs.
      Inputs: ${string}
      Error: ${err}`);
    return;
  }

  while (ins.length) {
    applyInput(ins.shift());
  }
};


// retrieve user input (remove whitespace at beginning or end)
// nothing -> string
let getInput = () => input.value.trim();


// allows wrapping text in special characters so println can convert them to HTML tags
// string, string, string -> string
let addStyleTags = (str, char, tagName) => {
  let odd = true;
  while (str.includes(char)) {
    const tag = odd ? `<${tagName}>` : `</${tagName}>`;
    str = str.replace(char, tag);
    odd = !odd;
  }

  return str;
};

// overwrite user input
// string -> nothing
let setInput = (str) => {
  input.value = str;
  // on the next frame, move the cursor to the end of the line
  setTimeout(() => {
    input.selectionStart = input.selectionEnd = input.value.length;
  });
};

// render output, with optional class
// (string | array | fn -> string) -> nothing
let println = (line, className) => {
  // bail if string is null or undefined
  if (!line) {
    return;
  }

  let str =
    // if this is an array of lines, pick one at random
    Array.isArray(line) ? pickOne(line)
    // if this is a method returning a string, evaluate it
    : typeof line  === 'function' ? line()
    // otherwise, line should be a string
    : line;

  const output = document.querySelector('#output');
  const newLine = document.createElement('div');

  if (className) {
    newLine.classList.add(className);
  }

  // add a class for styling prior user input
  if (line[0] === '>') {
    newLine.classList.add('user');
  }

  // support for markdown-like bold, italic, underline & strikethrough tags
  if (className !== 'img') {
    str = addStyleTags(str, '__', 'u');
    str = addStyleTags(str, '**', 'b');
    str = addStyleTags(str, '*', 'i');
    str = addStyleTags(str, '~~', 'strike');
  }

  // maintain line breaks
  while (str.includes('\n')) {
    str = str.replace('\n', '<br>');
  }

  newLine.innerHTML = str;

  // push into the queue to print to the DOM
  printQueue.push(newLine);
};

// predict what the user is trying to type
let autocomplete = () => {
  const room = getRoom(disk.roomId);
  const words = input.value.toLowerCase().trim().split(/\s+/);
  const wordsSansStub = words.slice(0, words.length - 1);
  const itemNames = (room.items || []).concat(disk.inventory).map(item => item.name);

  const stub = words[words.length - 1];
  let options;

  if (words.length === 1) {
    // get the list of options from the commands array
    // (exclude one-character commands from auto-completion)
    const allCommands = commands
      .reduce((acc, cur) => acc.concat(Object.keys(cur)), [])
      .filter(cmd => cmd.length > 1);

    options = [...new Set(allCommands)];
    if (disk.conversation) {
      options = Array.isArray(disk.conversation)
        ? options.concat(disk.conversation.map(getKeywordFromTopic))
        : Object.keys(disk.conversation);
      options.push('nothing');
    }
  } else if (words.length === 2) {
    const optionMap = {
      talk: ['to', 'about'],
      take: itemNames,
      use: itemNames,
      go: (room.exits || []).map(exit => exit.dir),
      look: ['at'],
    };
    options = optionMap[words[0]];
  } else if (words.length === 3) {
    const characterNames = (getCharactersInRoom(room.id) || []).map(character => character.name);
    const optionMap = {
      to: characterNames,
      at: characterNames.concat(itemNames),
    };
    options = (optionMap[words[1]] || []).flat().map(string => string.toLowerCase());
  }

  const stubRegex = new RegExp(`^${stub}`);
  const matches = (options || []).flat().filter(option => option.match(stubRegex));

  if (!matches.length) {
    return;
  }

  if (matches.length > 1) {
    const longestCommonStartingSubstring = (arr1) => {
      const arr = arr1.concat().sort();
      const a1 = arr[0];
      const a2 = arr[arr.length-1];
      const L = a1.length;
      let i = 0;
      while (i < L && a1.charAt(i) === a2.charAt(i)) {
        i++;
      }
      return a1.substring(0, i);
    };

    input.value = [...wordsSansStub,longestCommonStartingSubstring(matches)].join(' ');
  } else {
    input.value = [...wordsSansStub, matches[0]].join(' ');
  }
};

// select previously entered commands
// string -> nothing
let navigateHistory = (dir) => {
  if (dir === 'prev') {
    inputsPos--;
    if (inputsPos < 0) {
      inputsPos = 0;
    }
  } else if (dir === 'next') {
    inputsPos++;
    if (inputsPos > inputs.length) {
      inputsPos = inputs.length;
    }
  }

  setInput(inputs[inputsPos] || '');
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
  enterRoom(disk.roomId);

  // focus on the input
  input.focus();
};

// append any pending lines to the DOM each frame
let print = () => {
  if (printQueue.length) {
    while (printQueue.length) {
      output.appendChild(printQueue.shift());
    }

    // scroll to the most recent output at the bottom of the page
    window.scrollTo(0, document.body.scrollHeight);
  }

  requestAnimationFrame(print);
}

requestAnimationFrame(print);

// npm support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = loadDisk;
}

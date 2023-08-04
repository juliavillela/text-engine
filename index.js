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

//groups all literal outputs by function and usecase
// the intent of this is to facilitate translating the game engine into other languages
let lit_s= original_literal_values

// context data - is updated on command call
//items avaiable to user
const context = {
  avaiableItems:() =>  getRoom(disk.roomId).items.concat(disk.inventory).filter(i => !i.isHidden),
  currRoom: () => getRoom(disk.roomId),
  avaiableChars:() => getCharactersInRoom(disk.roomId)
}

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
  const line = lit_s.save.success(name)
  println(line);
};

// reapply inputs from saved game
// (optionally accepts a name for the save)
let load = (name = 'save') => {
  let save = localStorage.getItem(name);

  if (!save) {
    println(lit_s.load.notFound());
    return;
  }

  // if the disk provided is an object rather than a factory function, the game state must be reset by reloading
  if (typeof diskFactory !== 'function' && inputs.length) {
    println(lit_s.load.error());
    return;
  }

  inputs = [];
  inputsPos = 0;
  loadDisk();

  applyInputs(save);

  const line = lit_s.load.success(name);
  println(line);
};

// export current game to disk (optionally accepts a filename)
let exportSave = (name) => {
  const filename = `${name.length ? name : 'text-engine-save'}.txt`;
  saveFile(JSON.stringify(inputs), filename);
  println(lit_s.exportSave.success(name));
};

// import a previously exported game from disk
let importSave = () => {
  // if the disk provided is an object rather than a factory function, the game state must be reset by reloading
  if (typeof diskFactory !== 'function' && inputs.length) {
    println(lit_s.importSave.error());
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
      println(lit_s.importSave.loadSuccess(file.name));
      input.remove();
    };

    // register error handling
    fr.onerror = (event) => {
      println(lit_s.load.loadError(file.name));
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
    println(lit_s.applyInputs.error());
    console.error(`An error occurred while attempting to parse text-engine inputs.
      Inputs: ${string}
      Error: ${err}`);
    return;
  }

  while (ins.length) {
    applyInput(ins.shift());
  }
};

// list player inventory
let inv = () => {
  const items = disk.inventory.filter(item => !item.isHidden);

  if (!items.length) {
    println(lit_s.inv.noItems());
    return;
  }

  println(lit_s.inv.items());
  items.forEach(item => {
    println(`${bullet} ${getName(item.name)}`);
  });
};

function genericLook(data){
  //interpret data - obj =  what/who is looked at
  const room = context.currRoom()
  const at_item = data.item || false
  const at_char = data.char || false
  let obj = at_item || at_char
  // checks if obj can be room - if not: prints failure fallback
  if(!at_item && !at_char && data.leftOver){
    // check if leftover is about room
    let room_name = data.leftOver.search(tokenize(room.name))
    let room_lit = data.leftOver.search("room")
    if (room_name == -1 && room_lit == -1){
      println(`no such thing here!`)
      return
    } 
  }
  obj = obj || room
  // get response
  // priority: onLook method; print description, print fallback
  let response;
  let fallback = ['nothing special', 'nothing interesting']
  // if function: execute function then print
  if (obj["onLook"] && typeof obj["onLook"] === 'function'){
    obj["onLook"]({disk, println, room, getRoom, enterRoom, obj})
    response = obj["desc"] || fallback
  } else {
    // if string, print str
    response = obj["onLook"] || obj["desc"] || fallback
  }
  println(response)
}

function genericList(data){
  // list exits
  // list items in room
  // list items in inventory

}

// // list available exits
// let go = () => {
//   const room = getRoom(disk.roomId);
//   const exits = room.exits.filter(exit => !exit.isHidden);

//   if (!exits) {
//     println(lit_s.go.noExits());
//     return;
//   }

//   println(lit_s.go.exits());
//   exits.forEach((exit) => {
//     const rm = getRoom(exit.id);

//     if (!rm) {
//       return;
//     }

//     const dir = getName(exit.dir).toUpperCase();
//     // include room name if player has been there before
//     const directionName = rm.visits > 0
//       ? `${dir} - ${rm.name}`
//       : dir

//     println(`${bullet} ${directionName}`);
//   });
// };

// find the exit with the passed direction in the given list
// string, array -> exit
let getExit = (dir, exits) => exits.find(exit =>
  Array.isArray(exit.dir)
    ? exit.dir.includes(dir)
    : exit.dir === dir
);

function genericGo(data){
  // tokenize exits
  const room = context.currRoom()
  let exit;
  for(let e of room.exits){
      console.log('exit: ', e)
      const dirStrs = typeof e.dir === 'object'? e.dir : [e.dir]
      let exitRoom = getRoom(e.id)
      console.log('exit to room:', exitRoom)
      let roomStrs = exitRoom["name"]
      if (typeof roomStrs === 'string') { roomStrs = [roomStrs]}
      const exitStrs = dirStrs.concat(roomStrs)
      const token = tokenize(exitStrs)

      if (data.str.search(token) !== -1){
          exit = e
      }
  }
  if(exit){
      // exit has no room id
      const nextRoomId = exit.id
      if(!nextRoomId){
        console.debug("generic take: case exit found; no next room")
          println(`this leads nowhere`)
      } else if (exit.block){
        console.debug("generic take: case exit found: blocked")
          println(exit.block)
      } else {
        console.debug("generic take: case exit found moved to next room:", exit.id)
          enterRoom(exit.id)
      }
      return;
  } else {
      const curRoom = tokenize(room.name)
      if (data.str.search(curRoom) !== -1){
        println(`you are already in ${getName(room.name)}`)
      } else if (data.item){
        println(`you are now very close to ${getName(data.item.name)}`)
      } else{
        println(`you cant go there TBD make this better`)
        return
      }
  }
}

// if there is one character in the room, engage that character in conversation
// otherwise, list characters in the room
let talk = () => {
  const characters = getCharactersInRoom(disk.roomId);

  // assume players wants to talk to the only character in the room
  if (characters.length === 1) {
    talkToOrAboutX('to', getName(characters[0].name));
    return;
  }

  // list characters in the room
  println(lit_s.talk.info());
  chars();
};

// speak to someone or about some topic
// string, string -> nothing
let talkToOrAboutX = (preposition, x) => {
  const room = getRoom(disk.roomId);

  if (preposition !== 'to' && preposition !== 'about') {
    println(lit_s.talkToOrAboutX.info());
    return;
  }

  const character =
    preposition === 'to' && getCharacter(x, getCharactersInRoom(room.id))
      ? getCharacter(x, getCharactersInRoom(room.id))
      : disk.conversant;
  let topics;

  // give the player a list of topics to choose from for the character
  const listTopics = () => {
    // capture reference to the current conversation
    disk.conversation = topics;

    if (topics.length) {
      const availableTopics = topics.filter(topic => topicIsAvailable(character, topic));

      if (availableTopics.length) {
        println(lit_s.talkToOrAboutX.topics());
        availableTopics.forEach(topic => println(`${bullet} ${topic.option ? topic.option : topic.keyword.toUpperCase()}`));
        println(`${bullet} ${lit_s.talkToOrAboutX.nothing()}`);
      } else {
        // if character isn't handling onTalk, let the player know they are out of topics
        if (!character.onTalk) {
          println(lit_s.talkToOrAboutX.nothingToSay(getName(character.name)));
        }
        endConversation();
      }
    } else if (Object.keys(topics).length) {
      println(lit_s.talkToOrAboutX.responses());
      Object.keys(topics).forEach(topic => println(`${bullet} ${topics[topic].option}`));
    } else {
      endConversation();
    }
  };

  if (preposition === 'to') {
    if (!getCharacter(x)) {
      println(lit_s.talkToOrAboutX.charNotfound());
      return;
    }

    if (!getCharacter(getName(x), getCharactersInRoom(room.id))) {
      println(lit_s.talkToOrAboutX.charNotfound());
      return;
    }

    if (!character.topics) {
      println(lit_s.talkToOrAboutX.nothingToSay(getName(character.name)));
      return;
    }

    if (typeof(character.topics) === 'string') {
      println(character.topics);
      return;
    }

    if (typeof(character.onTalk) === 'function') {
      character.onTalk({disk, println, getRoom, enterRoom, room, character});
    }

    topics = typeof character.topics === 'function'
      ? character.topics({println, room})
      : character.topics;

    if (!topics.length && !Object.keys(topics).length) {
      println(lit_s.talkToOrAboutX.nothingToSay(getName(character.name)));
      return;
    }

    // initialize the chat log if there isn't one yet
    character.chatLog = character.chatLog || [];
    disk.conversant = character;
    listTopics(topics);
  } else if (preposition === 'about') {
    if (!disk.conversant) {
      println(lit_s.talkToOrAboutX.noConversation());
      return;
    }
    const character = eval(disk.conversant);
    if (getCharactersInRoom(room.id).includes(disk.conversant)) {
      const response = x.toLowerCase();
      if (response === 'nothing') {
        endConversation();
        println(lit_s.talkToOrAboutX.endConversation());
      } else if (disk.conversation && disk.conversation[response]) {
        disk.conversation[response].onSelected();
      } else {
        const topic = disk.conversation.length && conversationIncludesTopic(disk.conversation, response);
        const isAvailable = topic && topicIsAvailable(character, topic);
        if (isAvailable) {
          if (topic.line) {
            println(topic.line);
          }
          if (topic.onSelected) {
            topic.onSelected({disk, println, getRoom, enterRoom, room, character});
          }
          // add the topic to the log
          character.chatLog.push(getKeywordFromTopic(topic));
        } else {
          println(lit_s.talkToOrAboutX.talkabout(removePunctuation(x)));
          println(lit_s.talkToOrAboutX.topicHelp());
        }
      }

      // continue the conversation.
      if (disk.conversation) {
        topics = typeof character.topics === 'function'
          ? character.topics({println, room})
          : character.topics;
        listTopics(character);
      }
    } else {
      println(lit_s.talkToOrAboutX.charNotAvaiable());
      disk.conversant = undefined;
      disk.conversation = undefined;
    }
  }
};

function genericTake(data){
  const room = context.currRoom()
  console.log(room)
  const item = data.item
  // no item:
  if(!item){
      if(!data.leftOver){
        println(`what do you want to ${data.str}?`)
      } else if(data.char){
          println(`that's rude. ${getName(data.char.name)} is not a thing you can take!`)
      } else{
        println("you can't collect something that is not here.")
      }
      console.debug("generic take: case no item")
      return
  }
  // already taken
  if(getItemInInventory(getKey(item))){
      println("you already have it!")
      console.debug("generic take: case item in inventory")

      return
  }
  
  let response = `you cannot take that`
  const takeable = item.isTakeable && !item.block
  if (takeable){
      const itemKey = getKey(item)  
      room.items = room.items.filter((i) => {return getKey(i) !== itemKey})
      disk.inventory.push(item)
      response = `${getName(item.name)} is now in your inventory`
      console.debug("generic take: case item is takable")
  }
  // an item can have an on_take function either way so:
  if (item.onTake && typeof item.onTake === 'function'){
      item.onTake({disk, println, room, getRoom, enterRoom, item})
      console.debug("generic take: case item is not takable, but has onTake function")
  } else {
      response = item.onTake || item.block || response
      println(response)
      console.debug("generic take: case item is not takable")
  }
  console.debug("generic take: case not caugth")
}

// list useable items in room and inventory
let use = () => {
  const room = getRoom(disk.roomId);

  const useableItems = (room.items || [])
    .concat(disk.inventory)
    .filter(item => item.onUse && !item.isHidden);

  if (!useableItems.length) {
    println(lit_s.use.noItems());
    return;
  }

  println(lit_s.use.items());
  useableItems.forEach((item) => {
    println(`${bullet} ${getName(item.name)}`)
  });
};

// use the item with the given name
// string -> nothing
let useItem = (itemName) => {
  const item = getItemInInventory(itemName) || getItemInRoom(itemName, disk.roomId);

  if (!item) {
    println(lit_s.useItem.itemNotFound());
    return;
  }

  if (item.use) {
    console.warn(`Warning: The "use" property for Items has been renamed to "onUse" and support for "use" has been deprecated in text-engine 2.0. Please update your disk, renaming any "use" methods to be called "onUse" instead.`);

    item.onUse = item.use;
  }

  if (!item.onUse) {
    println(lit_s.useItem.noUse());
    return;
  }

  // use item and give it a reference to the game
  if (typeof item.onUse === 'string') {
    const use = eval(item.onUse);
    use({disk, println, getRoom, enterRoom, item});
  } else if (typeof item.onUse === 'function') {
    item.onUse({disk, println, getRoom, enterRoom, item});
  }
};

// list items in room
let items = () => {
  const room = getRoom(disk.roomId);
  const items = (room.items || []).filter(item => !item.isHidden);

  if (!items.length) {
    println(lit_s.items.noItems());
    return;
  }

  println(lit_s.items.items());
  items
    .forEach(item => println(`${bullet} ${getName(item.name)}`));
}

// list characters in room
let chars = () => {
  const room = getRoom(disk.roomId);
  const chars = getCharactersInRoom(room.id).filter(char => !char.isHidden)

  if (!chars.length) {
    println(lit_s.chars.noChars());
    return;
  }

  println(lit_s.chars.chars());
  chars
    .forEach(char => println(`${bullet} ${getName(char.name)}`));
};

// display help menu
let help = () => {
  println(lit_s.help());
};

// handle say command with no args
let say = () => println(lit_s.say());

// say the passed string
// string -> nothing
let sayString = (str) => println(lit_s.sayString(removePunctuation(str)));

// retrieve user input (remove whitespace at beginning or end)
// nothing -> string
let getInput = () => input.value.trim();

// objects with methods for handling commands
// the array should be ordered by increasing number of accepted parameters
// e.g. index 0 means no parameters ("help"), index 1 means 1 parameter ("go north"), etc.
// the methods should be named after the command (the first argument, e.g. "help" or "go")
// any command accepting multiple parameters should take in a single array of parameters
// if the user has entered more arguments than the highest number you've defined here, we'll use the last set
let commands = [
  // no arguments (e.g. "help", "chars", "inv")
  {
    inv,
    i: inv, // shortcut for inventory
    inventory: inv,
    talk,
    t: talk, // shortcut for talk
    items,
    use,
    chars,
    characters: chars,
    help,
    say,
    save,
    load,
    restore: load,
    export: exportSave,
    import: importSave,
  },
  // one argument (e.g. "go north", "take book")
  {
    use: useItem,
    say: sayString,
    save: x => save(x),
    load: x => load(x),
    restore: x => load(x),
    // x: x => lookAt([null, x]), // IF standard shortcut for look at
    t: x => talkToOrAboutX('to', x), // IF standard shortcut for talk
    export: exportSave,
    import: importSave, // (ignores the argument)
  },
  // two+ arguments (e.g. "look at key", "talk to mary")
  {
    say(args) {
      const str = args.reduce((cur, acc) => cur + ' ' + acc, '');
      sayString(str);
    },
    talk: args => talkToOrAboutX(args[0], args[1]),
    // x: args => lookAt([null, ...args]),
  },
];

let activeCommands = [
  // [help, ["help"]],
  // [save, ["save"]],
  // [load, ["load"]],
  // [exportSave, ["export"]],
  // [importSave, ["import"]],

  [genericGo, ["go", "walk", "head north", "head south", "head west", "head east"]],
  // [inv, ["inventory", "inv"]],
  [genericLook, ["take a look", "have a look", "look around", "look"]],
  // [talk, ["talk", "say", "mumble", "yell"]],
  [genericTake, ["get", "collect", "take"]],
  // [use, ["use"]],
] 

//--- tokenizing
/** returs a token that matches globaly
 * @param {String|Array<String>} strs 
 * @returns {RegExp}
 */
function tokenize(name){
  let ts;
  if (typeof name === "string"){
    ts = "\\bTK\\b".replace("TK", name)
  } else {
    ts = name.map(s=> "\\bTK\\b".replace("TK", s))
    ts = ts.join("|")
  }
  return RegExp(ts, "gi")
}

// key is the main name - 0 index name - for an item or char
function getKey(itemObj){
  const keyVal = itemObj['name'] || itemObj['dir']
  const key = typeof keyVal === 'object' ? keyVal[0] : keyVal
  return key
}

let tknCmds = activeCommands.map(cmd => {return [cmd[0], tokenize(cmd[1])]})

// process user input & update game state (bulk of the engine)
// accepts optional string input; otherwise grabs it from the input element
let applyInput = (input) => {
  let isNotSaveLoad = (cmd) => !cmd.toLowerCase().startsWith('save')
    && !cmd.toLowerCase().startsWith('load')
    && !cmd.toLowerCase().startsWith('export')
    && !cmd.toLowerCase().startsWith('import');

  input = input || getInput();

  if (context.prompt){
    inputs.push("$prompt:"+context.prompt+input)
  } else {
    inputs.push(input);
  }

  inputs = inputs.filter(isNotSaveLoad);
  inputsPos = inputs.length;
  println(`> ${input}`);
  
  let regexApply = (input) => {
    function parseInput(input, cmdTokens){

      const str = input.toLowerCase()
      const matches = {str: str}
      //find command
      for(let cmd of cmdTokens){
          const m = str.match(cmd[1])
          if(m){
              matches.command = cmd[0]
              const leftOver = str.replace(m[0], "")
              matches.leftOver = leftOver.length? leftOver : null
              break
          }
      }
      if (!matches.leftOver){
          delete matches.leftOver
          return matches
      }
  
      function firstMatch(str, opts){
          for (let o of opts){
            const m = str.search(o[1])
            if (m != -1){
              return o[0]
            }
          }
          return null
        }
      // get current context
      const tknItems = context.avaiableItems().map(item => [item, tokenize(item.name)])
      const tknChars = context.avaiableChars().map(char => [char, tokenize(char.name)])
  
      matches.item = firstMatch(str, tknItems)
      matches.char = firstMatch(str, tknChars)
      return matches
    }
    const matchedValues = parseInput(input, tknCmds)
    console.debug("matched values for input:", matchedValues)
    
    if(context.prompt){
      console.log(context.prompt)
      let p = getPrompt(context.prompt)
      console.log("propmt", p)
      p["exec"](matchedValues)
      return true
    }

    if(matchedValues.command){
      matchedValues.command(matchedValues)
      return true
    }
    return false
  }
  let originalApply = (input) => {
    const val = input.toLowerCase();
    setInput(''); // reset input field

  const exec = (cmd, arg) => {
    if (cmd) {
      cmd(arg);
    } else if (disk.conversation) {
      println(lit_s.applyInput.conversation());
    } else {
      println(lit_s.applyInput.fallback());
    }
  };

  let values = val.split(' ')

  // remove articles
  // (except for the say command, which prints back what the user said)
  // (and except for meta commands to allow save names such as 'a')
  if (values[0] !== 'say' && isNotSaveLoad(values[0])) {
    values = values.filter(arg => arg !== 'a' && arg !== 'an' && arg != 'the');
  }

  const [command, ...args] = values;
  const room = getRoom(disk.roomId);

  if (args.length === 1) {
    exec(commands[1][command], args[0]);
  } else if (command === 'use' && args.length) {
    // support for using items with spaces in the names
    // (just tries to match on the first word)
    useItem(args[0]);
  } else if (args.length >= commands.length) {
    exec(commands[commands.length - 1][command], args);
  } else if (room.exits && getExit(command, room.exits)) {
    // handle shorthand direction command, e.g. "EAST" instead of "GO EAST"
    goDir(command);
  } else if (disk.conversation && (disk.conversation[command] || conversationIncludesTopic(disk.conversation, command))) {
    talkToOrAboutX('about', command);
  } else {
    exec(commands[args.length][command], args);
  }
  }
  const tryRegex = regexApply(input)
    if (!tryRegex){
        originalApply(input)
    }
    setInput(''); // reset input field
};

const prompts = [
  {
    id: "getUsername",
    run: () => {
      context.prompt = "getUsername"
      println("How should i call you?")
    },
    exec: (data) => {
      context.username = data.str
      println(`ok, ${context.username}. nice to meet you.`)
      delete context.prompt
    }
  }
]

let getPrompt = promptId => prompts.find(p=> p.id === promptId)

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

// get random array element
// array -> any
let pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

// return the first name if it's an array, or the only name
// string | array -> string
let getName = name => typeof name === 'object' ? name[0] : name;

// retrieve room by its ID
// string -> room
let getRoom = (id) => disk.rooms.find(room => room.id === id);

// remove punctuation marks from a string
// string -> string
let removePunctuation = str => str.replace(/[.,\/#?!$%\^&\*;:{}=\_`~()]/g,"");

// remove extra whitespace from a string
// string -> string
let removeExtraSpaces = str => str.replace(/\s{2,}/g," ");

// move the player into room with passed ID
// string -> nothing
let enterRoom = (id) => {
  const room = getRoom(id);

  if (!room) {
    println(lit_s.enterRoom.noRoom());
    return;
  }

  println(room.img, 'img');
  // prints room name with title.
  if (room.name) {
    println(`${getName(room.name)}`, 'room-name');
  }

  let onEnterLine = ""
  //add support for enterFrom 
  if (room.enterFrom){ 
    if(Object.hasOwn(room.enterFrom, disk.roomId)){
      onEnterLine = room.enterFrom[disk.roomId]
    } else {
    if (room.visits === 0) {
      onEnterLine = room.desc;
      }
    }
  }
  println(onEnterLine)
  room.visits++;

  disk.roomId = id;

  if (typeof room.onEnter === 'function') {
    room.onEnter({disk, println, getRoom, enterRoom});
  }

  // reset any active conversation
  delete disk.conversation;
  delete disk.conversant;
};

// determine whether the object has the passed name
// item | character, string -> bool
let objectHasName = (obj, name) => {
  const compareNames = n => n.toLowerCase().includes(name.toLowerCase());

  return Array.isArray(obj.name)
    ? obj.name.find(compareNames)
    : compareNames(obj.name);
}

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

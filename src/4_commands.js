//must come after index.js, ui, and litS

//---- COMMANDS -----

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
};

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


//--- helpers

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

// ---- ENGINE

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

let commands = [
  // no arguments (e.g. "help", "chars", "inv")
  {
    inv,
    talk,
    items,
    use,
    chars,
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

let tknCmds = activeCommands.map(cmd => {return [cmd[0], tokenize(cmd[1])]})

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
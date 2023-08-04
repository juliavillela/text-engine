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
//groups all literal outputs by function and usecase
// the intent of this is to facilitate translating the game engine into other languages
const original_literal_values = {
    save: {
      success: name => name.length ? `Game saved as "${name}".` : `Game saved.`,
    },
    load:{
      notFound: () => `Save file not found.`,
      error: () => `You cannot load this disk in the middle of the game. Please reload the browser, then run the **LOAD** command again.`,
      success: (name) => name.length ? `Game "${name}" was loaded.` : `Game loaded.`
    },
    exportSave:{
        success: filename=> `Game exported to "${filename}".`,
    },
    importSave:{
        error: () => `You cannot load this disk in the middle of the game. Please reload the browser, then run the **LOAD** command again.`,
        loadSuccess: filename => `Game "${file.name}" was loaded.`,
  
        loadError: filename => `An error occured loading ${file.name}. See console for more information.`,
    },
    applyInputs: {
        error: () => `An error occurred. See error console for more details.`,
    },
    inv: {
        noItems: () => `You don't have any items in your inventory.`,
        items: () => `You have the following items in your inventory:`,
    },
    lookThusly: str => `You look ${str}.`,
    lookAt: {
      itemfallback: () => `You don\'t notice anything remarkable about it.`,
      charfallback: () => `You don't notice anything remarkable about them.`,
      fallback: () => `You don't see any such thing.`,
    },
    go: {
      noExits: () => `There's nowhere to go.`,
      exits: () => `Where would you like to go? Available directions are:`
    },
    goDir: {
      noExits: () => lit_s.go.noExits(),
      noExitInDir: () => `There is no exit in that direction.`,
    },
    talk: {
      info: () => `You can talk TO someone or ABOUT some topic.`,
    },
    talkToOrAboutX: {
      info: () => lit_s.talk.info(),
      topics: () => `What would you like to discuss?`,
      nothing: () => `NOTHING`,
      nothingToSay: (character_name) => `You have nothing to discuss with ${character_name} at this time.`,
      responses: () => `Select a response:`,
      charNotfound: () => `There is no one here by that name.`,
      noConversation: () => `You need to be in a conversation to talk about something.`,
      endConversation:() => `You end the conversation.`,
      talkabout: (x) => `You talk about ${x}.`,
      topicHelp: () => `Type the capitalized KEYWORD to select a topic.`,
      charNotAvaiable: () => `That person is no longer available for conversation.`
    },
    take: {
      noItems: () => `There's nothing to take.`,
      items: () => `The following items can be taken:`,
    },
    takeItem: {
      success: itemName => `You took the ${itemName}.`,
      failure: () => `You can't take that.`,
      itemNotFound: () => `You don't see any such thing.`,
      taken: () => `You already have that.`
    },
    use: {
      noItems: () => `There's nothing to use.`,
      items: () => `The following items can be used:`,
    },
    useItem: {
      itemNotFound: () => `You don't have that.`,
      noUse: () => `That item doesn't have a use.`
    },
    items: {
      noItems: () => `There's nothing here.`,
      items: () => `You see the following:`,
    },
    chars: {
      noChars: () => `There's no one here.`,
      chars: () => lit_s.items.items()
    },
    help: () => `The following commands are available:
    LOOK:           'look at key'
    TAKE:           'take book'
    GO:             'go north'
    USE:            'use door'
    TALK:           'talk to mary'
    ITEMS:          list items in the room
    CHARS:          list characters in the room
    INV:            list inventory items
    SAVE/LOAD:      save current game, or load a saved game (in memory)
    IMPORT/EXPORT:  save current game, or load a saved game (on disk)
    HELP:   this help menu
  `,
    say: () => [`Say what?`, `You don't say.`],
  
    sayString: cleanString => `You say ${cleanString}.`,
  
    applyInput: {
      conversation: () => lit_s.talkToOrAboutX.topicHelp(),
      fallback:() => `Sorry, I didn't understand your input. For a list of available commands, type HELP.`,
    },
    enterRoom: {
      noRoom: `That exit doesn't seem to go anywhere.`
    }
}
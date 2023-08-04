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

// retrieve user input (remove whitespace at beginning or end)
// nothing -> string
let getInput = () => input.value.trim();

// overwrite user input
// string -> nothing
let setInput = (str) => {
    input.value = str;
    // on the next frame, move the cursor to the end of the line
    setTimeout(() => {
      input.selectionStart = input.selectionEnd = input.value.length;
    });
  };

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

// get random array element
// array -> any
let pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

// remove punctuation marks from a string
// string -> string
let removePunctuation = str => str.replace(/[.,\/#?!$%\^&\*;:{}=\_`~()]/g,"");

// remove extra whitespace from a string
// string -> string
let removeExtraSpaces = str => str.replace(/\s{2,}/g," ");

// return the first name if it's an array, or the only name
// string | array -> string
let getName = name => typeof name === 'object' ? name[0] : name;

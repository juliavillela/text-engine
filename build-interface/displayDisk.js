var container = document.querySelector("#disk-display")


const roomWrapper = (room) =>{
    const wrapper = collapsableItem(room.id, "room")
    delete room.id

    const room_name = document.createElement("h3")
    room_name.innerText = room.name
    wrapper.appendChild(room_name)
    delete room.name

    //add description
    wrapper.appendChild(textBlock(room.desc, "desc"))
    delete room.desc

    const commands = cmdsAndProperties(room)
    wrapper.appendChild(commands)

    // handle exits
    if(Object.hasOwn(room, "exits")){
        const exits_wrapper = textBlock("", "exits")
        const exits = room.exits.map((exit) => {return `<b>${exit.dir}: </b> <span>${exit.id}</span>`})
        exits_wrapper.innerHTML = exits.join(" | ")
        wrapper.appendChild(exits_wrapper)
        delete room.exits
    }

    wrapper.appendChild(document.createElement('hr'))

    //handle items
    if(Object.hasOwn(room, "items")){
        for (let item of room.items){
            wrapper.appendChild(ItemsWrapper(item))    
        }
        delete room.items
    }
    // left over keys can be properties or commands
    // for(let k of Object.keys(room)){
    //     if (k.startsWith("on")){
    //         let value
    //         if(typeof room[k] === 'function'){
    //             value = "function"
    //         }
    //         else{
    //             value = room[k]
    //         }
    //         wrapper.appendChild(textBlock(`${k}: ${value}`, "command"))
    //     }
    //     else{
    //         wrapper.appendChild(textBlock(`${k}: ${value}`, "property"))
    //     }
    // }
    
    return wrapper
}

const ItemsWrapper = (item) => {
    const wrapper = collapsableItem(item.name, "item")
    delete item.name
    wrapper.appendChild(textBlock(item.desc, "desc"))
    delete item.desc
    const commands = cmdsAndProperties(item)
    wrapper.appendChild(commands)
    return wrapper
}

const property_form = (initial_data={}) =>{
    const options = ["isTakeble", "block"]
    const block_formset =  `<label> block </label> <input id="block-propery-value" type=text value=>`
    const key_input = `<label> property key </label> <input type=text>`
    const value_input = `<label> value </label> <input type=text>`

}

/**
 * 
 * @param {Object} diskComponent - room or item - should be called after other attrs have been deleted
 * @returns {HTMLUListElement}
 */
const cmdsAndProperties = (diskComponent) => {
    const wrapper = document.createElement('ul')
    const ignore = ["name", "id", "exits", "items", "desc"]
    for(let k of Object.keys(diskComponent)){
        if (!ignore.includes(k)){
            const value = handleValueDataType(diskComponent[k])
            const li = document.createElement('li')
            if(k.startsWith("on")){ li.className = "command"} else {li.className = "property"}
            li.innerHTML = `<b>${k}: </b> ${value}`
            wrapper.appendChild(li)
        }
    }
    return wrapper
}


function handleValueDataType(key_value){
    let value = hadleFunctionValue(key_value)
    if (typeof value === 'string'){
        return value
    }
    value = handleNestedObject(value)
    return value
}

/** helper for values that can be string or function
 * @param {Object} key_value 
 * @returns actual value or literal "function"
 */
function hadleFunctionValue(key_value){
    let value;
    if(typeof key_value === 'function'){
        value = "function"
    }
    else{
        value = key_value
    }
    return value
}

function handleNestedObject(key_value){
    console.log("nested obj: ", key_value)
    let value = ""
    for (let k of Object.keys(key_value)){
        value += `<li><b>${k}:</b> ${key_value[k]}</li>`
    }
    return value
}

/** Retuns HTMLdetail with title as summary
 * @param {String} title 
 * @param {String} addClass - optional classname for details
 * @returns {HTMLDetailsElement}
 */
const collapsableItem = (title, addClass) => {
    const wrapper = document.createElement('details')
    if(addClass){wrapper.className = addClass}
    wrapper.innerHTML = `<summary>${title}</summary>`
    return wrapper
}

/** retuns div with htmlcontent text and classname
 * @param {String} text - assigneg through innerHTML
 * @param {String} cls - optinal Element classname
 * @returns {HTMLDivElement}
 */
const textBlock = (text, cls) => {
    const wrapper = document.createElement("div")
    wrapper.innerHTML = text
    if(cls){wrapper.className = cls}
    return wrapper
}

//--- FORM STUFF
const forms_container = document.querySelector("#disk-forms")

function displayForms(){
    const exit_block_field = inputField("block-property", "block", "text", "if a block string is assigned, the exit cannot be used directly and this string will be printed to the user instead")
    forms_container.appendChild(exit_block_field)
    const desc_field = inputField("desc-property", "desc", "text", "a string descrbing item or room. called when room onenter and room/item on_look")
    forms_container.appendChild(desc_field)
}

const inputField = (fieldId, label, inputType="text", helptext="") => {
    const wrapper = document.createElement('div')
    const inner = ` <label for="${fieldId}" class="form-label">${label}</label>
    <input type="${inputType}" class="form-control" id="${fieldId}" aria-describedby="${fieldId}-help">
    <div id="${fieldId}-help" class="form-text">${helptext}</div>`
    wrapper.innerHTML = inner
    return wrapper
}


function displayDisk(disk){
    console.log(disk)
    container.innerHTML = ""
    const gameSum = `starting room: ${disk.roomId} | room count: ${disk.rooms.length}`
    container.appendChild(textBlock(gameSum))
    for(let room of disk.rooms){
        const room_wrapper = roomWrapper(room)
        container.appendChild(room_wrapper)
    }
}

const discoverDisk = () => ({
    roomId: "start",
    rooms:[
        {
            id: "start",
            name: ["somewhere"],
            desc: `somewhere... what do you see?`,
            default_desc: `somewhere... what do you see?`,
            items: [
                {
                    name:["glass container", "container", "jar"],
                    desc: `a glass container that kind of looks like an empty jam jar with a tightly closed lid
                    inside the jar you can seen tiny bits os light flying around. 
                    they would look like bugs, but you can't see any bug-bodies. just spots of light
                    `
                }
            ],
            exits: [
                {
                  dir: 'south', // "dir" can be anything. If it's north, the player will type "go north" to get to the room called "A Forest Clearing".
                  id: 'cubicle',
                },
              ],

        },
        
        {
            id:"cubicle",
            name: ["tiny room"],
            desc: "an unconfortably small room.",
            items: [
              {
                name: ["paper", "note"]
              }
            ],
            exits: [
                {
                  dir: 'north', // "dir" can be anything. If it's north, the player will type "go north" to get to the room called "A Forest Clearing".
                  id: 'start',
                },
              ],
        }
    ]
})



;(async (dependencies) => {
    // Load up easy to use dependency wasm parsers
    for (let src of dependencies) {
        const script = document.head.appendChild(document.createElement('script'));
        script.src = src;

        await new Promise((res, rej) => {
            script.onload = res;
            script.onerror = rej;
        });
    };

    // Constant search patterns - expected instructions and a final testing function which returns false if incorrect, and otherwise it returns the wanted value.
    const SEARCHES = {
        tankCount: [OP_CALL, OP_CALL, OP_I32_CONST, OP_I32_LOAD, OP_I32_REM_U, OP_GET_LOCAL, OP_I32_XOR, (instructions, index) => instructions[index - 4].immediates[0]],
        root: [OP_BLOCK, OP_I32_CONST, OP_I32_LOAD8_U, OP_I32_CONST, OP_I32_AND, OP_BR_IF, OP_I32_CONST, OP_CALL, OP_I32_EQZ, OP_BR_IF, OP_I32_CONST, (instructions, index, func) => instructions.length === 37 && instructions[index].immediates[0]],
        end: [OP_BLOCK, OP_I32_CONST, OP_I32_LOAD8_U, OP_I32_CONST, OP_I32_AND, OP_BR_IF, OP_I32_CONST, OP_CALL, OP_I32_EQZ, OP_BR_IF, OP_I32_CONST, OP_I64_CONST, OP_I64_STORE, OP_I32_CONST, (instructions, index, func) => instructions.length === 37 && instructions[index].immediates[0]]
    };

    // Converts wasm Code Section bytes to a list of easy to handle instructions
    function* instructionGen(bytes) {
        let disassembler = new Disassembler(bytes);
        let instruction = disassembler.disassembleInstruction();
        while (instruction) {
            yield instruction;

            try {
                instruction = disassembler.disassembleInstruction();
            } catch { break }
        }
    }

    // Wait for the DOM to load, if it hasn't already (unlikely)
    if (document.readyState !== 'complete') await new Promise(res => document.addEventListener('DOMContentLoaded', res));

    // Find build and load up wasm + wail parser
    const BUILD = (/(?!build_)[0-9a-fA-F]{40}/.exec(document.body.innerHTML) || [false])[0] || prompt('Unable to detect build, please manually specify');
    if (!BUILD) return alert('No valid build');

    const bin = await fetch('https://static.diep.io/build_' + BUILD + '.wasm.wasm').then(res => res.arrayBuffer());
    const wail = new WailParser(new Uint8Array(bin));

    // Begin parsing
    const out = {};

    wail.addCodeElementParser(null, ({ index, bytes }) => {
        // For each function convert code to list of instructions
        const instructions = Array.from(instructionGen(bytes));
        const len = instructions.length;

        for (let key in SEARCHES) {
            if (!SEARCHES.hasOwnProperty(key) || out[key]) continue;
            
            // Check if it matches up with any wanted searches
            const search = SEARCHES[key];
            const searchLen = search.length - 2;

            const test = search[searchLen + 1]; // the testing function

            largeSearch: for (let i = searchLen, j = 0; i < len; ++i) { // search / scan the function for the wanted stuff
                for (j = searchLen; j >= 0; --j) { // for every byte, check if the previous line up with the wanted
                    if (instructions[i - j] && instructions[i - j].opcode === search[searchLen - j]) continue;

                    continue largeSearch; // if not, move to the next byte (this is a lot of loops in the end  but this kind of code isn't meant to run often)
                }
                
                // Matches the searches? test on the func
                const val = test(instructions, i, index);
                if (val === false) continue largeSearch;

                out[key] = val; // test works, return the resulting val
                break largeSearch;
            }
        }
        
        return false; 
    });

    wail.parse();

    // console.log(out);
    return out;
})(['https://cdn.jsdelivr.net/gh/qwokka/wail@latest/wail.min.js', 'https://cdn.jsdelivr.net/gh/Qwokka/Cetus@master/extension/libs/disassembler.js']);

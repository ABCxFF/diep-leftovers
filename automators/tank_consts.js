;
(async (dependencies) => {
    await Promise.all(dependencies.map((src) => {
        const script = document.head.appendChild(document.createElement('script'));
        script.src = src;

        return new Promise((res, rej) => {
            script.onload = res;
            script.onerror = rej;
        });
    }));

    const SEARCHES = {
        tankCount: [OP_CALL, OP_CALL, OP_I32_CONST, OP_I32_LOAD, OP_I32_REM_U, OP_GET_LOCAL, OP_I32_XOR, (instructions, index) => instructions[index - 4].immediates[0]],
        root: [OP_BLOCK, OP_I32_CONST, OP_I32_LOAD8_U, OP_I32_CONST, OP_I32_AND, OP_BR_IF, OP_I32_CONST, OP_CALL, OP_I32_EQZ, OP_BR_IF, OP_I32_CONST, (instructions, index, func) => instructions.length === 37 && instructions[index].immediates[0]]
    };

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

    if (document.readyState !== 'complete') await new Promise(res => document.addEventListener('DOMContentLoaded', res));

    const BUILD = (/(?!build_)[0-9a-fA-F]{40}/.exec(document.body.innerHTML) || [false])[0];

    if (!BUILD) return alert('Unable to detect build');

    const bin = await fetch('https://static.diep.io/build_' + BUILD + '.wasm.wasm').then(res => res.arrayBuffer());
    const wail = new WailParser(new Uint8Array(bin));
    const out = {};

    wail.addCodeElementParser(null, ({ index, bytes }) => {

        const instructions = Array.from(instructionGen(bytes));
        const len = instructions.length;

        for (let key in SEARCHES) {
            if (!SEARCHES.hasOwnProperty(key) || out[key]) continue;

            const search = SEARCHES[key];
            const searchLen = search.length - 2;
            const test = search[searchLen + 1];

            largeSearch: for (let i = searchLen, j = 0; i < len; ++i) {
                for (j = searchLen; j >= 0; --j) {
                    if (instructions[i - j] && instructions[i - j].opcode === search[searchLen - j]) continue;

                    continue largeSearch;
                }

                const val = test(instructions, i, index);

                if (val === false) continue largeSearch;

                out[key] = val;
                break largeSearch;
            }
        }
        return false
    });

    wail.parse();

    console.log(out);
    return out;
})(['https://cdn.jsdelivr.net/gh/qwokka/wail@latest/wail.min.js', 'https://cdn.jsdelivr.net/gh/Qwokka/Cetus@master/extension/libs/disassembler.js']);

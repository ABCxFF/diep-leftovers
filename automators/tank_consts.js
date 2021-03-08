

;(async (dependencies) => {
  await Promise.all(dependencies.map((src) => {
    const script = document.head.appendChild(document.createElement('script'));
    script.src = src;

    return new Promise((res, rej) => {
      script.onload = res;
      script.onerror = rej;
    });
  }));

  const SEARCHES = [OP_CALL, OP_CALL, OP_I32_CONST, OP_I32_LOAD, OP_I32_REM_U, OP_GET_LOCAL, OP_I32_XOR];

  function* instructionGen(bytes) {
    let disassembler = new Disassembler(bytes);
    let instruction = disassembler.disassembleInstruction();
    while (instruction) {
      yield instruction;
          
      try {
        instruction = disassembler.disassembleInstruction();
      } catch {break}
    }
  }


  if (document.readyState !== 'complete') await new Promise(res => document.addEventListener('DOMContentLoaded', res));
  
  const BUILD = (/(?!build_)[0-9a-fA-F]{40}/.exec(document.body.innerHTML) || [false])[0];
  if (!BUILD) return alert('Unable to detect build');
  
  const bin = await fetch('https://static.diep.io/build_' + BUILD + '.wasm.wasm').then(res => res.arrayBuffer());

  return new Promise(res => {
    const wail = new WailParser(new Uint8Array(bin));

    wail.addCodeElementParser(null, ({index, bytes}) => {

      const instructions = Array.from(instructionGen(bytes));
      const len = instructions.length;
      const searchLen = SEARCHES.length;

      largeSearch: for (let i = searchLen - 1, j = 0; i < len; ++i) {
        for (j = searchLen - 1; j >= 0; --j) {
          if (instructions[i - j] && instructions[i - j].opcode === SEARCHES[(searchLen - 1) - j]) continue;

          continue largeSearch;
        }

        if (instructions[i - 4].immediates[0]) {
          res(instructions[i - 4].immediates[0]);
          break largeSearch;
        }
      }

      return false
    });
    /*```wasm
                      call $func296
                      call $func422
                      i32.const 116440
                      i32.load
                      i32.rem_u
                      local.get $var8
                      i32.xor
    ```*/
    wail.parse()
  });
})(['https://cdn.jsdelivr.net/gh/qwokka/wail@latest/wail.min.js', 'https://cdn.jsdelivr.net/gh/Qwokka/Cetus@master/extension/libs/disassembler.js']);

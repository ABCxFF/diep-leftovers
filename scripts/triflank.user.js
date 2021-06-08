// ==UserScript==
// @name         Diep.io Triflank
// @author       ABC
// @version      1.0.0
// @namespace    github.com/ABCxFF
// @description  TriFlank script for diepio. Press J to toggle
// @match        *://diep.io/
// @run-at       document-start
// @require      https://raw.githubusercontent.com/Qwokka/wail.min.js/5e32d36bd7a5e0830d1ff4b64d3587aea13f77da/wail.min.js
// @resource     packet_hook https://github.com/ABCxFF/diepindepth/raw/main/protocol/userscripts/packet_hook.user.js
// @grant        GM_getResourceText
// @grant        unsafeWindow
// ==/UserScript== s

const js = GM_getResourceText("packet_hook");
const CONST = eval("(" + js.slice(js.indexOf("return {") + 7, js.indexOf("}", js.indexOf("return {") + 8) + 1) + ")");
const STORE_ADDR = 344;

// github.com/ABCxFF/diepindepth/blob/main/protocol/outgoing.md
void function TriFlank() {
  const hijack = (bin, imports) => {
    const wail = new WailParser(new Uint8Array(bin));
    
    wail.addExportEntry(wail.getFunctionIndex(CONST.RECV_PACKET_INDEX), {
        fieldStr: "recvPacket",
        kind: "func",
    });
    
    // wail bug
    wail.addImportEntry({
      moduleStr: "_",
      fieldStr: "fix",
      kind: "func",
      type: wail.addTypeEntry({
        form: "func",
        params: [],
      })
    });
    
    imports._ = {
      fix() {
        void 0;
      }
    };
    
    const sendPacket = wail.getFunctionIndex(CONST.SEND_PACKET_INDEX);
    
    // prep
    const toggleAddr = VarUint32ToArray(STORE_ADDR);
    const flagAddr = VarUint32ToArray(STORE_ADDR + 4);
    
    wail.addCodeElementParser(sendPacket, function ({ bytes }) {
      
      const writer = new BufferReader(new Uint8Array(1));

      writer.writeAtAnchor([
        OP_GET_LOCAL, 1,
        OP_I32_LOAD8_U, 0, 0,
        OP_I32_CONST, 1,
        OP_I32_EQ,
        OP_IF, VALUE_TYPE_BLOCK,
            // if its off, dont do anything
            OP_I32_CONST, 0,
            OP_I32_LOAD, 2, ...toggleAddr,
            OP_I32_EQZ,
            OP_BR_IF, 0,
        
            // otherwise
            // toggle switch tank flag
            OP_I32_CONST, 0,
            OP_I32_CONST, 8,
            OP_I32_CONST, 0,
            OP_I32_LOAD, 2, ...flagAddr,
            OP_I32_XOR,
            OP_I32_STORE, 2, ...flagAddr,
        
            // and OR it onto the 3rd byte (vu32 with hasAdBlock set)
            OP_I32_CONST, 2,
            OP_GET_LOCAL, 1,
            OP_I32_ADD,

            OP_I32_CONST, 2,
            OP_GET_LOCAL, 1,
            OP_I32_ADD,
            OP_I32_LOAD8_U, 0, 0,
            OP_I32_CONST, 0,
            OP_I32_LOAD, 2, ...flagAddr,
            OP_I32_OR,

            OP_I32_STORE8, 0, 0,
            
            // every other 0x01 outgoing, upgrade to tri-angle
            OP_I32_CONST, 0,
            OP_I32_LOAD, 2, ...flagAddr,
            OP_I32_EQZ,
            OP_IF, VALUE_TYPE_BLOCK,
                // clone packet
                OP_I32_CONST, 0,
                OP_I32_CONST, 0,
                OP_I32_LOAD16_U, 1, ...VarUint32ToArray(STORE_ADDR + 8),
                OP_I32_STORE16, 1, ...VarUint32ToArray(STORE_ADDR + 10),

                // shuffle and add to sending list
                OP_GET_LOCAL, 0,
                OP_I32_CONST, ...VarUint32ToArray(STORE_ADDR + 10),
                OP_I32_CONST, 2,
                OP_CALL, ...VarUint32ToArray(sendPacket.i32()),
            OP_END,
        OP_END,
        ...bytes]);

      return writer.write()
    });
    
    wail.parse();
    
    return wail.write();
  }
  
  const main = (HEAPU8, recv) => {
    let key = 0;
    
    // github.com/ABCxFF/diepindepth/blob/main/protocol/outgoing.md#magic-tank-and-stat-xor
    for (let i = 0, seed = 1, timer = 0; i < 40; i++) {
      let nibble = parseInt(CONST.BUILD[i], 16);
      key ^= ((nibble << ((seed & 1) << 2)) << (timer << 3));
      timer = (timer + 1) & 3;
      seed ^= !timer;
    };

    key = (key >>> 0) % 54;
    
    // build
    HEAPU8[STORE_ADDR + 8] = 4;
    HEAPU8[STORE_ADDR + 9] = (key ^ 9) << 1;
    
    HEAPU8.set([3, 84, 114, 105, 70, 108, 97, 110, 107, 32, 116, 111, 103, 103, 108, 101, 100, 0, 255, 0, 0, 0, 0, 128, 59, 69, 116, 114, 105, 102, 108, 97, 110, 107, 0], STORE_ADDR + 12);
    
    // toggle on key j
    unsafeWindow.addEventListener("keyup", (key) => {
      if (key.code === "KeyJ" && unsafeWindow.input && unsafeWindow.input.should_prevent_unload()) {
        HEAPU8[STORE_ADDR] ^= 1;
        recv(STORE_ADDR + 12, 35);
      }
    });
    
    
    // turn off on death
    setInterval(() => {
      if (unsafeWindow.input && !unsafeWindow.input.should_prevent_unload()) HEAPU8[STORE_ADDR] = 0;
      
      localStorage.hadAdblocker = "1";
    }, 100);
  }
  
  // hook
  const _initWasm = window.WebAssembly.instantiate;
  window.WebAssembly.instantiate = (bin, imports) => _initWasm(hijack(bin, imports), imports).then((wasm) => {
      main(new Uint8Array(imports.a.memory.buffer), wasm.instance.exports.recvPacket);
      
      return wasm
    }).catch(err => {
      console.warn('Error in loading up wasm')
      throw err;
    });
}();

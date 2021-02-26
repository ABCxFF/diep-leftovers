// ==UserScript==
// @name         Spike Script
// @author       ABC
// @namespace    Praise Spike - discord.gg/ccRw8rwv67
// @description  Makes every tank on the tank list a spike
// @match        https://diep.io/
// @version      0.5.0
// @run-at       document-start
// @grant        none
// ==/UserScript== 

"use strict";

// https://github.com/ABCxFF/diep-leftovers/tree/main/screenshots for screenshots
// Made by ABC
//
// https://github.com/ABCxFF/diepindepth for more information (might not be public yet)

const BUILD = 'e99021e7fccb3f654e220f67668379afb0f4cc77';
const SPIKE_SQUAD = 'discord.gg/ccRw8rwv67';

const ROOT = 166820;
const TANK_COUNT = ROOT + 4;
const END = ROOT - 12;

const SPIKE = 0b01011110;

new Promise((res) => {
  const Memory = WebAssembly.Memory;

  WebAssembly.Memory = function(descriptor) {
      const mem = new Memory(descriptor);
    
      if (descriptor.initial === 1024) {
        WebAssembly.Memory = Memory;
        res(mem.buffer);
      }

      return mem;
  }
}).then(buf => {
  const latest = (/(?!build_)[0-9a-f]{40}(?=\.wasm\.js)/.exec(document.body.innerHTML)||[false])[0];

  if (latest !== BUILD) return alert('Invalid BUILD. This script will no longer function properly'); // If you remove this line, it still won't work bro


  const MEMORY = buf;
  const MEMORY_U32 = new Uint32Array(buf);
  
  const spikify = (root, end, tankCount) => {
    console.log('Beginning Spikification');
    
    let elem = root;
  
    while (elem !== end) {
      elem = MEMORY_U32[elem >> 2];
      MEMORY_U32[(elem + 0x64) >> 2] = SPIKE;
    }
    
    console.log('Tank Processing Completed');
    console.log('Praise Spike and Join discord.gg/ccRw8rwv67');
  }
  
  
  const spikifyLoop = setInterval(() => {
    const tankCount = MEMORY_U32[TANK_COUNT >> 2];
    const root = MEMORY_U32[MEMORY_U32[ROOT >> 2] >> 2];
    const end = MEMORY_U32[MEMORY_U32[MEMORY_U32[END >> 2] >> 2]  >> 2];
    
    if (end === root || root === tankCount) return;
    
    clearInterval(spikifyLoop);
    
    spikify(root, end, tankCount);
  }, 500);
  
});

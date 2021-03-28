// ==UserScript==
// @name         Spike Script
// @author       ABC
// @namespace    Praise Spike - discord.gg/j5kMnUfm
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
// https://github.com/ABCxFF/diepindepth/memory for more information (might not be public/complete yet)

const BUILD = '336eeced717141735691690a5def1adb11e2cc75';
const SPIKE_SQUAD = 'discord.gg/j5kMnUfm';

const ROOT = 168980;
const TANK_COUNT = 168984;
const END = 168972;

const SPIKE = 0b10101000;

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
    console.log('Praise Spike and Join ' + SPIKE_SQUAD);
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

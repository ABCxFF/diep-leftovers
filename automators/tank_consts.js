!((script=document.head.appendChild(document.createElement('script'))) => {
  script.src='https://cdn.jsdelivr.net/gh/qwokka/wail@latest/wail.min.js';
  // add this too : https://cdn.jsdelivr.net/gh/Qwokka/Cetus@master/extension/libs/disassembler.js
  return script;
})().onload = async () => {
  if (document.readyState !== 'complete') await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  
  const BUILD = (/(?!build_)[0-9a-fA-F]{40}/.exec(document.body.innerHTML) || [false])[0];

  if (!BUILD) return alert('Unable to detect build');
  
  const bin = await fetch('https://static.diep.io/build_' + BUILD + '.wasm.wasm').then(res => res.arrayBuffer());

  const wail = new WailParser(new Uint8Array(bin));

  ```wasm
                    call $func296
                    call $func422
                    i32.const 116440
                    i32.load
                    i32.rem_u
                    local.get $var8
                    i32.xor
```
  
};

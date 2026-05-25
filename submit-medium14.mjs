import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

const snap = p._bb('snapshot', '-i', '-d', '2');
const lines = snap.split('\n').slice(0, 20);
console.log('Current state:');
lines.forEach(l => console.log(l));

const text = p._bb('eval', `(function(){
  var h3 = document.querySelector('h3');
  var p = document.querySelector('.graf:not(.graf--title)');
  return {h3: h3 ? h3.innerText.substring(0,80) : 'no h3', body: p ? p.innerText.substring(0,50) : 'no p'};
})()`);
console.log('Content:', text);

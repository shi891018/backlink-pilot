import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Fill the name and username fields
const filled = p._bb('eval', `(function(){
  var nameInput = document.getElementById('name');
  var userInput = document.getElementById('username');
  var bioInput = document.getElementById('summary');
  
  // Set name
  nameInput.value = 'Alex S';
  nameInput.dispatchEvent(new Event('input', {bubbles:true}));
  nameInput.dispatchEvent(new Event('change', {bubbles:true}));
  
  // Set username  
  userInput.value = 'alexs_tools';
  userInput.dispatchEvent(new Event('input', {bubbles:true}));
  userInput.dispatchEvent(new Event('change', {bubbles:true}));
  
  // Set bio
  bioInput.value = 'Builder of scientific tools and web utilities. Currently working on unit converters for engineers and researchers.';
  bioInput.dispatchEvent(new Event('input', {bubbles:true}));
  bioInput.dispatchEvent(new Event('change', {bubbles:true}));
  
  return {name: nameInput.value, username: userInput.value};
})()`);
console.log('Filled:', filled);

await new Promise(r=>setTimeout(r,2000));

// Click Continue button
const cont = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var btn = btns.find(b => b.textContent.trim() === 'Continue');
  if(btn) { btn.click(); return 'clicked Continue'; }
  return 'not found: ' + btns.map(b=>b.textContent.trim().substring(0,20)).join('|');
})()`);
console.log('Continue:', cont);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,200));

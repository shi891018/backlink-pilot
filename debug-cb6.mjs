import { BbPage } from './src/bb.js';
const p = new BbPage();

// Inspect the save button component
const saveHTML = p._bb('eval', `(function(){
  var saveRoot = document.querySelector('.edit-save-root');
  var saveComp = document.querySelector('.component--edit-save');
  return JSON.stringify({
    saveRootHTML: saveRoot?.innerHTML?.substring(0,500),
    saveCompHTML: saveComp?.innerHTML?.substring(0,500),
    saveRootChildren: saveRoot?.children?.length,
    // Try clicking it directly
    saveCompStyle: window.getComputedStyle(saveComp||document.body).display
  });
})()`);
console.log('Save component:', saveHTML);

// Try clicking .component--edit-save
const clickResult = p._bb('eval', `(function(){
  var el = document.querySelector('.component--edit-save');
  if(el){ el.click(); return 'clicked component--edit-save'; }
  // Try button inside edit-save-root
  var btn = document.querySelector('.edit-save-root button,.edit-save-root [role=button]');
  if(btn){ btn.click(); return 'clicked btn in edit-save-root: '+btn.textContent; }
  // Try the mat-tooltip-trigger
  var trigger = document.querySelector('[class*=edit-save]');
  if(trigger){ trigger.click(); return 'clicked edit-save: '+trigger.tagName+' '+trigger.textContent; }
  return 'nothing found';
})()`);
console.log('Click save:', clickResult);

await new Promise(r=>setTimeout(r,3000));
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('After click:', afterBody);

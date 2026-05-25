import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://ai-hunter.io/submit-ai-tool/');
await new Promise(r=>setTimeout(r,5000));

// Get nonce for Forminator REST API
const nonce = p._bb('eval', `document.querySelector('[name=forminator_nonce]')?.value`);
const pageId = p._bb('eval', `document.querySelector('[name=page_id]')?.value || window._forminatorFront?.data?.entry?.page_id`);
console.log('nonce:', nonce, 'pageId:', pageId);

// Get the WP REST API nonce (usually in forminatorFrontVars or inline script)
const restNonce = p._bb('eval', `window.forminatorFrontVars?.rest_api_nonce || window.wpApiSettings?.nonce || ''`);
console.log('REST nonce:', restNonce);

// Try Forminator REST API submit
const result = p._bb('eval', `(async function(){
  var nonce = document.querySelector('[name=forminator_nonce]')?.value;
  var resp = await fetch('/wp-json/forminator/v1/custom-form/20773/submit', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-WP-Nonce': nonce || ''},
    body: JSON.stringify({
      data: [
        {name: 'name-1', value: 'Shijm'},
        {name: 'email-1', value: 'hi@unitconv.top'},
        {name: 'name-3', value: 'Unit Converter for Science'},
        {name: 'url-1', value: 'https://www.unitconv.top'},
        {name: 'select-1', value: 'Productivity'},
        {name: 'textarea-1', value: 'A precision unit converter for scientists, engineers, and students. Supports 200+ unit types including physics, chemistry, astronomy, and engineering with scientific notation support. Free at unitconv.top.'}
      ]
    })
  });
  var text = await resp.text();
  return JSON.stringify({status: resp.status, body: text.substring(0,400)});
})()`);
console.log('REST result:', result);

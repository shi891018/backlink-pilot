import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://ai-hunter.io/submit-ai-tool/');
await new Promise(r=>setTimeout(r,5000));

// Get Forminator form details
const formInfo = p._bb('eval', `(function(){
  var forms = document.querySelectorAll('.forminator-ui');
  var formEl = document.querySelector('form.forminator-custom-form');
  var formId = formEl?.id; // forminator-module-20773
  var nonce = document.querySelector('[name=forminator_nonce]')?.value;
  var draftId = document.querySelector('[name=draft_id]')?.value;
  return JSON.stringify({formEl: formEl?.id, formId, nonce, draftId, formAction: formEl?.action});
})()`);
console.log('Form info:', formInfo);

// Try Forminator AJAX endpoint
const ajaxResult = p._bb('eval', `(async function(){
  var formEl = document.querySelector('form.forminator-custom-form');
  var nonce = document.querySelector('[name=forminator_nonce]')?.value;
  
  var fd = new FormData();
  fd.append('action', 'forminator_submit_form');
  fd.append('form_id', '20773');
  fd.append('forminator_nonce', nonce || '');
  fd.append('page_id', document.querySelector('[name=page_id]')?.value || '');
  fd.append('current_url', location.href);
  fd.append('name-1', 'Shijm');
  fd.append('email-1', 'hi@unitconv.top');
  fd.append('name-3', 'Unit Converter for Science');
  fd.append('url-1', 'https://www.unitconv.top');
  fd.append('select-1', 'Productivity');
  fd.append('textarea-1', 'A precision unit converter for scientists, engineers, and students. Supports 200+ unit types across physics, chemistry, astronomy, and engineering with scientific notation support. Free at unitconv.top.');
  
  try {
    var resp = await fetch('/wp-admin/admin-ajax.php', {method: 'POST', body: fd});
    var text = await resp.text();
    return JSON.stringify({status: resp.status, body: text.substring(0,400)});
  } catch(e) {
    return 'error: ' + e.message;
  }
})()`);
console.log('AJAX result:', ajaxResult);

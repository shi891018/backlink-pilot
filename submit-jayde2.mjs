import { BbPage } from './src/bb.js';

const p = new BbPage();

// Close newsletter popup if visible
p._bb('eval', `
  // Try to close the newsletter modal/popup
  const closeBtn = document.querySelector('.close, button[class*=close], [class*=modal] button, [aria-label=close], .popup-close');
  if (closeBtn) { closeBtn.click(); console.log('closed popup'); }
  // Also try clicking outside
  const overlay = document.querySelector('.modal-overlay, .overlay, [class*=overlay]');
  if (overlay) overlay.click();
`);
await new Promise(r => setTimeout(r, 1000));

// Click the X button in the popup (ref=63 from earlier snapshot)
try { p._bb('click', '@63'); } catch(e) { console.log('close btn not found:', e.message); }
await new Promise(r => setTimeout(r, 1000));

// Try pressing Escape to close modal
p._bb('eval', 'document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", keyCode:27, bubbles:true}))');
await new Promise(r => setTimeout(r, 1000));

await p.screenshot('screenshots/jayde-popup-closed.png');
console.log('Trying to click Add my Site...');

// Click the second "Add my Site" button (the main one at the bottom of form)
p._bb('eval', `
  const btns = Array.from(document.querySelectorAll('button[name=submit], button[name="Add my Site"], input[value="Add my Site"]'));
  console.log('Found buttons:', btns.length);
  if (btns.length > 0) btns[btns.length-1].click();
`);
await new Promise(r => setTimeout(r, 500));

// Try click on button ref=28 (the last "Add my Site")
try { p._bb('click', '@28'); } catch(e) {}
await new Promise(r => setTimeout(r, 5000));

const finalUrl = p.url();
const title = p._bb('eval', 'document.title');
const bodyText = p._bb('eval', 'document.body.innerText.substring(0, 800)');
console.log('Final URL:', finalUrl);
console.log('Title:', title);
console.log('Body:', bodyText);
await p.screenshot('screenshots/jayde-after-submit2.png');

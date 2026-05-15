import { BbPage } from "./src/bb.js";
const p = new BbPage();
await p.goto("https://viesearch.com/resend");
await new Promise(r => setTimeout(r, 2000));
const snap = await p.snapshot();
console.log(snap.substring(0, 2000));

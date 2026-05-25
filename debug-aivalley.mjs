#!/usr/bin/env node
// Debug: get snapshot of AI Valley form to find correct submit button ref
import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://aivalley.ai/submit-tool/');
await new Promise(r => setTimeout(r, 5000));

// Fill fields first
await p.evalFill('input[name="your-name"]', 'Shijm');
await p.evalFill('input[name="ToolName"]', 'Unit Converter for Science');
await p.evalFill('input[name="ToolURL"]', 'https://www.unitconv.top');

const snap = await p.snapshot();
// Find all submit/button refs
const lines = snap.split('\n');
const relevant = lines.filter(l => l.includes('[ref=') && /(submit|button|send)/i.test(l));
console.log('Relevant refs:');
relevant.forEach(l => console.log(' ', l.trim()));
// Also print the last 20 lines around form end
const formEndIdx = snap.lastIndexOf('input[type=submit]');
if(formEndIdx > 0) console.log('\nForm end context:', snap.substring(formEndIdx-200, formEndIdx+200));

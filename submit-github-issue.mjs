import { BbPage } from './src/bb.js';
const p = new BbPage();

const issueUrl = 'https://github.com/nichetools/awesome-no-login-web-apps/issues/new?title=Add%20Unit%20Converter%20for%20Science&body=%23%23%20Add%3A%20Unit%20Converter%20for%20Science%0A%0A**Link%3A**%20https%3A%2F%2Fwww.unitconv.top%3Futm_source%3Dgithub%26utm_medium%3Ddirectory%26utm_campaign%3Dbacklink%0A%0A**Description%3A**%20Scientific%20unit%20converter%20with%20formulas%2C%20conversion%20steps%2C%20and%20multilingual%20support%20across%2011%20categories.%0A%0A**Category%3A**%20science%2C%20education%2C%20utilities%0A%0A**Why%20it%20fits%20this%20list%3A**%0AUnit%20Converter%20for%20Science%20is%20a%20free%20online%20unit%20converter%20designed%20for%20science%2C%0Aengineering%2C%20education%2C%20and%20technical%20work.%20It%20helps%20users%20convert%20units%20quickly%0Aand%20accurately%20across%2011%20categories%2C%20including%20length%2C%20mass%2C%20time%2C%20velocity%2C%0Aarea%2C%20volume%2C%20temperature%2C%20energy%2C%20force%2C%20pressure%2C%20and%20concentration.%0A%0AUnlike%20simple%20calculators%20that%20only%20output%20a%20result%2C%20this%20tool%20also%20provides%0Aconversion%20formulas%2C%20step-by-step%20explanations%2C%20and%20factor%20details%20so%20users%20can%0Aunderstand%20how%20each%20value%20is%20derived.%20This%20makes%20it%20useful%20not%20only%20for%20quick%0Aconversions%2C%20but%20also%20for%20learning%2C%20documentation%2C%20research%2C%20and%20engineering%20workflows.%0A%0AThe%20site%20supports%20multiple%20languages%2C%20is%20mobile-friendly%2C%20and%20is%20optimized%20for%0Aclear%20navigation%20across%20common%20metric%2C%20imperial%2C%20and%20scientific%20unit%20systems.%0AIt%20is%20especially%20suitable%20for%20students%2C%20researchers%2C%20engineers%2C%20teachers%2C%20and%0Aanyone%20searching%20for%20a%20reliable%20scientific%20unit%20conversion%20reference%20online.%0A%0A%0A---%0AI%20believe%20this%20project%20would%20be%20a%20valuable%20addition%20to%20this%20awesome%20list.';

await p.goto(issueUrl);
await new Promise(r=>setTimeout(r,6000));

const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('URL:', url.substring(0,80));
console.log('Body:', body);

// Check if logged in or redirected to login
const loginState = p._bb('eval', `(function(){
  var signIn = document.querySelector('[href*=login],[href*=signin]');
  var avatar = document.querySelector('[class*=avatar]');
  var title = document.querySelector('textarea[name=issue_title]')?.value;
  return JSON.stringify({signInLink: !!signIn, hasAvatar: !!avatar, issueTitle: title});
})()`);
console.log('Login state:', loginState);

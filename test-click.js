import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173/chart/global');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking Play All button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const playAll = buttons.find(b => b.textContent.includes('Play All'));
    if (playAll) playAll.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const html = await page.content();
  if (html.includes('id="yt-hidden-player"')) {
    console.log('Player is in DOM');
  }
  if (html.includes('player-bar')) {
    console.log('Player Bar is visible');
  } else {
    console.log('Player Bar is NOT visible');
  }
  
  await browser.close();
})();
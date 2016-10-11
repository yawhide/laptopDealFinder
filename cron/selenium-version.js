const webdriver = require('selenium-webdriver');
const By = webdriver.By;
const until = webdriver.until;

let driver = new webdriver.Builder().forBrowser('chrome').build();
driver.get('http://www.newegg.com/Product/Product.aspx?Item=N82E16834152944');
driver.wait(() => {
  return driver.findElement(By.css('#landingpage-price > div > div > ul > li.price-current'));
}, 3000);

let data = {};
let selectors = {
  'preSalePrice': '#landingpage-price > div > div > ul > li.price-was',
  'currentPrice': '#landingpage-price > div > div > ul > li.price-current',
  'savingsOnPrice': '#landingpage-price > div > div > ul > li.price-save',
  'noteOnPrice': '#landingpage-price > div > div > ul > li.price-note',
}
for (let name in selectors) {
  let selector = selectors[name];
  let elem = driver.findElement(By.css(selector));
  elem.getAttribute('innerText').then(text => {
    data[name] = text;
  });
}
let restElems = driver.findElements(By.css('#Specs > fieldset > dl'));
restElems.then(elems => {
  let promises = [];
  for (let elem of elems) {
    promises.push(new Promise((resolve, reject) => {
      Promise.all([
        elem.findElement(By.css('dt')).then(dtElem => dtElem.getAttribute('innerText')),
        elem.findElement(By.css('dd')).then(ddElem => ddElem.getAttribute('innerText'))
      ])
        .then(results => {
          resolve([results[0], results[1]]);
        });
    }));
  }
  Promise.all(promises)
    .then(results => {
      for (let result of results) {
        data[result[0]] = result[1];
      }
      console.log(results);
      console.log(data);
    });
});


driver.quit();

'use strict';

let runningTasks = {};
let taskStatus = '';

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.pageAction.show(tabId);

  if (runningTasks[tabId]) {
    runningTasks[tabId]();
  }
});

chrome.pageAction.onClicked.addListener(() => {
  if (!taskStatus) {
    console.log('running scraper task');
    taskStatus = 'running';
  } else if (taskStatus === 'running') {
    console.log('scraper task is already running, stopping!');
    taskStatus = 'stopping';
    return;
  }
  fetch('http://localhost:3000/newegg/usa/urllist')
    .then((response) => {
      return response.json().then((urls) => {
        console.log(`scraping ${urls.length} urls`);

        let q = async.queue((task, qcb) => {
          let url = task;
          if (taskStatus === 'stopping') {
            return qcb();
          }
          console.log('starting task with url:', url);
          chrome.tabs.create({ url, active: false }, (tab) => {

            runningTasks[tab.id] = function () {
              chrome.tabs.sendMessage(tab.id, { action: 'parseInfo' }, function(response) {
                // console.log('response:', response);
                if (!response) {
                  console.error('response is empty...');
                  return;
                }
                if (taskStatus === 'stopping') {
                  delete runningTasks[tab.id];
                  return qcb();
                }

                fetch('http://localhost:3000/newegg/usa/create', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(response),
                })
                  .then((response) => {
                    console.log(tab.id, url, response.status);
                    if (response.ok) {
                      chrome.tabs.remove(tab.id);
                      // return;
                    }
                    delete runningTasks[tab.id];
                    setTimeout(qcb, 2000);
                  });
              });
            }
          });
        }, 3);
        q.push(urls);
        q.drain = function () {
          taskStatus = '';
          runningTasks = {};
          console.log('no more tasks running');
        }
    });
  });
});

console.log('\'Allo \'Allo! Event Page for Page Action');

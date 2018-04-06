// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {ipcRenderer} = require('electron');

const $webview = document.querySelector('webview');
const $loader = document.querySelector('.loader');
let isInitialLoad = true;

$webview.addEventListener('did-start-loading', () => {
  // we use client side rendering so the loader is only needed on the first page load
  if(isInitialLoad) {
    $webview.classList.add('hide');
    $loader.classList.remove('loader-hide');
    isInitialLoad = false;
  }
});

$webview.addEventListener('dom-ready', () => {
  $webview.classList.remove('hide');
  // have to delay in order for the webview show/resize to settle
  setTimeout(() => {
    $loader.classList.add('loader-hide');
    window.openWebviewDevTools();
  }, 100);
});

// this is just for development convenience
// (because the todo app's dev tools are in a separate process)
window.openWebviewDevTools = () => {
  $webview.openDevTools();
};

window.closeWebviewDevTools = () => {
  $webview.closeDevTools();
};

ipcRenderer.on('openWebviewDevTools', (event, arg) => {
  window.openWebviewDevTools();
});

ipcRenderer.on('closeWebviewDevTools', (event, arg) => {
  window.closeWebviewDevTools();
});

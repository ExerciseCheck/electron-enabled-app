// in preload scripts, we have access to node.js and electron APIs
// the remote web app will not have access, so this is safe
const {ipcRenderer: ipc, remote} = require('electron');
const Kinect2 = require('kinect2');

init();

function init() {
  attachIPCListeners();

  // Expose a bridging API to by setting an global on `window`.
  // We'll add methods to it here first, and when the remote web app loads,
  // it'll add some additional methods as well.
  //
  // !CAREFUL! do not expose any functionality or APIs that could compromise the
  // user's computer. E.g. don't directly expose core Electron (even IPC) or node.js modules.
  window.Bridge = {
    eProcessDataFrame,
    eStartKinect,
  };
}

function attachIPCListeners() {
  // we get this message from the main process
  ipc.on('startKinect', () => {
    //setupKinect();
  });
}

function eProcessDataFrame() {
  if (process.platform === 'darwin') {
    console.log('message received');
  }
}

function eStartKinect() {
  const kinect = new Kinect2();
  if(kinect.open()) {
    //window.Bridge.startKinect();
    kinect.openBodyReader();
    kinect.on('bodyFrame', function(bodyFrame){
      window.Bridge.aOnBodyFrame(bodyFrame);
    });
  }
}

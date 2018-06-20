## Run this system (On Windows)
1. Prerequisite:
    * MongoDB:
        - mongoDB from website, community server version is enough for running. 
        - Add mongoDB path to global PATH. 
    * Kinect2 Driver:
        - Download drive from microsoft:[Link to download it](https://www.microsoft.com/en-us/download/confirmation.aspx?id=44559)
    * Nodejs should be installed
    * Run `npm install` under /anchor and /client directory. 
        - To run npm install correct under directory /client, you need to install some tools for that. Run `npm install --global --production windows-build-tools` in a powershell window with administration permission. 
2. Run mongoDB and set a path to store data (make sure that directory already exist):
    * Command: `mongod --dbpath \[directoryPath\]`
3. Run our server (assume you are under folder /anchor):
    * If this is your first time running this server, run following command first and set up root user: `node first-time-setup.js`
    * Command: `npm start`
4. Run our client (assume you are under folder /client, make sure you installed everything correctly):
    * Command: `npm start`

# ExerciseCheck

ExerciseCheck is a remote monitoring and evaluation platform for home base physical therapy.

## Requirements and Installation

Note: Because this application uses the Kinect V2, a Windows machine is necessary.
### MongoDB

Download [MongoDB](https://www.mongodb.com/download-center?#enterprise). Community Edition is enough for running the application. Make sure to add MongoDB to your PATH variables. 

### Kinect2

Download the driver from Microsoft: [Download Link](https://www.microsoft.com/en-us/download/confirmation.aspx?id=44559).  
Make sure to follow the installation instructions on the website. 

### Nodejs

Nodejs should be installed. Run `npm install` under \anchor and \client directory in your local copy of this directory. 
For WIndows users, if you encounter errors when running 'npm install' under \client directory, you will have to run cmd as administrator and run the command 'npm install --global --production windows-build-tools' and then run 'npm install' again under \client.

## Running the Application

### Database set up
To run the application, first create a directory for mongoDB to store data. CD into the main electron-enabled-app directory and create a folder. Then use the command:
```
$ mongod --dbpath=[folder_name]\
```
### Run the server
To start the server, first cd into the \anchor directory. If this is your first time running the server, run the following command first to set up a root user for the application, which can be used to manage all other user accounts:  `$ node first-time-setup.js`. Then: 
```$ npm start```

### Run the electron application
To use the electron app, cd into the \client directory. Then:
 ```$ npm start```

## Development 
ExerciseCheck uses Anchor as its backend. To learn more about Anchor, click [here](https://github.com/hicsail/anchor). 

 - \anchor - directory holding most of the application's functionality.
     - \anchor\api - RESTful APIs
     - \anchor\models -  mongo database models
     - \anchor\web - handlebars templates, css, scripts, routes, etc.

- \client - directory for electron app & some Kinect-related functions
    - Note: It is possible to run ExerciseCheck in the browser by simply starting the Anchor server, however the Kinect will not work because the relevant code requires both Anchor and the Electron app.

## Documentation

Documentation is currently in progress.

I. Server Initiation (Code 3)

✓	bufferBodyFrames = [];
✓ bufferTrial = [];
✓	gtArray=[];
✓	exArray=[];
✓	systemState = 3;
✓	openBodyReader();

✓	C->S: 'connection'
✓	S-b->C 'init' & systemState (constantly triggered by 'bodyFrame')

	Client:
	unlock (clientActive = true)
✓	change Text Label to 'Start' label
✓	liveupdateCanvas1()

--------------------------------------------------------------------------------
Transition State from Init to Recording (3 - 1) or Live to Recording(0 - 1)
Trigger:	C->S 'command', lock (clientActive = false)

Server
✓	bufferBodyFrames = [];
	Check the number of bodies in FOV
Client
	Lock the tracking object to the specific body
--------------------------------------------------------------------------------
II. Recording (Rec, Code 1)
Server
✓	bufferBodyFrames.push(bodyFrame)

✓	S-b->C:'rec' & bodyFrame & systemState (constantly triggered by 'bodyFrame')
✓	C: Change Text Label to 'Stop' label

✓	C->S: 'connection'
✓	S->C: 'rec' & bodyFrame & systemState
✓	Client: Change Text Label to 'Stop' label

Client
	unlock (clientActive = true)
✓	liveupdateCanvas1()

--------------------------------------------------------------------------------
Transition State from Recording to Result Display (1 - 2)
Trigger:	rx: 'command', lock (clientActive = false)

Server
✓	closeBodyReader()
✓	bufferTrial.push(bufferBodyFrames) // avoid multiple push

-----------------------------------------------------

III. Result Display ('disp', Code 2)
Server

✓	S-b->C: 'disp' & bufferBodyFrames & typeofTest & currentrecordid
✓	unlock (clientActive = true) (1 time)
✓	C->S: 'connection'
✓	S->C:  'disp' & bufferBodyFrames & typeofTest & currentrecordid
✓	unlock (clientActive = true) (1 time)
✓	C: animateCanvas1()

✓	C->S: 'choose',pushto(gtarray) or pushto(exarray)
✓	S->b->C: 'labeled'
✓	S->C: 'labeled'

✓	C->S: 'analyze'
✓	S->C: 'report', chartData, radarData



-----------------------------------------------------
Transition State from Result Display - Live (2 - 0)
✓	openBodyReader()

-----------------------------------------------------
IV. Live ('live', Code 0)

Server
✓	S-b->C: 'live' & bufferBodyFrames & typeofTest & currentrecordid
✓	C: liveupdateCanvas1()

✓	C->S: 'connection'
✓	S->C:  'disp' & bufferBodyFrames & typeofTest & currentrecordid
✓	C: liveupdateCanvas1()

----------------------------------------------------------------------
----------------------------------------------------------------------
----------------------------------------------------------------------
Report
✓	C->S 'saveRequest'

✓	C->S: 'curveRequest' & number
✓	S->C: 'curveResult' & curveData




"depthX",
"depthY",
"colorX",
"colorY",
"cameraX",
"cameraY",
"cameraZ",
"orientationX",
"orientationY",
"orientationZ",
"orientationW"];

Look-up for joint selection
Kinect2.JointType = {
 spineBase       : 0,
 spineMid        : 1,
 neck            : 2,
 head            : 3,
 shoulderLeft    : 4,
 elbowLeft       : 5,
 wristLeft       : 6,
 handLeft        : 7,
 shoulderRight   : 8,
 elbowRight      : 9,
 wristRight      : 10,
 handRight       : 11,
 hipLeft         : 12,
 kneeLeft        : 13,
 ankleLeft       : 14,
 footLeft        : 15,
 hipRight        : 16,
 kneeRight       : 17,
 ankleRight      : 18,
 footRight       : 19,
 spineShoulder   : 20,
 handTipLeft     : 21,
 thumbLeft       : 22,
 handTipRight    : 23,
 thumbRight      : 24
};

Existing Known Bugs:
If report is hit when the client is in disp state, the server will prompt up a series of warning that number sockets opened exceed limit
the lineChart is not update correctly

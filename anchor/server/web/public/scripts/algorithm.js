function dtw(ref_bodyframes, ex_bodyframes, joint){
	var ref_y = joint_from_bodyframes(ref_bodyframes, joint);
	var ex_y = joint_from_bodyframes(ex_bodyframes, joint);
	
	var dist = function( a, b ) {
		var a_x, a_y, a_z = a;
		var b_x, b_y, b_z = b;

    	return Math.sqrt(Math.pow(a_x - b_x, 2) + Math.pow(a_y - b_y, 2) + Math.pow(a_z - b_z, 2));
	};
 
	var dtw = new DynamicTimeWarping(ref_y, ex_y, dist);

	return dtw.getPath();
}

function joint_from_bodyframes(bodyframes, joint){
	var result = [];
	console.log(bodyframes);
	for (var bodyframe in bodyframes){
		bodyframe.bodies.some(function(body){
			if (body.tracked){
				var point = [body.joints[joint]["cameraX"], body.joints[joint]["cameraY"], body.joints[joint]["cameraZ"]];
				result.push(point);
			}
		});
	}
	return result;
}
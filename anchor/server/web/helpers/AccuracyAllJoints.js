// XXX
module.exports = function calculateAccOther( path_xyz, ref_joint, prac_joint) {

    err = 0
    for path_idx in path_xyz:
      err += Euclidean(ref_joint[path_idx[0]], prac _joint[path_idx[1]])

}
      err = err/len(path_xyz)

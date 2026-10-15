// Runtime declarations shared by the viewer and future native hosts.
// These describe visual behaviour, never OS or AI permissions.
export const HAND_GESTURES=Object.freeze(['relaxed','open','point','grip','fist']);
export function characterCapabilities({hands=false,heldProp=null}={}){
 return Object.freeze({
  gaze:true,dance:true,wave:hands,hands,
  expressions:Object.freeze(['idle','happy','listen','sleep']),
  gestures:hands?HAND_GESTURES:Object.freeze([]),
  heldProp:heldProp?Object.freeze({...heldProp}):null
 });
}

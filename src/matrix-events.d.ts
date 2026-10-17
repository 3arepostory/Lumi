import 'matrix-js-sdk/lib/@types/event';
declare module 'matrix-js-sdk/lib/@types/event' {
 interface TimelineEvents {
  'com.lumi.reaction': {'m.relates_to': {rel_type:'m.annotation';event_id:string;key:string}};
 }
}

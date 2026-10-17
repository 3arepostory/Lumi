export const spaces = ['Todas','Pessoal','Família','Trabalho','Faculdade','Favoritas'] as const;
export type Message = {id:string;sender:string;name:string;body:string;time:number;mine:boolean;pending?:boolean;failed?:boolean;edited?:boolean;reply?:string;file?:Record<string,unknown>;mime?:string;reactions?:Record<string,number>;raw?:unknown};
export type Conversation={id:string;name:string;preview:string;time:number;unread:number;members:number;encrypted:boolean;invited?:boolean};
export type RoomPrefs={space?:string;favorite?:boolean;muted?:boolean;theme?:string;hidden?:string[];stars?:string[]};
export type Reminder={id:string;room:string;message:string;body:string;due:string;done:boolean};
export type OutboxItem={id:string;body:string;room:string;reply?:string;edit?:string};
export type PrivateData={rooms:Record<string,RoomPrefs>;drafts:Record<string,string>;reminders:Reminder[];outbox:OutboxItem[];quiet:boolean;readReceipts:boolean;typing:boolean;delay:number};
export const emptyPrivate:PrivateData={rooms:{},drafts:{},reminders:[],outbox:[],quiet:false,readReceipts:false,typing:false,delay:3};
export function visibleRooms(rooms:Conversation[],prefs:PrivateData,space:string,query:string){return rooms.filter(r=>(space==='Todas'||(space==='Favoritas'?prefs.rooms[r.id]?.favorite:prefs.rooms[r.id]?.space===space))&&r.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))).sort((a,b)=>Number(!!prefs.rooms[b.id]?.favorite)-Number(!!prefs.rooms[a.id]?.favorite)||b.time-a.time);}
export function uniqueMessages(messages:Message[]){return [...new Map(messages.map(m=>[m.id,m])).values()].sort((a,b)=>a.time-b.time);}
export function validHomeserver(value:string){const url=new URL(value);if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Informe apenas o endereço do servidor, sem caminho.');if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('Use HTTPS para proteger o acesso à sua conta.');return url.origin;}

import type { RoomMessageEventContent } from 'matrix-js-sdk/lib/@types/events';
import type { IEncryptedFile } from 'matrix-encrypt-attachment/lib/index';
import * as sdk from 'matrix-js-sdk';
import { encryptAttachment, decryptAttachment, } from 'matrix-encrypt-attachment/lib/webcrypto';
import type { MatrixClient, MatrixEvent, IContent } from 'matrix-js-sdk';
import type { Logger } from 'matrix-js-sdk/lib/logger';
import { CryptoEvent } from 'matrix-js-sdk/lib/crypto-api/CryptoEvent';
import { type VerificationRequest, type ShowSasCallbacks, VerificationRequestEvent, VerificationPhase, VerifierEvent } from 'matrix-js-sdk/lib/crypto-api/verification';
import { OlmMachine } from '@matrix-org/matrix-sdk-crypto-wasm';
import { type Conversation,type Message, uniqueMessages,validHomeserver } from './domain';
const noop=()=>{};
const silent:Logger={trace:noop,debug:noop,info:noop,warn:noop,error:noop,getChild:()=>silent};
export type Session={baseUrl:string;userId:string;deviceId:string;accessToken:string};
export class LumiMatrix {
 client:MatrixClient;
 private listeners=new Set<()=>void>();
 state='Conectando';
 verification?:VerificationRequest;
 sas?:ShowSasCallbacks;
 notice='';
 onIncoming?: (roomId:string)=>void;
 constructor(readonly session:Session){
  this.client=sdk.createClient({...session,logger:silent,verificationMethods:['m.sas.v1']});
  this.client.on(sdk.ClientEvent.Sync,(s)=>{this.state=s==='SYNCING'||s==='PREPARED'?'Conectado':s==='ERROR'?'Reconectando':'Sincronizando';this.emit();});
  this.client.on(sdk.RoomEvent.Timeline,(e,r,old)=>{if(!old&&r&&this.state==='Conectado'&&e.getSender()!==this.session.userId&&['m.room.encrypted','m.room.message'].includes(e.getType()))this.onIncoming?.(r.roomId);this.emit();});
  this.client.on(sdk.MatrixEventEvent.Decrypted,()=>this.emit());
  this.client.on(sdk.ClientEvent.Room,()=>this.emit());
  this.client.on(sdk.RoomEvent.LocalEchoUpdated,()=>this.emit());
  this.client.on(sdk.RoomMemberEvent.Typing,()=>this.emit());
  this.client.on(CryptoEvent.DevicesUpdated,()=>{this.notice='A lista de dispositivos foi atualizada. Verifique as identidades antes de compartilhar conteúdo sensível.';this.emit();});
  this.client.on(CryptoEvent.UserTrustStatusChanged,()=>{this.notice='A confiança de uma identidade mudou. Revise a verificação.';this.emit();});
  this.client.on(CryptoEvent.VerificationRequestReceived,(r)=>this.watchVerification(r));
 }
 static async login(base:string,user:string,password:string){const baseUrl=validHomeserver(base);const client=sdk.createClient({baseUrl,logger:silent});const r=await client.loginRequest({type:'m.login.password',identifier:{type:'m.id.user',user},password,initial_device_display_name:'Lumi · Navegador'});return new LumiMatrix({baseUrl,userId:r.user_id,deviceId:r.device_id,accessToken:r.access_token});}
 static async register(base:string,user:string,password:string){const baseUrl=validHomeserver(base);const client=sdk.createClient({baseUrl,logger:silent});let r;try{r=await client.registerRequest({username:user,password,initial_device_display_name:'Lumi · Navegador'});}catch(e){const data=(e as {data?:{session?:string;flows?:{stages:string[]}[]}}).data;if(!data?.flows?.some(f=>f.stages.length===1&&f.stages[0]==='m.login.dummy'))throw Error('Este servidor exige convite ou verificação adicional. Crie a conta com o administrador do servidor.');r=await client.registerRequest({username:user,password,initial_device_display_name:'Lumi · Navegador',auth:{type:'m.login.dummy',session:data.session}});}if(!r.access_token||!r.device_id)throw Error('Conta criada. Entre para continuar.');return new LumiMatrix({baseUrl,userId:r.user_id,deviceId:r.device_id,accessToken:r.access_token});}
 async start(){await this.client.initRustCrypto({cryptoDatabasePrefix:`lumi-crypto-${this.session.userId}-${this.session.deviceId}`});this.client.getCrypto()!.globalBlacklistUnverifiedDevices=true;await this.client.startClient({initialSyncLimit:50,pendingEventOrdering:sdk.PendingEventOrdering.Detached});}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 emit(){this.listeners.forEach(fn=>fn());}
 rooms():Conversation[]{return this.client.getRooms().filter(r=>['join','invite'].includes(r.getMyMembership())).map(r=>{const last=this.messages(r.roomId).at(-1);return{id:r.roomId,name:r.name,preview:last?.body??(r.getMyMembership()==='invite'?'Convite para conversar':'Comece com um oi'),time:last?.time??0,unread:r.getUnreadNotificationCount(),members:r.getJoinedMemberCount(),encrypted:this.client.isRoomEncrypted(r.roomId),invited:r.getMyMembership()==='invite'};});}
 messages(id:string):Message[]{const r=this.client.getRoom(id);if(!r)return[];const events=[...r.getLiveTimeline().getEvents(),...r.getPendingEvents()];const reactions:Record<string,Record<string,number>>={};for(const e of events){if(e.getType()==='com.lumi.reaction'){const rel=e.getContent()['m.relates_to'];if(rel?.event_id&&rel.key){const rr=reactions[rel.event_id]??={};rr[rel.key]=(rr[rel.key]??0)+1;}}}return uniqueMessages(events.filter(e=>e.getType()==='m.room.message'&&!e.isRedacted()&&e.getContent()['m.relates_to']?.rel_type!=='m.replace').map(e=>{const c=e.getContent();return{id:e.getId()!,sender:e.getSender()!,name:r.getMember(e.getSender()!)?.name??e.getSender()!,body:c.body??'Mensagem indisponível',time:e.getTs(),mine:e.getSender()===this.session.userId,pending:!!e.status&&e.status!=='sent',failed:e.status==='not_sent',edited:!!e.replacingEvent(),reply:c['m.relates_to']?.['m.in_reply_to']?.event_id,file:c.file,mime:c.info?.mimetype,reactions:reactions[e.getId()!],raw:e};}));}
 assertEncrypted(id:string){if(!this.client.isRoomEncrypted(id))throw Error('O Lumi só envia mensagens em conversas criptografadas.');}
 async create(name:string,invite:string[]){if(invite.length===0)throw Error('Adicione pelo menos um participante.');const r=await this.client.createRoom({name,invite,visibility:sdk.Visibility.Private,preset:sdk.Preset.PrivateChat,initial_state:[{type:'m.room.encryption',state_key:'',content:{algorithm:'m.megolm.v1.aes-sha2',rotation_period_ms:86400000,rotation_period_msgs:100}},{type:'m.room.history_visibility',state_key:'',content:{history_visibility:'joined'}}]});return r.room_id;}
 async send(id:string,body:string,reply?:string,edit?:string){this.assertEncrypted(id);const content:IContent={msgtype:'m.text',body};if(reply)content['m.relates_to']={'m.in_reply_to':{event_id:reply}};if(edit){content['m.new_content']={msgtype:'m.text',body};content['m.relates_to']={rel_type:'m.replace',event_id:edit};content.body=`* ${body}`;}return this.client.sendEvent(id,sdk.EventType.RoomMessage,content as RoomMessageEventContent);}
 async item(id:string,body:string,kind:'decision'|'moment',source:string){this.assertEncrypted(id);return this.client.sendEvent(id,sdk.EventType.RoomMessage,{msgtype:sdk.MsgType.Text,body:`${kind==='decision'?'📌 Combinado':'🌷 Momento'}: ${body}`,'com.lumi.item':{kind,source}} as RoomMessageEventContent);}
 async attachment(id:string,file:File){this.assertEncrypted(id);if(file.size>20*1024*1024)throw Error('Neste piloto, o limite por arquivo é 20 MB.');const enc=await encryptAttachment(await file.arrayBuffer());const uploaded=await this.client.uploadContent(new Blob([enc.data],{type:'application/octet-stream'}),{name:'encrypted.bin',type:'application/octet-stream',includeFilename:false});const msgtype=file.type.startsWith('image/')?sdk.MsgType.Image:file.type.startsWith('audio/')?sdk.MsgType.Audio:file.type.startsWith('video/')?sdk.MsgType.Video:sdk.MsgType.File;await this.client.sendEvent(id,sdk.EventType.RoomMessage,{msgtype,body:file.name,file:{...enc.info,url:uploaded.content_uri},info:{mimetype:file.type,size:file.size}} as RoomMessageEventContent);}
 async download(m:Message){const f=m.file as unknown as IEncryptedFile&{url:string};if(!f?.url.startsWith('mxc://'))throw Error('Anexo inválido.');const url=this.client.mxcUrlToHttp(f.url,undefined,undefined,undefined,false,true,true);if(!url)throw Error('Endereço de mídia inválido.');const r=await fetch(url,{headers:{Authorization:`Bearer ${this.session.accessToken}`},redirect:'error'});if(!r.ok)throw Error('Não foi possível baixar o anexo.');const data=await decryptAttachment(await r.arrayBuffer(),f);return new Blob([data],{type:m.mime??'application/octet-stream'});}
 async react(id:string,eventId:string,key:string){this.assertEncrypted(id);await this.client.sendEvent(id,'com.lumi.reaction',{'m.relates_to':{rel_type:'m.annotation',event_id:eventId,key}});}
 async history(id:string){const room=this.client.getRoom(id);if(room)await this.client.scrollback(room,50);this.emit();}
 watchVerification(r:VerificationRequest){this.verification=r;this.sas=undefined;r.on(VerificationRequestEvent.Change,()=>{if(r.phase===VerificationPhase.Done){this.notice='Verificação concluída.';this.sas=undefined;}if(r.phase===VerificationPhase.Cancelled){this.notice='Verificação cancelada.';this.sas=undefined;}const v=r.verifier;if(v){v.on(VerifierEvent.ShowSas,sas=>{this.sas=sas;this.emit();});this.sas=v.getShowSasCallbacks()??undefined;}this.emit();});this.emit();}
 async beginVerification(user:string,device:string){this.watchVerification(await this.client.getCrypto()!.requestDeviceVerification(user,device));}
 async acceptVerification(){const r=this.verification;if(!r)return;if(r.phase===VerificationPhase.Requested)await r.accept();}
 async startSas(){const r=this.verification;if(!r)throw Error('Nenhuma verificação em andamento.');const v=r.verifier??await r.startVerification('m.sas.v1');v.on(VerifierEvent.ShowSas,sas=>{this.sas=sas;this.emit();});void v.verify().then(()=>{this.notice='Verificação concluída.';this.emit();}).catch(()=>{this.notice='Verificação não concluída.';this.emit();});}
 async backup(password:string){if(password.length<12)throw Error('Use uma senha de backup com pelo menos 12 caracteres.');const keys=await this.client.getCrypto()!.exportRoomKeysAsJson();return OlmMachine.encryptExportedRoomKeys(keys,password,600000);}
 async restore(data:string,password:string){if(data.length>25*1024*1024)throw Error('Backup muito grande para este piloto.');const keys=OlmMachine.decryptExportedRoomKeys(data,password);await this.client.getCrypto()!.importRoomKeysAsJson(keys);this.emit();}
 async logout(){await this.client.logout();this.client.stopClient();await this.client.clearStores();}
 stop(){this.client.stopClient();}
 async redact(id:string,event:string){await this.client.redactEvent(id,event);}
 async receipt(id:string,event:MatrixEvent){await this.client.sendReadReceipt(event);}
}

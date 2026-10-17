import type { ClientState, ClientConfig, KeyPackage, PrivateKeyPackage } from 'ts-mls';
import {createGroup,joinGroup,encodeGroupState,decodeGroupState} from 'ts-mls/clientState.js';
import {createCommit} from 'ts-mls/createCommit.js';
import {generateKeyPackage} from 'ts-mls/keyPackage.js';
import {createApplicationMessage} from 'ts-mls/createMessage.js';
import {processMessage} from 'ts-mls/processMessages.js';
import {emptyPskIndex} from 'ts-mls/pskIndex.js';
import {acceptAll} from 'ts-mls/incomingMessageAction.js';
import {getCiphersuiteImpl} from 'ts-mls/crypto/getCiphersuiteImpl.js';
import {getCiphersuiteFromName} from 'ts-mls/crypto/ciphersuite.js';
import {defaultCapabilities} from 'ts-mls/defaultCapabilities.js';
import {defaultLifetime} from 'ts-mls/lifetime.js';
import {encodeMlsMessage,decodeMlsMessage} from 'ts-mls/message.js';
import {mlsExporter} from 'ts-mls/keySchedule.js';
import {zeroOutUint8Array} from 'ts-mls/util/byteArray.js';
import {defaultClientConfig} from 'ts-mls/clientConfig.js';
import type {LinkMember,LinkSnapshot,WireMessage} from './protocol';
const encoder=new TextEncoder(),decoder=new TextDecoder();
export function b64(bytes:Uint8Array){let str='';for(const byte of bytes)str+=String.fromCharCode(byte);return btoa(str);}
export function unb64(str:string){return Uint8Array.from(atob(str),c=>c.charCodeAt(0));}
export function randomToken(){return b64(crypto.getRandomValues(new Uint8Array(32))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
export async function hash(value:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
let suite:ReturnType<typeof getCiphersuiteImpl>|undefined;
export function cipher(){return suite??=getCiphersuiteImpl(getCiphersuiteFromName('MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519'));}
export function config(members:LinkMember[]):ClientConfig{const pins=new Map(members.map(m=>[m.id,m.signatureKey]));return {...defaultClientConfig,keyRetentionConfig:{retainKeysForGenerations:16,retainKeysForEpochs:0,maximumForwardRatchetSteps:1000},authService:{async validateCredential(credential,key){return credential.credentialType==='basic'&&pins.get(decoder.decode(credential.identity))===b64(key);}}};}
function unpack(encoded:string){const bytes=unb64(encoded);const value=decodeMlsMessage(bytes,0);if(!value||value[1]!==bytes.length)throw Error('Envelope MLS inválido.');return value[0];}
export function keyPackage(encoded:string):KeyPackage{const message=unpack(encoded);if(message.wireformat!=='mls_key_package')throw Error('Pacote de chaves inválido.');return message.keyPackage;}
export async function makeMember(name:string){const id=crypto.randomUUID();const kp=await generateKeyPackage({credentialType:'basic',identity:encoder.encode(id)},defaultCapabilities(),defaultLifetime,[],await cipher());const member:LinkMember={id,name,keyPackage:b64(encodeMlsMessage({wireformat:'mls_key_package',version:'mls10',keyPackage:kp.publicPackage})),signatureKey:b64(kp.publicPackage.leafNode.signaturePublicKey)};return {member,kp};}
export function serializePrivate(k:PrivateKeyPackage){return{initPrivateKey:b64(k.initPrivateKey),hpkePrivateKey:b64(k.hpkePrivateKey),signaturePrivateKey:b64(k.signaturePrivateKey)};}
function privateKeys(s:LinkSnapshot):PrivateKeyPackage{return{initPrivateKey:unb64(s.privatePackage.initPrivateKey),hpkePrivateKey:unb64(s.privatePackage.hpkePrivateKey),signaturePrivateKey:unb64(s.privatePackage.signaturePrivateKey)};}
export function restoreState(s:LinkSnapshot):ClientState{if(!s.state)throw Error('Chaves desta conversa ainda não disponíveis.');const bytes=unb64(s.state);const state=decodeGroupState(bytes,0);if(!state||state[1]!==bytes.length)throw Error('Estado criptográfico local inválido.');return{...state[0],clientConfig:config([s.owner,...s.guest?[s.guest]:[]])};}
export async function initialState(id:string,member:LinkMember,kp:PrivateKeyPackage){return createGroup(encoder.encode(id),keyPackage(member.keyPackage),kp,[],await cipher(),config([member]));}
export const encodeState=(state:ClientState)=>b64(encodeGroupState(state));
export async function addGuest(s:LinkSnapshot,guest:LinkMember){const state=restoreState({...s,guest});const kp=keyPackage(guest.keyPackage);if(kp.leafNode.credential.credentialType!=='basic'||decoder.decode(kp.leafNode.credential.identity)!==guest.id||b64(kp.leafNode.signaturePublicKey)!==guest.signatureKey)throw Error('A identidade convidada não corresponde às chaves recebidas.');const result=await createCommit({state,cipherSuite:await cipher()},{extraProposals:[{proposalType:'add',add:{keyPackage:kp}}],ratchetTreeExtension:true});if(!result.welcome)throw Error('Não foi possível preparar o convite criptográfico.');const payload=b64(encodeMlsMessage({wireformat:'mls_welcome',version:'mls10',welcome:result.welcome}));const serialized=encodeState(result.newState);result.consumed.forEach(zeroOutUint8Array);return{state:serialized,payload};}
export async function acceptWelcome(s:LinkSnapshot,payload:string){const welcome=unpack(payload);if(welcome.wireformat!=='mls_welcome')throw Error('Boas-vindas criptográficas inválidas.');const state=await joinGroup(welcome.welcome,keyPackage(s.self.keyPackage),privateKeys(s),emptyPskIndex,await cipher(),undefined,undefined,config([s.owner,s.self]));if(decoder.decode(state.groupContext.groupId)!==s.id)throw Error('Este envelope pertence a outra conversa.');return encodeState(state);}
export async function encryptMessage(s:LinkSnapshot,message:WireMessage){const result=await createApplicationMessage(restoreState(s),encoder.encode(JSON.stringify(message)),await cipher());const payload=b64(encodeMlsMessage({wireformat:'mls_private_message',version:'mls10',privateMessage:result.privateMessage}));const state=encodeState(result.newState);result.consumed.forEach(zeroOutUint8Array);return{state,payload};}
export async function decryptMessage(s:LinkSnapshot,payload:string){const message=unpack(payload);if(message.wireformat!=='mls_private_message')throw Error('O Lumi exige mensagens MLS privadas.');const result=await processMessage(message,restoreState(s),emptyPskIndex,acceptAll,await cipher());const state=encodeState(result.newState);result.consumed.forEach(zeroOutUint8Array);if(result.kind!=='applicationMessage')throw Error('Tipo de atualização não suportado nesta versão.');return{state,message:JSON.parse(decoder.decode(result.message)) as WireMessage};}
export async function safetyCode(s:LinkSnapshot){const state=restoreState(s);const bytes=await mlsExporter(state.keySchedule.exporterSecret,'lumi-verificacao-v1',encoder.encode(s.id),24,await cipher());return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('').match(/.{1,4}/g)!.join(' ');}
export async function signalKey(s:LinkSnapshot){const state=restoreState(s);const bytes=await mlsExporter(state.keySchedule.exporterSecret,'lumi-sinalizacao-v1',encoder.encode(s.id),32,await cipher());return crypto.subtle.importKey('raw',bytes as Uint8Array<ArrayBuffer>,'AES-GCM',false,['encrypt','decrypt']);}

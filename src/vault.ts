// Device-local encryption, independent of the messaging protocol. The key is
// non-extractable but same-origin malicious code can still use it: see SECURITY.
const DB = 'lumi-private-v1';
function open(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
async function get<T>(id:string):Promise<T|undefined>{const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('data');const r=tx.objectStore('data').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
async function put(id:string,value:unknown){const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').put(value,id);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
let keyPromise:Promise<CryptoKey>|undefined;
function key(){return keyPromise??=(async()=>{let k=await get<CryptoKey>('key');if(!k){k=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);await put('key',k);}return k;})();}
export async function savePrivate(id:string,value:unknown){const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(id)},await key(),new TextEncoder().encode(JSON.stringify(value)));await put(id,{iv,ciphertext});}
export async function loadPrivate<T>(id:string,fallback:T):Promise<T>{const value=await get<{iv:Uint8Array<ArrayBuffer>;ciphertext:ArrayBuffer}>(id);if(!value)return fallback;const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:value.iv,additionalData:new TextEncoder().encode(id)},await key(),value.ciphertext);return JSON.parse(new TextDecoder().decode(plain));}
export async function clearPrivate(){keyPromise=undefined;return new Promise<void>((resolve,reject)=>{const r=indexedDB.deleteDatabase(DB);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Feche outras abas do Lumi para limpar o armazenamento.'));});}

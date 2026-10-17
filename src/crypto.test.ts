import {describe,it,expect,beforeAll,vi} from 'vitest';
import {encryptAttachment,decryptAttachment} from 'matrix-encrypt-attachment/lib/webcrypto';
import {initAsync,OlmMachine} from '@matrix-org/matrix-sdk-crypto-wasm';
describe('encrypted payloads',()=>{
 beforeAll(async()=>{vi.stubGlobal('window',{crypto:globalThis.crypto,btoa:globalThis.btoa,atob:globalThis.atob});await initAsync();});
 it('round-trips an attachment and rejects altered ciphertext',async()=>{const text='conteúdo privado que não deve aparecer no servidor';const source=new TextEncoder().encode(text);const enc=await encryptAttachment(source.buffer);expect(new TextDecoder().decode(enc.data)).not.toContain(text);expect(new TextDecoder().decode(await decryptAttachment(enc.data,enc.info))).toBe(text);const altered=enc.data.slice(0);new Uint8Array(altered)[0]^=1;await expect(decryptAttachment(altered,enc.info)).rejects.toThrow();});
 it('restores a standard encrypted Matrix key export and rejects wrong passwords',()=>{const json='[]';const encrypted=OlmMachine.encryptExportedRoomKeys(json,'uma senha forte e exclusiva',1000);expect(encrypted).toContain('BEGIN MEGOLM SESSION DATA');expect(OlmMachine.decryptExportedRoomKeys(encrypted,'uma senha forte e exclusiva')).toBe(json);expect(()=>OlmMachine.decryptExportedRoomKeys(encrypted,'senha incorreta')).toThrow();});
});

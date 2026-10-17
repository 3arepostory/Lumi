import {describe,it,expect,vi} from 'vitest';
import {greeting,loadProfile,saveProfile,palettes} from './profile';
describe('perfil e horário de Brasília',()=>{
 it.each([['2026-10-17T07:59:59Z','Boa noite'],['2026-10-17T08:00:00Z','Bom dia'],['2026-10-17T14:59:59Z','Bom dia'],['2026-10-17T15:00:00Z','Boa tarde'],['2026-10-17T20:59:59Z','Boa tarde'],['2026-10-17T21:00:00Z','Boa noite'],['2026-10-18T03:00:00Z','Boa noite']])('aplica o limite %s em America/Sao_Paulo',(stamp,expected)=>{expect(greeting('Ana',new Date(stamp))).toBe(`${expected}, Ana!`);});
 it('persiste nome, combinação e modo; rejeita preferências inválidas',()=>{let value:string|null=null;vi.stubGlobal('localStorage',{getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;}});expect(loadProfile()).toBeNull();const p={name:'Ana',palette:palettes[2].id,dark:true};saveProfile(p);expect(loadProfile()).toEqual(p);value='{"name":"Ana","palette":"inexistente"}';expect(loadProfile()).toBeNull();vi.unstubAllGlobals();});
 it('mantém contraste WCAG AA entre botões e texto branco em todas as combinações',()=>{const lum=(hex:string)=>{const rgb=hex.match(/[0-9a-f]{2}/gi)!.map(v=>parseInt(v,16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;};for(const p of palettes)expect(1.05/(lum(p.a)+0.05)).toBeGreaterThanOrEqual(4.5);});
});

export const palettes = [
 {id:'lavanda',name:'Lavanda e pétala',a:'#735096',b:'#b9687c'},
 {id:'jardim',name:'Jardim e sol',a:'#316b53',b:'#a56a25'},
 {id:'oceano',name:'Oceano e lilás',a:'#286b8b',b:'#8555a0'},
 {id:'rosa',name:'Rosa e pêssego',a:'#a34666',b:'#aa5b32'},
 {id:'terra',name:'Terra e folhas',a:'#80563d',b:'#4a7046'},
] as const;
export type Profile={name:string;palette:string;dark:boolean};
export function loadProfile():Profile|null{try{const p=JSON.parse(localStorage.getItem('lumi-profile-v1')??'null');return p&&typeof p.name==='string'&&p.name.trim()&&palettes.some(x=>x.id===p.palette)?{name:p.name.trim().slice(0,50),palette:p.palette,dark:p.dark===true}:null;}catch{return null;}}
export function saveProfile(p:Profile){localStorage.setItem('lumi-profile-v1',JSON.stringify(p));}
export function greeting(name:string,date=new Date()) {const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',hourCycle:'h23'}).format(date));return `${hour>=5&&hour<12?'Bom dia':hour>=12&&hour<18?'Boa tarde':'Boa noite'}, ${name}!`;}
export function applyProfile(p:Profile){const palette=palettes.find(x=>x.id===p.palette)??palettes[0],root=document.documentElement;root.dataset.theme=p.dark?'dark':'light';const mix=(c:string,pct:number)=>`color-mix(in srgb, ${c} ${pct}%, ${p.dark?'#1c1b22':'#fffefa'})`;const vars={'--purple':p.dark?`color-mix(in srgb, ${palette.a} 30%, #fff)`:palette.a,'--action':palette.a,'--accent':mix(palette.a,p.dark?30:12),'--pink':mix(palette.b,18),'--mint':mix(palette.b,10),'--bg':p.dark?'#211f29':mix(palette.a,2),'--surface':p.dark?'#282530':'#fffefa','--canvas':mix(palette.a,5),'--chat-tint':mix(palette.b,5),'--border':p.dark?'#514a5c':mix(palette.a,20),'--text':p.dark?'#f4edf8':'#342d3c','--muted':p.dark?'#c7bdcf':'#665c70'};for(const [key,value]of Object.entries(vars))root.style.setProperty(key,value);}

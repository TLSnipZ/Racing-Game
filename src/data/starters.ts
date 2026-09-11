export type Drive='FWD'|'RWD';
export type StarterCar={id:string;name:string;year:number;engine:string;drive:Drive;hp:number;weightKg:number;condition:number;priceYen:number;archetype:string;description:string;traits:string[]};
export const STARTER_CARS:StarterCar[]=[
{id:'pico-rs',name:'Hoshino Pico RS',year:1994,engine:'1.5L NA I4',drive:'FWD',hp:105,weightKg:890,condition:84,priceYen:32000,archetype:'The Safe Bet',description:'Light, dependable and cheap to keep alive. A perfect first step into Kagehama.',traits:['Reliable','Lightweight','Cheap repairs']},
{id:'tora-85',name:'Hoshino Tora 85',year:1986,engine:'1.6L NA I4',drive:'RWD',hp:118,weightKg:970,condition:71,priceYen:42000,archetype:'The Purist',description:'Old-school rear-wheel drive with the balance to become a touge weapon.',traits:['RWD','Touge potential','Drift friendly']},
{id:'rz-t',name:'Akari RZ-T',year:1992,engine:'1.8L Turbo I4',drive:'RWD',hp:155,weightKg:1180,condition:58,priceYen:48000,archetype:'The Gamble',description:'Turbo power for almost every yen you own. Fast now. Financially questionable later.',traits:['Turbo','Highest power','High risk']}
];

import {Database} from 'bun:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
export class Store {
 readonly db:Database;
 constructor(file=':memory:'){
  if(file!==':memory:')mkdirSync(dirname(file),{recursive:true});
  this.db=new Database(file,{create:true,strict:true});
  this.db.exec('PRAGMA foreign_keys=ON;PRAGMA journal_mode=WAL;PRAGMA synchronous=FULL;PRAGMA busy_timeout=5000;');
  this.migrate();
 }
 run(sql:string,...params:(string|number|null)[]):void{this.db.query(sql).run(...params);}
 get<T=any>(sql:string,...params:(string|number|null)[]):T|undefined{return this.db.query(sql).get(...params) as T|undefined;}
 all<T=any>(sql:string,...params:(string|number|null)[]):T[]{return this.db.query(sql).all(...params) as T[];}
 tx<T>(fn:()=>T):T{return this.db.transaction(fn).immediate();}
 close():void{this.db.close();}
 private migrate():void{this.db.exec([
 "CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,joined_at INTEGER NOT NULL,xp INTEGER NOT NULL DEFAULT 0 CHECK(xp>=0),representative TEXT,deleted INTEGER NOT NULL DEFAULT 0,UNIQUE(guild_id,user_id))",
 "CREATE TABLE IF NOT EXISTS wallets(player_id TEXT NOT NULL REFERENCES players(id),currency TEXT NOT NULL CHECK(currency IN('MOHAE','SHARD','TICKET')),balance INTEGER NOT NULL DEFAULT 0 CHECK(balance>=0),PRIMARY KEY(player_id,currency))",
 "CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(id),currency TEXT NOT NULL,delta INTEGER NOT NULL,source TEXT NOT NULL,at INTEGER NOT NULL,UNIQUE(player_id,currency,source))",
 "CREATE TABLE IF NOT EXISTS operations(player_id TEXT NOT NULL REFERENCES players(id),request_id TEXT NOT NULL,kind TEXT NOT NULL,result TEXT NOT NULL,at INTEGER NOT NULL,PRIMARY KEY(player_id,request_id))",
 "CREATE TABLE IF NOT EXISTS attendance(player_id TEXT NOT NULL REFERENCES players(id),day TEXT NOT NULL,PRIMARY KEY(player_id,day))",
 "CREATE TABLE IF NOT EXISTS journals(player_id TEXT NOT NULL REFERENCES players(id),day TEXT NOT NULL,ciphertext TEXT NOT NULL,iv TEXT NOT NULL,tag TEXT NOT NULL,PRIMARY KEY(player_id,day))",
 "CREATE TABLE IF NOT EXISTS daily_quests(player_id TEXT NOT NULL REFERENCES players(id),day TEXT NOT NULL,topic TEXT NOT NULL,PRIMARY KEY(player_id,day))",
 "CREATE TABLE IF NOT EXISTS weekly_claims(player_id TEXT NOT NULL REFERENCES players(id),week TEXT NOT NULL,PRIMARY KEY(player_id,week))",
 "CREATE TABLE IF NOT EXISTS chats(message_id TEXT PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(id),day TEXT NOT NULL,week TEXT NOT NULL,at INTEGER NOT NULL,accepted INTEGER NOT NULL)",
 "CREATE TABLE IF NOT EXISTS chat_state(player_id TEXT NOT NULL REFERENCES players(id),day TEXT NOT NULL,last_at INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(player_id,day))",
 "CREATE TABLE IF NOT EXISTS voice_events(id TEXT PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(id),day TEXT NOT NULL,week TEXT NOT NULL,seconds INTEGER NOT NULL CHECK(seconds BETWEEN 0 AND 60))",
 "CREATE TABLE IF NOT EXISTS activity_rewards(player_id TEXT NOT NULL REFERENCES players(id),day TEXT NOT NULL,chat_claimed INTEGER NOT NULL DEFAULT 0,voice_claimed INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(player_id,day))",
 "CREATE TABLE IF NOT EXISTS pity(player_id TEXT NOT NULL REFERENCES players(id),pool TEXT NOT NULL CHECK(pool IN('standard','limited')),three INTEGER NOT NULL DEFAULT 0 CHECK(three BETWEEN 0 AND 59),two INTEGER NOT NULL DEFAULT 0 CHECK(two BETWEEN 0 AND 9),pickup INTEGER NOT NULL DEFAULT 0 CHECK(pickup BETWEEN 0 AND 69),guaranteed INTEGER NOT NULL DEFAULT 0 CHECK(guaranteed IN(0,1)),PRIMARY KEY(player_id,pool))",
 "CREATE TABLE IF NOT EXISTS cards(id TEXT PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(id),character TEXT NOT NULL,rarity INTEGER NOT NULL CHECK(rarity BETWEEN 1 AND 3),locked INTEGER NOT NULL DEFAULT 0,acquired INTEGER NOT NULL,source TEXT NOT NULL)",
 "CREATE INDEX IF NOT EXISTS cards_player ON cards(player_id,character)",
 "CREATE TABLE IF NOT EXISTS discoveries(player_id TEXT NOT NULL REFERENCES players(id),character TEXT NOT NULL,at INTEGER NOT NULL,PRIMARY KEY(player_id,character))",
 "CREATE TABLE IF NOT EXISTS draws(id TEXT PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(id),banner TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity IN(1,10)),results TEXT NOT NULL,at INTEGER NOT NULL)",
 "CREATE TABLE IF NOT EXISTS mini_sessions(id TEXT PRIMARY KEY,player_id TEXT NOT NULL REFERENCES players(id),game TEXT NOT NULL,day TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,answer TEXT NOT NULL,finished INTEGER NOT NULL DEFAULT 0,rewarded INTEGER NOT NULL DEFAULT 0)",
 "CREATE TABLE IF NOT EXISTS affinity(player_id TEXT NOT NULL REFERENCES players(id),character TEXT NOT NULL,points INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(player_id,character))",
 "CREATE TABLE IF NOT EXISTS affinity_claims(player_id TEXT NOT NULL REFERENCES players(id),day TEXT NOT NULL,kind TEXT NOT NULL,PRIMARY KEY(player_id,day,kind))",
 "CREATE TABLE IF NOT EXISTS cosmetics(player_id TEXT NOT NULL REFERENCES players(id),sku TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(player_id,sku))",
 "CREATE TABLE IF NOT EXISTS profile_visibility(player_id TEXT PRIMARY KEY REFERENCES players(id),public INTEGER NOT NULL DEFAULT 0 CHECK(public IN(0,1)))",
 "CREATE TABLE IF NOT EXISTS equipped(player_id TEXT NOT NULL REFERENCES players(id),slot TEXT NOT NULL,sku TEXT NOT NULL,PRIMARY KEY(player_id,slot))",
 "CREATE TABLE IF NOT EXISTS season(guild_id TEXT NOT NULL,id TEXT NOT NULL,start_at INTEGER NOT NULL,end_at INTEGER NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,settled INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild_id,id))",
 "CREATE TABLE IF NOT EXISTS season_progress(player_id TEXT NOT NULL REFERENCES players(id),season TEXT NOT NULL,xp INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(player_id,season))",
 "CREATE TABLE IF NOT EXISTS season_claims(player_id TEXT NOT NULL REFERENCES players(id),season TEXT NOT NULL,tier INTEGER NOT NULL,PRIMARY KEY(player_id,season,tier))",
 "CREATE TABLE IF NOT EXISTS event_flags(guild TEXT NOT NULL,season TEXT NOT NULL,event_id TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild,season,event_id))",
 "CREATE TABLE IF NOT EXISTS coop_settings(guild TEXT NOT NULL,season TEXT NOT NULL,target INTEGER NOT NULL CHECK(target BETWEEN 5 AND 10000),PRIMARY KEY(guild,season))",
 "CREATE TABLE IF NOT EXISTS coop_contributions(player_id TEXT NOT NULL REFERENCES players(id),season TEXT NOT NULL,day TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount BETWEEN 1 AND 3),PRIMARY KEY(player_id,season,day))",
 "CREATE TABLE IF NOT EXISTS coop_claims(player_id TEXT NOT NULL REFERENCES players(id),season TEXT NOT NULL,PRIMARY KEY(player_id,season))",
 "CREATE TABLE IF NOT EXISTS event_claims(player_id TEXT NOT NULL REFERENCES players(id),season TEXT NOT NULL,event_id TEXT NOT NULL,PRIMARY KEY(player_id,season,event_id))",
 "CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,guild TEXT NOT NULL,reporter TEXT NOT NULL,target TEXT,reason TEXT NOT NULL,details TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',created INTEGER NOT NULL)",
 "CREATE TABLE IF NOT EXISTS guild_config(guild TEXT PRIMARY KEY,chat_channels TEXT NOT NULL DEFAULT '[]',voice_channels TEXT NOT NULL DEFAULT '[]',report_channel TEXT,enabled INTEGER NOT NULL DEFAULT 1)",
 "CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,details TEXT NOT NULL,at INTEGER NOT NULL)"
 ].join(';')+';');}
}

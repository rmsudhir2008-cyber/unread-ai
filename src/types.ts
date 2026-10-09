export type Priority = 'Critical'|'High'|'Medium'|'Low'|'Informational';
export type TaskStatus = 'open'|'completed'|'dismissed';
export interface Message { id:string; raw:string; sender:string; timestamp?:string; text:string; line:number; kind?:'message'|'system'; edited?:boolean; deleted?:boolean; media?:'image'|'video'|'document'; }
export interface Task { id:string; description:string; sourceId:string; sender:string; assignee?:string; deadline?:Deadline; priority:Priority; confidence:number; status:TaskStatus; reason:string; }
export interface Deadline { original:string; iso?:string; label:string; ambiguous?:boolean; }
export interface Finding { id:string; kind:'priority'|'mention'|'risk'|'followup'; title:string; detail:string; sourceIds:string[]; priority:Priority; score:number; }
export interface Decision { id:string; statement:string; type:'confirmed'|'tentative'|'recommendation'|'unclear'; sourceId:string; sender:string; confidence:number; }
export interface Question { id:string; text:string; sourceId:string; sender:string; potentiallyUnanswered:boolean; resolved:boolean; }
export interface Analysis { summary:string; topic:string; findings:Finding[]; tasks:Task[]; decisions:Decision[]; questions:Question[]; deadlines:Deadline[]; mentions:string[]; analyzedAt:string; engineVersion:string; }
export interface Conversation { id:string; title:string; userName:string; messages:Message[]; analysis?:Analysis; createdAt:string; updatedAt:string; isDemo?:boolean; }

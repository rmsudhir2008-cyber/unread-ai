import type {Message} from '../types';

type Match={timestamp:string;sender:string;text:string;system?:boolean};
const bracketed=/^\[([^\]]+)\]\s*([^:]+):\s?(.*)$/;
const whatsappDash=/^([^,]+,\s*[^-]+)\s+-\s+([^:]+):\s?(.*)$/;
const genericTime=/^(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*([^:]+):\s?(.*)$/i;
const genericSender=/^([^:]{1,80}):\s*(.*)$/;
const whatsappDate=/^\[?\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]?/i;
const mediaPattern=/^(<(?:image|video|document) omitted>|(?:image|video|document) omitted)$/i;
function matchLine(line:string):Match|undefined{
 const bracket=bracketed.exec(line); if(bracket)return {timestamp:bracket[1].trim(),sender:bracket[2].trim(),text:bracket[3].trim()};
 const dash=whatsappDash.exec(line); if(dash&&/\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4}/.test(dash[1]))return {timestamp:dash[1].trim(),sender:dash[2].trim(),text:dash[3].trim()};
 const time=genericTime.exec(line); if(time)return {timestamp:time[1].trim(),sender:time[2].trim(),text:time[3].trim()};
 if(whatsappDate.test(line))return {timestamp:line.match(whatsappDate)?.[0]||'',sender:'System',text:line.replace(whatsappDate,'').trim(),system:true};
 const generic=genericSender.exec(line); if(generic)return {timestamp:'',sender:generic[1].trim(),text:generic[2].trim()};
 return undefined;
}
function meta(text:string){const media=mediaPattern.exec(text)?.[1]?.replace(/[<>]/g,'').toLowerCase();return {media:media?.startsWith('image')?'image':media?.startsWith('video')?'video':media?.startsWith('document')?'document':undefined,deleted:/this message was deleted|you deleted this message/i.test(text),edited:/<this message was edited>|\(edited\)/i.test(text)} as const}
export function parseConversation(input:string):Message[]{
 const lines=input.replace(/\r\n/g,'\n').split('\n');const out:Message[]=[];let current:Message|undefined;
 lines.forEach((line,i)=>{if(!line.trim())return;const match=matchLine(line);
  if(match){const info=meta(match.text);current={id:`m-${out.length+1}`,raw:line,sender:match.sender||'System',timestamp:match.timestamp||undefined,text:match.text||'(empty message)',line:i+1,kind:match.system?'system':'message',...info};out.push(current)}
  else if(current){current.text+=`\n${line.trim()}`;current.raw+=`\n${line}`;const info=meta(current.text);current.media=info.media;current.deleted=info.deleted;current.edited=info.edited}
  else {current={id:`m-${out.length+1}`,raw:line,sender:'Unknown',text:line.trim(),line:i+1,kind:'system'};out.push(current)}
 });return out;
}
export function validateInput(input:string){if(!input.trim())return 'Paste or import a conversation first.';if(input.length>250000)return 'Keep conversations under 250 KB for responsive local analysis.';return undefined;}

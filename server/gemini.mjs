import { once } from 'node:events';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const priorities = new Set(['Critical','High','Medium','Low','Informational']);
const decisionTypes = new Set(['confirmed','tentative','recommendation','unclear']);
const validStatuses = new Set(['open','completed','dismissed']);
const text = (value, fallback='') => typeof value === 'string' ? value.trim() : fallback;
const list = value => Array.isArray(value) ? value : [];
const safeJson = value => { try { return JSON.parse(value); } catch { return null; } };

function extractJson(payload){
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const raw = parts.map(part => part.text || '').join('').trim();
  return safeJson(raw) || safeJson(raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
}

function normalizeAnalysis(input, messages){
  const known = new Set(messages.map(message => message.id));
  const sourceId = value => known.has(value) ? value : messages[0]?.id || 'm-1';
  const sourceIds = value => list(value).map(sourceId).filter((id,index,all)=>all.indexOf(id)===index);
  const findings = list(input?.findings).map((item,index)=>({
    id:text(item?.id,`f-ai-${index+1}`), kind:['priority','mention','risk','followup'].includes(item?.kind)?item.kind:'priority',
    title:text(item?.title,'Important signal'), detail:text(item?.detail,'AI identified this message as relevant.'), sourceIds:sourceIds(item?.sourceIds),
    priority:priorities.has(item?.priority)?item.priority:'Medium', score:Math.max(0,Math.min(100,Number(item?.score)||50))
  }));
  const tasks = list(input?.tasks).map((item,index)=>({
    id:text(item?.id,`task-ai-${index+1}`), description:text(item?.description,'Follow up on this item.'), sourceId:sourceId(item?.sourceId), sender:text(item?.sender,'Unknown'), assignee:text(item?.assignee)||undefined,
    deadline:item?.deadline&&typeof item.deadline==='object'?{original:text(item.deadline.original),label:text(item.deadline.label,text(item.deadline.original)),iso:text(item.deadline.iso)||undefined,ambiguous:Boolean(item.deadline.ambiguous)}:undefined,
    priority:priorities.has(item?.priority)?item.priority:'Medium', confidence:Math.max(0,Math.min(1,Number(item?.confidence)||0.7)), status:validStatuses.has(item?.status)?item.status:'open', reason:text(item?.reason,'AI-extracted action item')
  }));
  const decisions = list(input?.decisions).map((item,index)=>({id:text(item?.id,`d-ai-${index+1}`),statement:text(item?.statement),type:decisionTypes.has(item?.type)?item.type:'unclear',sourceId:sourceId(item?.sourceId),sender:text(item?.sender,'Unknown'),confidence:Math.max(0,Math.min(1,Number(item?.confidence)||0.7))})).filter(item=>item.statement);
  const questions = list(input?.questions).map((item,index)=>({id:text(item?.id,`q-ai-${index+1}`),text:text(item?.text),sourceId:sourceId(item?.sourceId),sender:text(item?.sender,'Unknown'),potentiallyUnanswered:Boolean(item?.potentiallyUnanswered),resolved:Boolean(item?.resolved)})).filter(item=>item.text);
  const deadlines = list(input?.deadlines).map(item=>({original:text(item?.original),label:text(item?.label,text(item?.original)),iso:text(item?.iso)||undefined,ambiguous:Boolean(item?.ambiguous)})).filter(item=>item.original||item.label);
  return {
    summary:text(input?.summary,`${messages.length} messages reviewed with Gemini.`), topic:text(input?.topic,'Conversation briefing'), findings, tasks, decisions, questions, deadlines,
    mentions:sourceIds(input?.mentions), analyzedAt:new Date().toISOString(), engineVersion:`gemini-${MODEL}`
  };
}

async function readBody(req){
  let body='';
  req.setEncoding?.('utf8');
  for await (const chunk of req) { body += chunk; if(body.length>420000) throw new Error('Request too large.'); }
  return JSON.parse(body || '{}');
}

export async function handleGeminiApi(req,res){
  if(req.method !== 'POST'){res.statusCode=405;res.setHeader('Allow','POST');res.end(JSON.stringify({error:'POST required'}));return true;}
  const key=process.env.GEMINI_API_KEY;
  if(!key){res.statusCode=503;res.end(JSON.stringify({error:'Gemini is not configured on the server.'}));return true;}
  try{
    const body=await readBody(req); const messages=list(body.messages); const userName=text(body.userName,'');
    if(!messages.length){res.statusCode=400;res.end(JSON.stringify({error:'No messages supplied.'}));return true;}
    const compact=messages.map(message=>({id:message.id,sender:message.sender,timestamp:message.timestamp||'',text:message.text}));
    const prompt=`You are Briefme, a conversation-intelligence assistant. Analyze the supplied conversation for actionable understanding, not a generic summary. Return ONLY valid JSON matching the requested shape. Preserve exact source message IDs for every finding, task, decision, question, deadline, and mention. Do not invent facts. Treat relative dates as ambiguous unless the conversation provides enough context. The user's identity is ${userName||'not specified'}.

Conversation messages:\n${JSON.stringify(compact)}\n\nReturn an object with: summary (2-4 concise sentences), topic, findings [{id,kind, title,detail,sourceIds,priority,score}], tasks [{id,description,sourceId,sender,assignee,deadline:{original,label,iso,ambiguous},priority,confidence,status,reason}], decisions [{id,statement,type,sourceId,sender,confidence}], questions [{id,text,sourceId,sender,potentiallyUnanswered,resolved}], deadlines [{original,label,iso,ambiguous}], mentions [message IDs]. Use priority Critical/High/Medium/Low/Informational, kind priority/mention/risk/followup, decision type confirmed/tentative/recommendation/unclear, and task status open/completed/dismissed.`;
    const response=await fetch(`${API_ROOT}/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.2,responseMimeType:'application/json'}})});
    const provider=await response.json();
    if(!response.ok) throw new Error(provider?.error?.message||'Gemini request failed.');
    const analysis=normalizeAnalysis(extractJson(provider),messages);
    res.statusCode=200;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({analysis,model:MODEL}));
  }catch(error){res.statusCode=502;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:error instanceof Error?error.message:'Gemini analysis failed.'}));}
  return true;
}

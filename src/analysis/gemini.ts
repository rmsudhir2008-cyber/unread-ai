import type {Analysis,Message} from '../types';

export async function analyzeWithGemini(messages:Message[],userName=''):Promise<Analysis>{
 const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,userName})});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(typeof payload.error==='string'?payload.error:'Gemini analysis failed.');
 if(!payload.analysis)throw new Error('Gemini returned no analysis.');
 return payload.analysis as Analysis;
}

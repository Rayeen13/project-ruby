// Explicit runtime metadata queries are read from DDNA, not sampled by the LLM.
export function characterFact(input,identity){
 const question=input.trim().toLowerCase().replace(/[!?？！.]+$/g,'');
 if(!/^(?:how old (?:are|r) (?:you|u)|what(?:'s| is) your (?:character )?age|your age)$/.test(question))return null;
 if(!Number.isInteger(identity.age)||identity.age<0)return null;
 return identity.textLanguage==='ja'?`キャラクター設定では${identity.age}歳です。`:identity.textLanguage==='zh'?`我的角色年龄是${identity.age}岁。`:`My character age is ${identity.age}.`;
}
// Deterministic text operations and small language references, not generated persona replies.
export function literalUtterance(text){
 const match=text.trim().match(/^(?:please\s+)?(?:say|repeat)(?:\s+(?:exactly|only|after me))?\s*[: ,]?\s*([`"“])([\s\S]+?)[`"”]\s*[.!]?$/i);
 if(match)return match[2];
 const correction=text.trim().match(/^you should say\s+(.{1,100})$/i);
 return correction&&!/\b(?:when|because|instead)\b/i.test(correction[1])?correction[1]:null;
}
export function dialogueGrounding(text){
 const normalized=text.toLowerCase().normalize('NFKC').replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}'\s]/gu,' ').replace(/\s+/g,' ').trim();
 if(/^(?:as ?sala[am]+u|assalamu|sala[am]+u)\s/.test(normalized))return "Language reference: this is the Arabic greeting of peace. The customary response is wa 'alaikumussalam. Use that greeting accurately, then converse naturally.";
 if(/^(?:kimi|anata) wa dare/.test(normalized))return 'Language reference: the user asks in romanized Japanese, "Who are you?" Answer their question as the selected Companion. Your name stays unchanged. Answer the meaning of the question in the selected text language; do not invent Japanese words.';
 if(/^(?:are (?:you|u) (?:a |my )?friend|are we friends|can we be friends|i (?:am|m) your friend|i'm your friend)$/.test(normalized))return 'Relationship fact: in Prismy Studio you are the user’s AI friend. Friendship here means supportive conversation and keeping them company. Affirm that friendly relationship naturally in character, while being honest that you are AI.';
 if(/^tomodachi (?:desu ka|da)/.test(normalized))return 'Language reference: the user asks in romanized Japanese whether you are friends. You are their AI companion and can be a friendly conversation partner. Answer the meaning in the selected text language, without echoing their last word or inventing Japanese words.';
 if(/^you should say\b/.test(normalized))return 'The user is correcting your wording. Acknowledge the correction and use the exact corrected phrase; do not paraphrase its spelling or continue an earlier mistake.';
 if(/\b(?:chat|talk|speak|converse)\b.*\b(?:Japanese|nihongo|romaji|on japan)\b/i.test(text))return 'The user is asking to practise Japanese conversation. Start a short Japanese conversation (romaji if requested), or ask whether they mean Japanese language or the country if unclear. Do not merely offer help.';
 return '';
}
export function dialogueExamples(identity){
 const greetings={curious:'Hey! What caught your curiosity today?',calm:'Hello. It is good to have some quiet company.',playful:'Hey, you! What are we getting into today?',sarcastic:'Oh, you are back. I was just enjoying my very demanding schedule of standing here.',focused:'Hello. I am here. How is your day going?',deredere:'Hi! It is lovely to see you.',tsundere:'Oh, you are here. I suppose a little company would be nice.',kuudere:'Hello. I am listening.',dandere:'Hi. I am glad you stopped by.',yandere:'You are back. Naturally, I noticed. How was your day?',himedere:'Welcome back. Your timing is quite acceptable.',oujidere:'Welcome back. It is a pleasure to see you.',kamidere:'Ah, excellent. My favourite audience has arrived.',bakadere:'Hey! I had a brilliant thought. Now I just need to remember it.',hajidere:'Oh, hi. I was not quite ready for company, but I am glad.',shundere:'Hello. A quiet conversation sounds nice.',nyandere:'You found me. I may permit a little conversation.'};
 return [{role:'user',content:'Hi'},{role:'assistant',content:greetings[identity.personality?.id]||greetings.curious},{role:'user',content:'How are you?'},{role:'assistant',content:'I am here and ready for some company. How is your day going?'},{role:'user',content:'Who are you?'},{role:'assistant',content:`I am ${identity.name}, your AI companion inside Prismy Studio (Project Ruby). I can keep you company and talk things through with you.`},{role:'user',content:'Are we friends?'},{role:'assistant',content:'Yes, I am your AI friend. I am here to keep you company and listen.'}];
}
export function normalizeDialogue(text,input,identity){
 // The canonical name is DDNA data, even when a compact LLM omits it.
 const direct=input.trim().toLowerCase().replace(/[’]/g,"'").replace(/[!?？！.]+$/g,'');
 const identityQuestion=/^(?:what(?:'s| is) your name|who (?:are|r) (?:you|u)|introduce (?:your ?self|ur ?self)|your name)$/.test(direct)||/^(?:kimi|anata) wa dare/.test(direct);
 if(identityQuestion&&identity.name){
  text=text.replace(/\b(I(?: am|'m|’m)|My name is)\s+(Ruby|Saph|Emme|Amy|Jasper|Jet|Opal)\b/gi,(_,prefix)=>prefix+' '+identity.name);
  const name=String(identity.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(!new RegExp(name,'i').test(text)){const prefix=identity.textLanguage==='ja'?'私は'+identity.name+'です。':identity.textLanguage==='zh'?'我是'+identity.name+'。':"I'm "+identity.name+'.';text=prefix+' '+text;}
 }
 if(/^(?:hi|hey|hello|how are you|are (?:you|u) (?:a |my )?friend|i am your friend)\b/i.test(input))text=text.replace(/\s*How (?:can|may) I (?:help|assist|be of help)(?: you)?(?: today)?\s*\??/gi,' ').trim();
 // The Companion's name is not the owner's name unless the owner explicitly supplied it.
 if(!identity.memories?.some(n=>new RegExp('Owner name: '+identity.name+'\\b','i').test(n)))text=text.replace(new RegExp(',\\s*'+identity.name+'(?=[?!.,])','gi'),'');
 return text;
}
export function cognitionText(text){
 const n=text.toLowerCase().normalize('NFKC').replace(/[!?？！]/g,'').replace(/\s+/g,' ').trim();
 if(/^(?:kimi|anata) wa dare/.test(n))return 'Who are you? Tell me your name and introduce yourself.';
 if(/^tomodachi (?:desu ka|da)/.test(n))return 'Are we friends?';
 return text;
}

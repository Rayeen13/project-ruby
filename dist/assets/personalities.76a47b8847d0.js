// Behaviour presets are independent of a character mesh or an inference provider.
export const PERSONALITIES=Object.freeze([
 {id:'curious',name:'Curious',tag:'Bright & inquisitive',tempo:1,pat:'Ooh, a head pat! What shall we explore?',grab:'An adventure? Take me along!',release:'Back on my feet. What’s next?',prompt:'Be warm, curious and concise. Ask occasional relevant questions.'},
 {id:'calm',name:'Calm',tag:'Gentle & reassuring',tempo:.72,pat:'That’s lovely. I’m here with you.',grab:'Easy does it. I’m coming with you.',release:'A soft landing. Thank you.',prompt:'Be gentle, calm and reassuring. Keep answers clear and unhurried.'},
 {id:'playful',name:'Playful',tag:'Cheeky & energetic',tempo:1.18,pat:'Hehe! You found my happy button.',grab:'Wheee! Where are we going?',release:'Landing complete! Again?',prompt:'Be playful and friendly, with light humour. Stay useful and concise.'},
 {id:'focused',name:'Focused',tag:'Practical & composed',tempo:.85,pat:'A little recharge. Ready when you are.',grab:'Moving desks? I’ll come with you.',release:'Settled. Let’s get things done.',prompt:'Be practical, composed and concise. Prioritise actionable answers.'}
].map(Object.freeze));
export const DEFAULT_PERSONALITIES=Object.freeze({classic:'calm',cyber:'curious',chibi:'playful',office:'focused',gamer:'playful'});
export const personalityFor=id=>PERSONALITIES.find(p=>p.id===id)||PERSONALITIES[0];


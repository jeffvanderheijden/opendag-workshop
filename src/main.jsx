import React,{useEffect,useRef,useState}from'react';
import{createRoot}from'react-dom/client';
import Phaser from'phaser';
import { makeTopDownCampusScene } from './TopDownCampusScene.js';
import{Play,Lightbulb,X,MapPin,RotateCcw,Terminal,ChevronRight}from'lucide-react';
import'./style.css';

const QUESTS={
 sam:{
  id:'sam',number:'01',name:'Mr. van der Heijden',role:'Technisch instructeur',
  title:'Jouw eerste GLR-pas',lesson:'Variabelen',portrait:'/assets/portraits/mr-van-der-heijden.webp',
  intro:'Hé, jij bent nieuw toch? Voor de open dag gebruiken we een digitale pas om te laten zien wie je bent en welke opleiding je bezoekt. Die van jou is nog leeg. Kun jij hem instellen?',
  starter:'let naam = "???";\nlet opleiding = "???";',
  steps:[
   {title:'Wie ben jij?',text:'Een variabele kan informatie bewaren. Vervang ??? bij naam door je eigen naam.',hint:'Laat de aanhalingstekens staan. Bijvoorbeeld: let naam = "Alex";',check:c=>/naam\s*=\s*["'][^?"'][^"']*["']/.test(c)},
   {title:'Welke opleiding?',text:'Vul bij opleiding Creative Software Developer in. Zo weet een bezoeker meteen waar jij bij hoort.',hint:'Schrijf precies: "Creative Software Developer"',check:c=>/opleiding\s*=\s*["']Creative Software Developer["']/.test(c)}
  ]
 },
 css:{
  id:'css',number:'02',name:'Mvr. Heinsdijk',role:'Nederlands docent / studentcoördinator',
  title:'Welkom op B5',lesson:'HTML + CSS',portrait:'/assets/portraits/mvr-heinsdijk.webp',
  intro:'Voor de open dag staat hier een welkomstscherm, maar de informatie is nog niet af. Bezoekers moeten meteen begrijpen wat hier te doen is. Kun jij het scherm afmaken?',
  starter:'<h1>Welkom bij ???</h1>\n<p>Vandaag kun je een ??? volgen.</p>\n\nh1 {\n  color: gray;\n}',
  steps:[
   {title:'De opleiding',text:'Vervang de eerste ??? door Creative Software Developer.',hint:'De eerste regel wordt: <h1>Welkom bij Creative Software Developer</h1>',check:c=>/<h1>\s*Welkom bij Creative Software Developer\s*<\/h1>/i.test(c)},
   {title:'Wat gebeurt hier?',text:'Vervang de tweede ??? door workshop. Bezoekers weten dan wat ze in B5.420 en B5.430 kunnen doen.',hint:'De regel wordt: <p>Vandaag kun je een workshop volgen.</p>',check:c=>/<p>\s*Vandaag kun je een workshop volgen\.\s*<\/p>/i.test(c)},
   {title:'GLR-stijl',text:'Maak de titel GLR-groen door gray te vervangen door #78c841.',hint:'Gebruik: color: #78c841;',check:c=>/color\s*:\s*#78c841/i.test(c)}
  ]
 },
 game:{
  id:'game',number:'03',name:'Mvr. Goldewijk',role:'Technisch docent',
  title:'De workshopdemo',lesson:'Getallen + beweging',portrait:'/assets/portraits/mvr-goldewijk.webp',
  intro:'In B5.430 laten we straks een kleine game-demo zien. Het character moet automatisch naar de workshopplek lopen, maar stopt nu halverwege. Kun jij de route goed instellen?',
  starter:'let startX = 100;\nlet afstandNaarWorkshop = 50;\n\nlet spelerX = startX + afstandNaarWorkshop;',
  steps:[
   {title:'Het startpunt',text:'Zet startX van 100 op 200. Daarmee begint het character vanaf de juiste plek in de gang.',hint:'Verander alleen 100 in 200.',check:c=>/startX\s*=\s*200/.test(c)},
   {title:'Naar B5.430',text:'Verander afstandNaarWorkshop van 50 naar 300. Dan bereikt het character de workshopruimte.',hint:'Verander alleen 50 in 300.',check:c=>/afstandNaarWorkshop\s*=\s*300/.test(c)}
  ]
 },

 kim:{
  id:'kim',number:'04',name:'Mvr. Smit',role:'Onderwijsassistent',
  title:'De 3D-printer voor de open dag',lesson:'Instellingen + variabelen',portrait:'/assets/portraits/kim-smit.webp',
  intro:'In B5.400A willen we tijdens de open dag kleine GLR-sleutelhangers printen. De 3D-printer staat klaar, maar de instellingen kloppen nog niet. Kun jij ze goed zetten voordat de eerste bezoekers komen?',
  starter:'let model = "GLR-sleutelhanger";\nlet materiaal = "???";\nlet laagDikte = 0.4;',
  steps:[
   {title:'Kies het materiaal',text:'Voor deze demo gebruiken we PLA. Vervang ??? bij materiaal door PLA.',hint:'Laat de aanhalingstekens staan: let materiaal = "PLA";',check:c=>/materiaal\s*=\s*["']PLA["']/i.test(c)},
   {title:'Netter printen',text:'Zet laagDikte van 0.4 naar 0.2. Een kleinere laagdikte geeft voor deze demo een netter resultaat.',hint:'Verander alleen 0.4 in 0.2.',check:c=>/laagDikte\s*=\s*0\.2/.test(c)}
  ]
 },
 final:{
  id:'final',number:'05',name:'Mr. Bijlsma',role:'Technisch docent',
  title:'De open-dagterminal',lesson:'Combineren',portrait:'/assets/portraits/mr-bijlsma.webp',
  intro:'Volgens mij heb jij inmiddels de hele afdeling gezien. We missen alleen nog de informatie op de bezoekersdisplay. Kun jij de laatste gegevens invullen?',
  starter:'let opleiding = "???";\nlet workshop = "???";\nlet voorlichting = "???";',
  steps:[
   {title:'Opleiding',text:'Vul Creative Software Developer in als opleiding.',hint:'Gebruik: let opleiding = "Creative Software Developer";',check:c=>/opleiding\s*=\s*["']Creative Software Developer["']/.test(c)},
   {title:'Workshop',text:'Je hebt onderweg gezien waar de workshops zijn. Vul B5.420 / B5.430 in.',hint:'Gebruik precies: "B5.420 / B5.430"',check:c=>/workshop\s*=\s*["']B5\.420\s*\/\s*B5\.430["']/.test(c)},
   {title:'Voorlichting',text:'De voorlichting is in B5.450. Vul dat lokaal in.',hint:'Gebruik: let voorlichting = "B5.450";',check:c=>/voorlichting\s*=\s*["']B5\.450["']/.test(c)}
  ]
 }
};

const TEACHER_TITLES={sam:'Technisch instructeur',css:'Nederlands docent / studentcoördinator',game:'Technisch docent',kim:'Onderwijsassistent',final:'Technisch docent'};
const teacherTitle=q=>TEACHER_TITLES[q.id]||q.role||'';

function quoted(code,key,def='???'){
 const m=code.match(new RegExp(`${key}\\s*=\\s*["']([^"']*)["']`));
 return m?.[1]||def;
}
function parsePass(code){return{name:quoted(code,'naam'),study:quoted(code,'opleiding')}}
function parseWelcome(code){
 const heading=code.match(/<h1>\s*([^<]+)\s*<\/h1>/i)?.[1]||'Welkom bij ???';
 const copy=code.match(/<p>\s*([^<]+)\s*<\/p>/i)?.[1]||'Vandaag kun je een ??? volgen.';
 const color=code.match(/color\s*:\s*([^;\n}]+)/i)?.[1]?.trim()||'gray';
 return{heading,copy,color};
}
function parseDemo(code){
 const start=parseInt(code.match(/startX\s*=\s*(\d+)/)?.[1]||100);
 const distance=parseInt(code.match(/afstandNaarWorkshop\s*=\s*(\d+)/)?.[1]||50);
 return Math.min(500,start+distance);
}
function parsePrinter(code){return{model:quoted(code,'model','GLR-sleutelhanger'),materiaal:quoted(code,'materiaal','???'),laag:parseFloat(code.match(/laagDikte\s*=\s*([0-9.]+)/)?.[1]||0.4)}}
function parseTerminal(code){return{opleiding:quoted(code,'opleiding'),workshop:quoted(code,'workshop'),voorlichting:quoted(code,'voorlichting')}}

function World({locked,done,onTalk,onSign}){
 const host=useRef(null),game=useRef(null),talkRef=useRef(onTalk),signRef=useRef(onSign),lockedRef=useRef(locked);
 useEffect(()=>{talkRef.current=onTalk},[onTalk]);
 useEffect(()=>{signRef.current=onSign},[onSign]);
 useEffect(()=>{lockedRef.current=locked},[locked]);
 useEffect(()=>{
   if(game.current)return;
   const Scene=makeTopDownCampusScene({done,lockedRef,talkRef,signRef});
   game.current=new Phaser.Game({
    type:Phaser.AUTO,parent:host.current,width:1200,height:720,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:1200,height:720},
    backgroundColor:'#111923',physics:{default:'arcade',arcade:{debug:false}},scene:Scene,
    render:{antialias:true,antialiasGL:true,pixelArt:false,roundPixels:true,resolution:Math.min(window.devicePixelRatio||1,2)},input:{keyboard:true}
   });
   return()=>{game.current?.destroy(true);game.current=null};
 },[done.join('|')]);
 return <div className="gamewrap topdown"><div className="gameBrief"><b>Je eerste dag op B5.</b><span>Vandaag is er ook een open dag.</span><span>Leer de afdeling kennen en help waar je kunt.</span><span>Een <strong>!</strong> betekent dat iemand jouw hulp kan gebruiken.</span></div><div className="gameControls"><div className="wasd"><i>W</i><i>A</i><i>S</i><i>D</i><small>Bewegen</small></div><div className="ekey"><i>E</i><small>Interactie</small></div></div><div className="gamehost" ref={host}/></div>;
}

function Preview({quest,code}){
 if(quest.id==='sam'){
  const p=parsePass(code);return <div className="studentcard"><b>GLR // OPEN DAG</b><strong>{p.name}</strong><span>{p.study}</span><small>B5 · NIEUWE STUDENT</small></div>
 }
 if(quest.id==='css'){
  const p=parseWelcome(code);return <div className="webpreview openDayPreview"><div className="fakeurl">OPEN DAG · B5.420 / B5.430</div><h3 style={{color:p.color}}>{p.heading}</h3><p>{p.copy}</p><button>BEKIJK DE WORKSHOP</button></div>
 }
 if(quest.id==='game'){
  const x=parseDemo(code);return <div className="robotworld routepreview"><div className="track"/><span className="routeStart">START</span><div className="robot" style={{left:`${Math.min(82,8+x/6)}%`}}>🧑‍💻</div><div className="charger">B5.430</div><small>positie ≈ {x}</small></div>
 }
 if(quest.id==='kim'){
  const p=parsePrinter(code);const ready=p.materiaal.toUpperCase()==='PLA'&&Math.abs(p.laag-0.2)<0.001;return <div className={'printerPreview '+(ready?'ready':'')}><div className="printerBody"><div className="printerTop"/><div className="printerBed"><i/></div><div className="printerHead"/></div><div className="printerInfo"><b>3D-PRINTER · B5.400A</b><span>MODEL <strong>{p.model}</strong></span><span>MATERIAAL <strong>{p.materiaal}</strong></span><span>LAAGDIKTE <strong>{p.laag} mm</strong></span><small>{ready?'KLAAR VOOR DE OPEN DAG':'INSTELLINGEN CONTROLEREN'}</small></div></div>
 }
 const p=parseTerminal(code);return <div className="system online visitorTerminal"><Terminal/><b>GLR // OPEN DAG</b><span>{p.opleiding}</span><div className="terminalRows"><span>WORKSHOP <strong>{p.workshop}</strong></span><span>VOORLICHTING <strong>{p.voorlichting}</strong></span><span>MINOREN <strong>B5.400A</strong></span><span>DESIGN <strong>B5.400B</strong></span></div></div>
}

function Dialogue({quest,onClose,onAccept}){return <div className="dialogueLayer" role="dialog" aria-modal="true" aria-label={`Gesprek met ${quest.name}`}><div className="dialogueSceneShade"/><div className="dialogueWrap"><div className="dialoguePortrait"><img src={quest.portrait} alt={`Portret van ${quest.name}`}/></div><div className="dialogueBox"><div className="dialogueName"><b>{quest.name}</b><span>{teacherTitle(quest)}</span></div><p>{quest.intro}</p><div className="dialogueActions"><button className="dialogueLater" onClick={onClose}>LATER</button><button className="dialogueHelp" onClick={onAccept}><ChevronRight/> HELPEN</button></div></div></div></div>}

function Challenge({quest,onClose,onComplete}){
 const[code,setCode]=useState(quest.starter),[step,setStep]=useState(0),[hint,setHint]=useState(false),[feedback,setFeedback]=useState('');
 const s=quest.steps[step];
 const run=()=>{if(s.check(code)){if(step<quest.steps.length-1){setStep(v=>v+1);setHint(false);setFeedback('Gelukt. Het werkt meteen in de open-dagvoorbereiding. Nog één stap.')}else onComplete(quest.id)}else setFeedback('Dat is nog niet helemaal goed. Probeer het opnieuw of gebruik een hint.')};
 const concept=quest.id==='sam'?'Variabelen bewaren informatie, zoals je naam en opleiding.':quest.id==='css'?'HTML geeft informatie betekenis; CSS bepaalt hoe bezoekers die informatie zien.':quest.id==='game'?'Getallen kunnen posities en beweging in een game bepalen.':quest.id==='kim'?'Ook apparaten werken met instellingen die je in code als waarden kunt opslaan en aanpassen.':'Je gebruikt informatie uit de wereld om een programma compleet te maken.';
 return <div className="overlay"><div className="challenge"><section className="lesson"><div className="eyebrow">OPEN DAG TAAK {quest.number}</div><h1>{quest.title}</h1><div className="speech"><div className="portrait"><img src={quest.portrait} alt=""/></div><p><b>{quest.name}</b><small>{teacherTitle(quest)}</small>{quest.intro}</p></div><div className="steps">{quest.steps.map((_,i)=><span key={i} className={i<=step?'on':''}>{i<step?'✓':i+1}</span>)}</div><h2>{s.title}</h2><p>{s.text}</p><div className="concept"><b>{quest.lesson.toUpperCase()}</b><span>{concept}</span></div>{hint&&<div className="hint"><Lightbulb/>{s.hint}</div>}<button className="ghost" onClick={()=>setHint(true)}><Lightbulb/> Geef me een hint</button>{feedback&&<div className="feedback">{feedback}</div>}</section><section className="workspace"><div className="editorbar"><span>{quest.id==='css'?'welkom.html':quest.id==='kim'?'3d-printer.js':quest.id==='final'?'open-dag.js':'challenge.js'}</span><div className="editoractions"><b>STAP {step+1}/{quest.steps.length}</b><button className="close" onClick={onClose} aria-label="Sluit opdracht"><X/> <span>SLUITEN</span></button></div></div><textarea aria-label="Code editor" value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.stopPropagation()} spellCheck="false"/><div className="preview"><small>LIVE RESULTAAT</small><Preview quest={quest} code={code}/></div><button className="run" onClick={run}><Play fill="currentColor"/> TEST MIJN CODE</button></section></div></div>
}

const WAYFINDING=[
 {room:'B5.400A',activity:'Minoren'},
 {room:'B5.400B',activity:'Design'},
 {room:'B5.420',activity:'Workshop'},
 {room:'B5.430',activity:'Workshop'},
 {room:'B5.450',activity:'Voorlichting'},
];
function Wayfinding({onClose}){return <div className="wayfindingLayer" role="dialog" aria-modal="true" aria-label="Open dag bewegwijzering"><div className="wayfindingCard"><div className="wayfindingHeader"><div><span>OPEN DAG</span><h2>Waar gebeurt wat?</h2></div><button onClick={onClose} aria-label="Sluiten"><X/></button></div><p className="wayfindingIntro">Onthoud deze plekken. Tijdens je eerste dag ga je deze informatie nog nodig hebben.</p><div className="wayfindingList">{WAYFINDING.map(item=><div className="wayfindingRow" key={item.room}><div className="wayfindingRoom"><MapPin/>{item.room}</div><strong>{item.activity}</strong></div>)}</div><div className="wayfindingTip"><kbd>E</kbd><span>Je kunt altijd terugkomen als je een lokaal vergeten bent.</span></div></div></div>}

function Victory({onClose}){return <div className="overlay victory"><div className="victorybox"><div className="bigcheck">✓</div><div className="eyebrow">B5 KLAAR VOOR DE OPEN DAG</div><h1>Je eerste dag zit er bijna op.</h1><p>Je hebt niet alleen code aangepast, maar ondertussen ook de afdeling leren kennen en meegeholpen aan de open dag.</p><div className="pitch"><b>DIT HEB JE VANDAAG GEDAAN</b><span>Je maakte je eigen GLR-pas, zette een welkomstscherm klaar, stuurde een workshopdemo met code, stelde een 3D-printer in en maakte de bezoekersinformatie compleet.</span></div><div className="learned"><span>VARIABELEN</span><span>HTML + CSS</span><span>GAME LOGICA</span><span>3D PRINTING</span><span>B5 LEREN KENNEN</span></div><button onClick={onClose}>VERDER RONDKIJKEN</button></div></div>}

function Intro({onStart}){return <div className="intro"><div className="introcard"><h1>Je eerste dag op GLR.</h1><p>Vandaag begin je bij <b>Creative Software Developer</b>. Op B5 is ook een open dag bezig. Loop rond, leer de afdeling kennen en help de docenten met de laatste voorbereidingen.</p><div className="missionbrief"><span><b>WASD</b> Verken B5 · Shift = sprint</span><span><b>E</b> Praat en bekijk informatie</span><span><b>!</b> Hier kan jouw hulp het verschil maken</span></div><p className="zero"><b>Nog nooit geprogrammeerd?</b> Prima. Je leert onderweg steeds één klein stukje en ziet direct wat je code verandert.</p><button onClick={onStart}><Play fill="currentColor"/> START JE EERSTE DAG</button></div></div>}

function App(){
 const[started,setStarted]=useState(false),[done,setDone]=useState(()=>JSON.parse(sessionStorage.getItem('glr-v3')||'[]')),[dialogue,setDialogue]=useState(null),[active,setActive]=useState(null),[victory,setVictory]=useState(false),[wayfinding,setWayfinding]=useState(false),[toast,setToast]=useState('Welkom op B5. Bekijk eerst de bewegwijzering of zoek iemand met een !.');
 const talk=id=>{if(id==='final'&&!['sam','css','game','kim'].every(q=>done.includes(q))){setToast('Mr. Bijlsma rondt straks de bezoekersinformatie met je af. Help eerst de andere mensen op B5.');return}setDialogue(id)};
 const startChallenge=()=>{if(!dialogue)return;setActive(dialogue);setDialogue(null)};
 const completionText={sam:'Je digitale GLR-pas is klaar. Tijd om B5 verder te ontdekken.',css:'Het welkomstscherm is klaar. Bezoekers weten nu waar de workshops zijn.',game:'De workshopdemo bereikt nu B5.430. De demo is klaar voor bezoekers.',kim:'De 3D-printer in B5.400A staat goed ingesteld. De eerste sleutelhanger kan worden geprint.',final:'De bezoekersdisplay is compleet. B5 is klaar voor de open dag.'};
 const complete=id=>{const next=done.includes(id)?done:[...done,id];setDone(next);sessionStorage.setItem('glr-v3',JSON.stringify(next));setActive(null);setToast(completionText[id]);if(id==='final')setVictory(true)};
 const reset=()=>{sessionStorage.removeItem('glr-v3');setDone([]);setDialogue(null);setActive(null);setVictory(false);setWayfinding(false);setToast('Nieuwe eerste dag gestart. Bekijk de bewegwijzering of zoek iemand met een !.')};
 const helped=done.filter(id=>id!=='final').length;
 return <div className="app v2">{!started&&<Intro onStart={()=>setStarted(true)}/>}<header><div className="hud"><span>OPEN DAG VOORBEREIDING <b>{helped}/4</b></span></div><button className="reset topreset" onClick={reset}><RotateCcw/> reset</button></header><main className="gameonly"><World locked={!!dialogue||!!active||victory||wayfinding} done={done} onTalk={talk} onSign={()=>setWayfinding(true)}/></main><button className="gameReset" onClick={reset}><RotateCcw/> RESET</button><footer><span>{toast}</span><span className="footerhint">Verken B5 · gebruik <b>E</b> bij docenten en informatie</span></footer>{dialogue&&<Dialogue quest={QUESTS[dialogue]} onClose={()=>setDialogue(null)} onAccept={startChallenge}/>} {active&&<Challenge quest={QUESTS[active]} onClose={()=>setActive(null)} onComplete={complete}/>} {wayfinding&&<Wayfinding onClose={()=>setWayfinding(false)}/>} {victory&&<Victory onClose={()=>setVictory(false)}/>}</div>
}
createRoot(document.getElementById('root')).render(<App/>);

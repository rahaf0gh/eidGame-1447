const G={
  sb:null,demo:false,ch:null,
  OWNER_SECRET:'0000',
  sessionCode:null,playerCode:null,isAdmin:false,
  pName:'',pTeam:null,answered:false,
  phase:'lobby',qIndex:0,questions:[],
  redScore:0,blueScore:0,redPlayers:[],bluePlayers:[],history:[],
  timerVal:30,timerInt:null,sessionTimer:10,
  qBank:[],sessions:[],
  pendingImg:null,pendingCT:'image',pendingAT:'text',pendingTimer:10,
  mcqOpts:['','','',''],mcqCorrect:0,
};

function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));document.getElementById(id).classList.add('on');}
function swTab(el,id){el.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));el.classList.add('on');['tp','tc'].forEach(t=>document.getElementById(t).style.display=t===id?'block':'none');}
function checkOwner(v){if(v===G.OWNER_SECRET){document.getElementById('pCode').value='';go('s-owner');toast('👋 مرحباً!');}}

async function connectSB(){
  const url=document.getElementById('sb-url').value.trim(),key=document.getElementById('sb-key').value.trim(),st=document.getElementById('sb-st');
  if(!url||!key){toast('❗ أدخل URL و key');return;}
  st.textContent='⏳ جاري الاتصال...';
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    G.sb=createClient(url,key);
    const {error}=await G.sb.from('sessions').select('code').limit(1);
    if(error&&!['PGRST116','42P01'].includes(error.code))throw error;
    st.textContent='✅ متصل!';st.style.color='#189040';
    toast('✅ متصل!');activateOwner();
  }catch(e){st.textContent='❌ '+(e.message||'فشل');st.style.color='#C43020';}
}

function enableDemo(){
  G.demo=true;toast('🎮 وضع التجربة');activateOwner();
  G.qBank=[
    {id:'q1',content_type:'image',image_url:'https://picsum.photos/seed/a1/400/225',text_content:'',answer:'الصبر مفتاح الفرج',hint:'',type:'text',options:null},
    {id:'q2',content_type:'text',image_url:'',text_content:'ما المثل الذي يشجع على العمل الجاد؟',answer:'من جد وجد',hint:'',type:'mcq',options:['من جد وجد','الوقت كالسيف','العجلة من الشيطان','الصبر مفتاح الفرج']},
    {id:'q3',content_type:'image',image_url:'https://picsum.photos/seed/a3/400/225',text_content:'',answer:'اضرب الحديد وهو حامي',hint:'حديد',type:'text',options:null},
    {id:'q4',content_type:'text',image_url:'',text_content:'ما المثل الذي يحذر من التسرع؟',answer:'العجلة من الشيطان',hint:'',type:'mcq',options:['من جد وجد','العجلة من الشيطان','الصبر مفتاح الفرج','اضرب الحديد وهو حامي']},
    {id:'q5',content_type:'image',image_url:'https://picsum.photos/seed/a5/400/225',text_content:'',answer:'الوقت كالسيف إن لم تقطعه قطعك',hint:'',type:'text',options:null},
  ];
  renderQBank();
}

function activateOwner(){
  document.getElementById('sb-cfg').style.display='none';
  document.getElementById('oc-qbank').style.display='block';
  document.getElementById('oc-sess').style.display='block';
  if(G.sb&&!G.demo)loadOwnerData();
  initMCQ();renderQBank();renderSessions();
}

function setCT(t){G.pendingCT=t;document.getElementById('ct-img').classList.toggle('on',t==='image');document.getElementById('ct-txt').classList.toggle('on',t==='text');document.getElementById('qc-img').style.display=t==='image'?'block':'none';document.getElementById('qc-txt').style.display=t==='text'?'block':'none';}
function setAT(t){G.pendingAT=t;document.getElementById('at-text').classList.toggle('on',t==='text');document.getElementById('at-mcq').classList.toggle('on',t==='mcq');document.getElementById('qa-text').style.display=t==='text'?'block':'none';document.getElementById('qa-mcq').style.display=t==='mcq'?'block':'none';}
function initMCQ(){G.mcqOpts=['','','',''];G.mcqCorrect=0;document.getElementById('mcq-c').innerHTML=['أ','ب','ج','د'].map((l,i)=>`<div class="mcq-row"><input class="oi" placeholder="الخيار ${l}" oninput="G.mcqOpts[${i}]=this.value" style="margin-bottom:6px"><div class="ck ${i===0?'on':''}" id="ck${i}" onclick="setCorrect(${i})">✓</div></div>`).join('');}
function setCorrect(i){G.mcqCorrect=i;document.querySelectorAll('.ck').forEach((el,j)=>el.classList.toggle('on',j===i));}
function prevImg(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{G.pendingImg=ev.target.result;document.getElementById('q-img-prev').innerHTML=`<img src="${ev.target.result}" style="max-height:90px;border-radius:8px;object-fit:contain">`;};r.readAsDataURL(f);}
function pickT(el,t){G.pendingTimer=t;document.querySelectorAll('.tbtn').forEach(b=>b.classList.remove('on'));el.classList.add('on');}

async function addQ(){
  let image_url='',text_content='';
  if(G.pendingCT==='image'){if(!G.pendingImg){toast('❗ ارفع صورة');return;}image_url=G.pendingImg;}
  else{text_content=document.getElementById('q-txt-c').value.trim();if(!text_content){toast('❗ أدخل نص السؤال');return;}}
  let answer,options=null;
  if(G.pendingAT==='text'){answer=document.getElementById('q-ans').value.trim();if(!answer){toast('❗ أدخل الإجابة');return;}}
  else{const ok=G.mcqOpts.filter(o=>o.trim());if(ok.length<2){toast('❗ أدخل خيارين على الأقل');return;}answer=G.mcqOpts[G.mcqCorrect];if(!answer.trim()){toast('❗ حدد الإجابة الصحيحة');return;}options=[...G.mcqOpts];}
  const hint=document.getElementById('q-hint')?.value.trim()||'';
  const q={id:'q_'+Date.now(),content_type:G.pendingCT,image_url,text_content,answer,hint,type:G.pendingAT,options};
  if(G.sb&&!G.demo){const {data,error}=await G.sb.from('questions').insert({content_type:G.pendingCT,image_url,text_content,answer,hint,type:G.pendingAT,options:options?JSON.stringify(options):null}).select().single();if(error){toast('❌ '+error.message);return;}q.id=data.id;}
  G.qBank.push(q);renderQBank();
  G.pendingImg=null;document.getElementById('q-img-f').value='';document.getElementById('q-img-prev').innerHTML='<div style="font-size:28px">📷</div><p>انقر لرفع صورة السؤال</p>';
  document.getElementById('q-txt-c').value='';document.getElementById('q-ans').value='';document.getElementById('q-hint').value='';
  setAT('text');initMCQ();toast('✅ تم إضافة السؤال!');
}

async function delQ(id){if(G.sb&&!G.demo)await G.sb.from('questions').delete().eq('id',id);G.qBank=G.qBank.filter(q=>q.id!==id);renderQBank();toast('🗑️ تم الحذف');}

function renderQBank(){
  document.getElementById('q-count').textContent=G.qBank.length;
  const el=document.getElementById('qbank-list');
  if(!G.qBank.length){el.innerHTML='<div style="font-size:12px;color:var(--mu);padding:8px 0;text-align:center">لا توجد أسئلة بعد</div>';return;}
  el.innerHTML=G.qBank.map(q=>{
    const thumb=q.content_type==='text'?`<div class="qb-thumb">📝</div>`:`<div class="qb-thumb"><img src="${q.image_url}" alt=""></div>`;
    return `<div class="qbi">${thumb}<div class="qb-info"><div class="qb-ans">${q.answer}</div><div class="qb-meta">${q.content_type==='text'?'📝 نص':'🖼️ صورة'} • ${q.type==='mcq'?'☑️ اختيار':'✏️ نص'}${q.hint?' • 💡'+q.hint:''}</div></div><button class="qb-del" onclick="delQ('${q.id}')">✕</button></div>`;
  }).join('');
}

function genCode(){return String(Math.floor(1000+Math.random()*9000));}

async function createSession(){
  const label=document.getElementById('new-client').value.trim()||'عميل';
  const qc=parseInt(document.getElementById('new-qcount').value)||5;
  if(!G.qBank.length){toast('❗ أضف أسئلة أولاً');return;}
  const shuffled=[...G.qBank].sort(()=>Math.random()-.5);
  const picked=shuffled.slice(0,Math.min(qc,shuffled.length));
  const pCode=genCode();let aCode=genCode();while(aCode===pCode)aCode=genCode();
const init={
  phase:'lobby',
  qIndex:0,
  redScore:0,
  blueScore:0,
  redPlayers:[],
  bluePlayers:[],
  history:[],
  questions:picked,
  answers:{},
  revealedAnswer:null,
  timerSeconds:G.pendingTimer
};  if(G.sb&&!G.demo){const {error}=await G.sb.from('sessions').insert({code:pCode,admin_code:aCode,client_label:label,timer_seconds:G.pendingTimer,state:init});if(error){toast('❌ '+error.message);return;}}
  G.sessions.unshift({code:pCode,admin_code:aCode,client_label:label,state:init});renderSessions();
  document.getElementById('new-client').value='';
  const url=location.href.split('?')[0];
  const msg=`مثّل 🪔 — ${label}\n\n👥 كود اللاعبين: ${pCode}\n🎮 كود المضيف (أنت): ${aCode}\n⏱ وقت كل سؤال: ${G.pendingTimer} ثانية\n⚡ النقاط = الوقت المتبقي (أسرع = أكثر!)\n\n🔗 الرابط: ${url}\n\nاللاعبون: تاب "انضم للعبة"\nالمضيف: تاب "مشاهد / أدمن" بكود المضيف`;
  navigator.clipboard.writeText(msg).catch(()=>{});
  toast(`✅ ${pCode} (لاعبين) / ${aCode} (مضيف)`);

      console.log("ADMIN CODE:", aCode);

}

function renderSessions(){
  const el=document.getElementById('sess-list');
  if(!G.sessions.length){el.innerHTML='<div style="font-size:12px;color:var(--mu);text-align:center;padding:8px 0">لا توجد جلسات</div>';return;}
  el.innerHTML=G.sessions.map(s=>{
    const st=s.state||{},p=st.phase||'lobby';
    const ar={lobby:'انتظار',playing:'جارية',ended:'انتهت'}[p]||p;
    return `<div class="si" onclick="copyBoth('${s.code}','${s.admin_code||''}','${s.client_label||''}',${st.timerSeconds||10})"><div><div class="si-code">${s.code}</div><div class="si-meta">${s.client_label||''} • 🔴${st.redScore||0} — 🔵${st.blueScore||0} • ⏱${st.timerSeconds||10}ث${s.admin_code?` • 🎮${s.admin_code}`:''}</div></div><span class="si-ph ${p}">${ar}</span></div>`;
  }).join('');
}

function copyBoth(pCode,aCode,label,timer){
  const url=location.href.split('?')[0];
  const msg=`مثّل 🪔 — ${label}\n\n👥 كود اللاعبين: ${pCode}\n🎮 كود المضيف: ${aCode}\n⏱ ${timer}ث لكل سؤال • ⚡ النقاط حسب السرعة\n\n🔗 الرابط: ${url}`;
  navigator.clipboard.writeText(msg).then(()=>toast('📋 تم النسخ!')).catch(()=>toast(pCode+' / '+aCode));
}

async function loadOwnerData(){
  if(!G.sb)return;
  const {data:qs}=await G.sb.from('questions').select('*').order('created_at');
  if(qs){G.qBank=qs.map(q=>({...q,options:q.options?JSON.parse(q.options):null}));renderQBank();}
  const {data:ss}=await G.sb.from('sessions').select('*').order('created_at',{ascending:false}).limit(20);
  if(ss){G.sessions=ss;renderSessions();}
}

async function playerJoin(){
  const name=document.getElementById('pName').value.trim(),code=document.getElementById('pCode').value.trim();
  if(!name){toast('❗ أدخل اسمك');return;}
  if(!/^\d{4}$/.test(code)){toast('❗ الكود 4 أرقام');return;}
  let st=null;
  if(G.sb&&!G.demo){
    const {data,error}=await G.sb.from('sessions').select('*').eq('code',code).maybeSingle();
    if(error||!data){toast('❌ الكود غير موجود');return;}
    if(data.state?.phase==='ended'){toast('❌ الجلسة انتهت');return;}
    st=data.state;G.sessionTimer=data.timer_seconds||st?.timerSeconds||10;G.questions=st.questions||[];
  } else if(G.demo){
    const s=G.sessions.find(s=>s.code===code);
    if(!s){toast('❌ الكود غير موجود');return;}
    st=s.state;G.sessionTimer=st.timerSeconds||10;G.questions=st.questions||[];
  }
  G.pName=name;G.sessionCode=code;G.playerCode=code;G.isAdmin=false;
  document.getElementById('tm-code').textContent=code;
  if(st)applyState(st,'player');
  if(G.sb&&!G.demo)subSession(code,'player');
  go('s-team');toast('✅ انضممت! اختر فريقك');
}

async function clientJoin(){
  const code=document.getElementById('cCode').value.trim();
  if(!/^\d{4}$/.test(code)){
    toast('❗ الكود 4 أرقام');
    return;
  }

  let sessionData=null;
  let isAdmin=false;

  if(G.sb && !G.demo){

    // 🔴 1. تحقق من admin_code
    const { data: adminMatch } = await G.sb
      .from('sessions')
      .select('*')
      .eq('admin_code', code)
      .maybeSingle();

    if(adminMatch){
      sessionData = adminMatch;
      isAdmin = true;
    }

    // 🔵 2. تحقق من state.adminCode
    if(!sessionData){
      const { data: jsonMatch } = await G.sb
        .from('sessions')
        .select('*')
        .filter('state->>adminCode','eq',code)
        .maybeSingle();

      if(jsonMatch){
        sessionData = jsonMatch;
        isAdmin = true;
      }
    }

    // 🟡 3. تحقق من كود اللاعبين
    if(!sessionData){
      const { data: playerMatch } = await G.sb
        .from('sessions')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if(playerMatch){
        sessionData = playerMatch;
        isAdmin = false;
      }
    }

    if(!sessionData){
      toast('❌ الكود غير موجود');
      return;
    }

  } else {
    // وضع الديمو
    const byAdmin = G.sessions.find(s => 
      s.admin_code === code || s.state?.adminCode === code
    );

    if(byAdmin){
      sessionData = byAdmin;
      isAdmin = true;
    } else {
      const byPlayer = G.sessions.find(s => s.code === code);
      if(!byPlayer){
        toast('❌ الكود غير موجود');
        return;
      }
      sessionData = byPlayer;
      isAdmin = false;
    }
  }

  // ✅ ضبط القيم
  G.sessionCode = sessionData.code;
  G.playerCode = sessionData.code;
  G.isAdmin = isAdmin;

  const state = sessionData.state || {};
  G.questions = state.questions || [];
  G.sessionTimer = sessionData.timer_seconds || state.timerSeconds || 10;

  // ✅ توجيه المستخدم
  if(isAdmin){
    document.getElementById('ca-code').textContent = G.playerCode;
    caUpdateUI(state);

    if(G.sb && !G.demo){
      subSession(G.playerCode,'cadmin');
    }

    go('s-cadmin');
    toast('🎮 دخلت كـ أدمن');
  } else {
    applyState(state,'client');

    if(G.sb && !G.demo){
      subSession(G.playerCode,'client');
    }

    document.getElementById('cl-code').textContent = G.playerCode;
    go('s-client');
    toast('👀 وضع المشاهدة');
  }
}

function copyLink(){const url=location.href.split('?')[0]+'?code='+G.playerCode;navigator.clipboard.writeText(`مثّل 🪔\nالرابط: ${url}\nكود: ${G.playerCode}`).then(()=>toast('📋 تم النسخ!'));}

async function pickTeam(t){
  G.pTeam=t;
  document.getElementById('tb-r').classList.toggle('sel',t==='red');
  document.getElementById('tb-b').classList.toggle('sel',t==='blue');
  if(!G.redPlayers.includes(G.pName)&&!G.bluePlayers.includes(G.pName)){
    if(t==='red')G.redPlayers.push(G.pName);else G.bluePlayers.push(G.pName);
    syncTeams();await dbWrite({redPlayers:G.redPlayers,bluePlayers:G.bluePlayers});
  }
  checkStart();toast('✅ انضممت للفريق '+(t==='red'?'الأحمر 🔴':'الأزرق 🔵'));
}
function checkStart(){const ok=G.redPlayers.length>0&&G.bluePlayers.length>0;document.getElementById('start-wrap').style.display=ok?'block':'none';document.getElementById('wait-wrap').style.display=ok?'none':'block';}
async function startGame(){if(G.phase!=='lobby')return;await dbWrite({phase:'playing',qIndex:0,answers:{},revealedAnswer:null});}

function beginRound(qi){
  G.qIndex=qi;G.answered=false;
  const q=G.questions[qi];if(!q){endGame();return;}
  const secs=G.sessionTimer||10;
  if(q.content_type==='text'&&q.text_content){
    document.getElementById('g-qbox').style.display='none';
    document.getElementById('g-tbox').style.display='block';
    document.getElementById('g-tbox-c').textContent=q.text_content;
  } else {
    document.getElementById('g-tbox').style.display='none';
    document.getElementById('g-qbox').style.display='flex';
    document.getElementById('g-qbox').innerHTML=`<img src="${q.image_url}" alt=""><div class="q-num">سؤال ${qi+1}/${G.questions.length}</div>`;
  }
  document.getElementById('g-badge').textContent=`السؤال ${qi+1}`;
  showArea(q);
  document.getElementById('g-timer').style.display='block';
  startTimer(secs,()=>{if(!G.answered)resolveRound(null,null,null,0);});
}

function showArea(q){
  document.getElementById('g-ans-wrap').style.display='none';
  document.getElementById('g-mcq-wrap').style.display='none';
  document.getElementById('g-result').style.display='none';
  document.getElementById('g-state').style.display='none';
  if(q.type==='mcq'&&q.options){
    document.getElementById('g-mcq-wrap').style.display='block';
    document.getElementById('g-mcq-grid').innerHTML=q.options.filter(o=>o&&o.trim()).map(opt=>`<div class="mcq-opt" onclick="selMCQ(this,'${esc(opt)}','${esc(q.answer)}')">${opt}</div>`).join('');
  } else {
    document.getElementById('g-ans-wrap').style.display='block';
    document.getElementById('g-ans').value='';
    setTimeout(()=>document.getElementById('g-ans').focus(),100);
  }
}
function esc(s){return String(s).replace(/'/g,"&#39;").replace(/"/g,'&quot;');}
function calcPts(){return Math.max(1,G.timerVal);}

function selMCQ(el,chosen,correct){
  if(G.answered)return;
  if(checkAns(chosen,correct)){
    el.classList.add('correct');G.answered=true;const pts=calcPts();clearTimer();
    stateMsg('✅',`إجابة صحيحة! +${pts} نقطة`,'في انتظار تأكيد النتيجة...');
    dbWrite({roundWinner:G.pTeam,winnerAns:chosen,winnerPlayer:G.pName,winnerPts:pts});
  } else {el.classList.add('wrong');setTimeout(()=>el.classList.remove('wrong'),700);toast('❌ ليست الإجابة!');}
}

async function sendAns(){
  if(G.answered)return;
  const ans=document.getElementById('g-ans').value.trim();if(!ans){toast('❗ اكتب إجابتك');return;}
  const q=G.questions[G.qIndex];if(!q)return;
  if(checkAns(ans,q.answer)){
    G.answered=true;const pts=calcPts();clearTimer();
    stateMsg('✅',`إجابة صحيحة! +${pts} نقطة`,'في انتظار تأكيد النتيجة...');
    await dbWrite({roundWinner:G.pTeam,winnerAns:ans,winnerPlayer:G.pName,winnerPts:pts});
  } else {
    toast('❌ حاول مرة ثانية!');
    const inp=document.getElementById('g-ans');
    inp.style.borderColor='var(--red2)';inp.style.boxShadow='0 0 0 3px rgba(196,48,32,.2)';
    setTimeout(()=>{inp.style.borderColor='';inp.style.boxShadow='';inp.value='';inp.focus();},700);
  }
}

function checkAns(u,c){
  const n=s=>String(s).trim().toLowerCase().replace(/[أإآا]/g,'ا').replace(/[ةه]/g,'ه').replace(/[يى]/g,'ي').replace(/[^\u0600-\u06FF\s]/g,'').replace(/\s+/g,' ');
  const un=n(u),cn=n(c);
  if(un===cn)return true;
  if(cn.length>4&&(cn.includes(un)||un.includes(cn)))return true;
  const cw=cn.split(' ').filter(w=>w.length>2),uw=un.split(' ');
  return cw.length>0&&cw.filter(cw=>uw.some(uw=>uw.includes(cw)||cw.includes(uw))).length/cw.length>=0.5;
}

async function resolveRound(winner,winnerAns,winnerPlayer,pts){
  clearTimer();
  document.getElementById('g-ans-wrap').style.display='none';
  document.getElementById('g-mcq-wrap').style.display='none';
  document.getElementById('g-state').style.display='none';
  const q=G.questions[G.qIndex];
  let rs=G.redScore,bs=G.blueScore;
  if(winner==='red')rs+=(pts||0);if(winner==='blue')bs+=(pts||0);
  const hist=[...G.history,{qIndex:G.qIndex,imageUrl:q?.image_url||'',textContent:q?.text_content||'',contentType:q?.content_type||'image',answer:q?.answer||'',winner,winnerAns:winnerAns||'',winnerPlayer:winnerPlayer||'',pts:pts||0}];
  showRR(winner,q?.answer,winnerAns,pts||0);
  const nqi=G.qIndex+1,last=nqi>=G.questions.length;
  await dbWrite({redScore:rs,blueScore:bs,history:hist,roundWinner:winner,winnerPts:pts||0,phase:last?'ended':'round_end',qIndex:G.qIndex});
  setTimeout(async()=>{if(last)await dbWrite({phase:'ended'});else await dbWrite({phase:'playing',qIndex:nqi,roundWinner:null,winnerPts:0,answers:{},revealedAnswer:null});},3500);
}

function showRR(winner,correct,given,pts){
  let icon,title,cls;
  if(winner==='red'){icon='🔴';title='الفريق الأحمر أجاب أولاً!';cls='r';}
  else if(winner==='blue'){icon='🔵';title='الفريق الأزرق أجاب أولاً!';cls='b';}
  else{icon='⏱️';title='انتهى الوقت — لا أحد أجاب';cls='none';}
  const ptsHtml=winner&&pts>0?`<div class="rr-pts">+${pts} نقطة ⚡</div>`:'';
  document.getElementById('g-result').innerHTML=`<div class="rr ${cls}"><div class="rr-ic">${icon}</div><div class="rr-title">${title}</div>${ptsHtml}<div class="rr-ans" style="margin-top:6px">الإجابة: <strong>${correct||''}</strong></div>${given&&given!==correct?`<div class="rr-ans">"${given}"</div>`:''}</div>`;
  document.getElementById('g-result').style.display='block';
  document.getElementById('g-timer').style.display='none';
  document.querySelectorAll('#g-mcq-grid .mcq-opt').forEach(el=>{if(el.textContent.trim()===correct)el.classList.add('rev-ok');});
  if(winner&&pts>0)ptsPopup(winner,pts);
}

function ptsPopup(team,pts){
  const el=document.getElementById(team==='red'?'sbt-r':'sbt-b');
  if(!el)return;
  const pop=document.createElement('div');
  pop.className='pts-pop';pop.textContent='+'+pts+' ⚡';
  el.style.position='relative';el.appendChild(pop);
  setTimeout(()=>pop.remove(),950);
}

function stateMsg(icon,title,sub){
  document.getElementById('g-ans-wrap').style.display='none';
  document.getElementById('g-mcq-wrap').style.display='none';
  document.getElementById('g-si').textContent=icon;
  document.getElementById('g-st').textContent=title;
  document.getElementById('g-ss').textContent=sub;
  document.getElementById('g-state').style.display='block';
}

function caUpdateUI(state){
  if(!state)return;
  document.getElementById('ca-code').textContent=G.playerCode||'----';
  document.getElementById('ca-rs').textContent=state.redScore||0;
  document.getElementById('ca-bs').textContent=state.blueScore||0;
  const rp=state.redPlayers||[],bp=state.bluePlayers||[];
  const chip=n=>`<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.06);border-radius:20px;padding:3px 9px;font-size:11px;color:var(--parch);margin:2px">👤 ${n}</span>`;
  document.getElementById('ca-rp').innerHTML=rp.map(chip).join('')||'<span style="font-size:11px;color:var(--mu)">—</span>';
  document.getElementById('ca-bp').innerHTML=bp.map(chip).join('')||'<span style="font-size:11px;color:var(--mu)">—</span>';
  const qs=state.questions||G.questions||[];
  const qi=state.qIndex||0;
  document.getElementById('ca-qn').textContent=qi+1;
  document.getElementById('ca-qt').textContent=qs.length;
  const q=qs[qi];
  if(q)document.getElementById('ca-q-prev').textContent=q.content_type==='text'?'📝 '+q.text_content:'🖼️ '+q.answer;
  const answers=Object.values(state.answers||{});
  const al=document.getElementById('ca-ans-list');
  if(answers.length){al.innerHTML=answers.map(a=>`<div class="ca-ans-item"><span>${a.team==='red'?'🔴':'🔵'} <strong>${a.name}:</strong> ${a.answer}</span>${a.pts?`<span style="color:var(--goldhi);font-size:11px;margin-right:auto">+${a.pts}⚡</span>`:''}</div>`).join('');}
  else{al.innerHTML='<div style="font-size:12px;color:var(--mu);padding:6px 0">في انتظار الإجابات...</div>';}
  if(state.revealedAnswer){document.getElementById('ca-rev-wrap').style.display='block';document.getElementById('ca-rev-ans').textContent=state.revealedAnswer;}
  else{document.getElementById('ca-rev-wrap').style.display='none';}
  const ph=state.phase||'lobby';
  document.getElementById('ca-lobby').style.display=ph==='lobby'?'block':'none';
  document.getElementById('ca-game').style.display=ph==='playing'||ph==='round_end'?'block':'none';
  document.getElementById('ca-restart').style.display=ph==='ended'?'block':'none';
  const cst=document.getElementById('cl-status');
  if(cst){const m={lobby:'في انتظار اللاعبين...',playing:'🟢 اللعبة جارية!',round_end:'نتيجة الجولة...',ended:'✅ انتهت اللعبة'};cst.textContent=m[ph]||'';cst.style.color=ph==='playing'?'var(--green2)':'var(--ink2)';}
}

async function caStart(){await dbWrite({phase:'playing',qIndex:0,answers:{},revealedAnswer:null});toast('▶ اللعبة بدأت!');}
async function caReveal(){const q=(G.questions||[])[G.qIndex];if(!q)return;await dbWrite({revealedAnswer:q.answer});toast('👁 تم كشف الإجابة');}
async function caNext(){
  const nqi=G.qIndex+1;
  if(nqi>=(G.questions||[]).length){await dbWrite({phase:'ended'});return;}
  await dbWrite({phase:'playing',qIndex:nqi,answers:{},revealedAnswer:null,roundWinner:null,winnerPts:0});
  toast('⏭ السؤال '+(nqi+1));
}
async function caPoint(team){
  const bonus=G.sessionTimer||10;
  const rs=G.redScore+(team==='red'?bonus:0),bs=G.blueScore+(team==='blue'?bonus:0);
  await dbWrite({redScore:rs,blueScore:bs});
  toast('+'+bonus+' للفريق '+(team==='red'?'الأحمر 🔴':'الأزرق 🔵'));
}
async function caRestart(){await dbWrite({phase:'lobby',qIndex:0,redScore:0,blueScore:0,answers:{},history:[],revealedAnswer:null,roundWinner:null,questions:G.questions});toast('🔄 إعادة اللعبة');}
async function caEnd(){await dbWrite({phase:'ended'});toast('🏁 انتهت اللعبة');}

function applyState(state,role){
  if(!state)return;
  G.redScore=state.redScore||0;G.blueScore=state.blueScore||0;syncScores();
  G.redPlayers=state.redPlayers||[];G.bluePlayers=state.bluePlayers||[];syncTeams();checkStart();
  if(state.questions?.length)G.questions=state.questions;
  if(state.timerSeconds)G.sessionTimer=state.timerSeconds;
  G.history=state.history||[];
  if(state.qIndex!==undefined)G.qIndex=state.qIndex;
  if(role==='cadmin'||G.isAdmin){caUpdateUI(state);if(state.phase==='ended')setTimeout(showWinner,400);return;}
  const prev=G.phase;G.phase=state.phase||'lobby';
  if(G.phase==='playing'){
    const nqi=state.qIndex||0;
    if(prev!=='playing'||nqi!==G.qIndex){go('s-game');beginRound(nqi);}
    if(state.roundWinner&&!G.answered){clearTimer();const q=G.questions[G.qIndex];showRR(state.roundWinner,q?.answer,state.winnerAns,state.winnerPts||0);}
  }
  if(G.phase==='round_end'){clearTimer();const q=G.questions[state.qIndex??G.qIndex];showRR(state.roundWinner,q?.answer,state.winnerAns,state.winnerPts||0);}
  if(G.phase==='ended'&&prev!=='ended')setTimeout(showWinner,400);
}

async function dbWrite(patch){
  const code=G.playerCode||G.sessionCode;if(!code)return;
  if(G.sb&&!G.demo){
    const {data}=await G.sb.from('sessions').select('state').eq('code',code).single();
    const m={...(data?.state||{}),...patch};
    await G.sb.from('sessions').update({state:m}).eq('code',code);
  } else {
    const s=G.sessions.find(s=>s.code===code);
    if(s){s.state={...s.state,...patch};applyState(s.state,G.isAdmin?'cadmin':'player');}
  }
}

function subSession(code,role){
  if(!G.sb)return;if(G.ch)G.ch.unsubscribe();
  G.ch=G.sb.channel('s-'+code).on('postgres_changes',{event:'UPDATE',schema:'public',table:'sessions',filter:'code=eq.'+code},({new:row})=>applyState(row.state,role)).subscribe();
}
function endGame(){dbWrite({phase:'ended'});}

function startTimer(secs,onEnd){
  clearTimer();G.timerVal=secs;drawTimer(secs);
  G.timerInt=setInterval(()=>{G.timerVal--;drawTimer(secs);if(G.timerVal<=0){clearTimer();if(onEnd)onEnd();}},1000);
}
function clearTimer(){clearInterval(G.timerInt);}
function drawTimer(total){
  const t=total||G.sessionTimer||10;
  const pct=(G.timerVal/t)*100,hot=G.timerVal<=Math.ceil(t*.25);
  const color=hot?'linear-gradient(90deg,#C43020,#E05040)':'linear-gradient(90deg,#189040,#E8A820)';
  const b=document.getElementById('g-tf'),n=document.getElementById('g-tn');
  if(b){b.style.width=pct+'%';b.style.background=color;b.className='timer-fill'+(hot?' hot':'');}
  if(n){n.textContent=G.timerVal;n.className='timer-num'+(hot?' hot':'');}
}

function showWinner(){
  const r=G.redScore,b=G.blueScore,tie=r===b,rw=r>b;
  document.getElementById('fw-r').textContent=r;document.getElementById('fw-b').textContent=b;
  document.getElementById('fw-rc').textContent=rw&&!tie?'👑':'';document.getElementById('fw-bc').textContent=!rw&&!tie?'👑':'';
  if(tie){document.getElementById('w-trophy').textContent='🤝';document.getElementById('w-title').textContent='تعادل!';document.getElementById('w-sub').textContent='الفريقان متساويان';document.getElementById('fb-r').className='fbox r';document.getElementById('fb-b').className='fbox b';}
  else{document.getElementById('w-trophy').textContent='🏆';document.getElementById('w-title').textContent=(rw?'🔴 الفريق الأحمر':'🔵 الفريق الأزرق')+' فاز!';document.getElementById('w-sub').textContent='مبروك للفائزين! 🎉';document.getElementById('fb-r').className='fbox r '+(rw?'champ':'lose');document.getElementById('fb-b').className='fbox b '+(rw?'lose':'champ');}
  document.getElementById('hist-body').innerHTML=G.history.map((h,i)=>{
    const wt=h.winner==='red'?'🔴 الأحمر':h.winner==='blue'?'🔵 الأزرق':'لا أحد';
    const wc=h.winner||'none';
    const thumb=h.contentType==='text'?`<div class="hist-thumb">📝</div>`:`<div class="hist-thumb"><img src="${h.imageUrl}" alt=""></div>`;
    return `<div class="hist-item">${thumb}<div class="hist-info"><div class="hist-ans">س${i+1}: ${h.answer}</div><div class="hist-winner ${wc}">${wt} فاز${h.winnerPlayer?' — '+h.winnerPlayer:''} ${h.pts>0?'(+'+h.pts+' ⚡)':''}</div></div></div>`;
  }).join('');
  go('s-win');
}
function toggleHist(){const b=document.getElementById('hist-body'),a=document.getElementById('h-ar');b.classList.toggle('open');a.textContent=b.classList.contains('open')?'▲':'▼';}

function syncScores(){['g-rs','ca-rs','cl-rs'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=G.redScore;});['g-bs','ca-bs','cl-bs'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=G.blueScore;});}
function syncTeams(){document.getElementById('tc-r').textContent=G.redPlayers.length+' لاعب';document.getElementById('tc-b').textContent=G.bluePlayers.length+' لاعب';}
function resetAll(){G.sessionCode=null;G.playerCode=null;G.isAdmin=false;G.pName='';G.pTeam=null;G.answered=false;G.phase='lobby';G.qIndex=0;G.questions=[];G.redScore=0;G.blueScore=0;G.redPlayers=[];G.bluePlayers=[];G.history=[];clearTimer();if(G.ch)G.ch.unsubscribe();syncScores();}

let _tt;
function toast(msg){clearTimeout(_tt);const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');_tt=setTimeout(()=>el.classList.remove('show'),2800);}

const urlCode=new URLSearchParams(location.search).get('code');
if(urlCode){document.getElementById('pCode').value=urlCode;toast('✅ كود: '+urlCode+' — أدخل اسمك وانضم!');}

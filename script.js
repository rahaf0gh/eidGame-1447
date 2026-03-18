const G={
  sb:null,demo:false,ch:null,
  OWNER_PASS:'MATHTHIL2025',
  sessionCode:null,
  playerCodeForSession:null,
  isClientAdmin:false,
  pName:'',pTeam:null,answered:false,
  phase:'lobby',qIndex:0,questions:[],
  redScore:0,blueScore:0,redPlayers:[],bluePlayers:[],history:[],
  timerVal:30,timerInt:null,
  qBank:[],sessions:[],
  pendingImg:null,pendingType:'text',
  mcqOpts:['','','',''],mcqCorrect:0,
};

function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));document.getElementById(id).classList.add('on');}
function swTab(el,id){el.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));el.classList.add('on');['tp','tc'].forEach(t=>document.getElementById(t).style.display=t===id?'block':'none');}
function checkOwnerCode(val){if(val==='0000'){document.getElementById('pCode').value='';go('s-owner');toast('👋 مرحباً!');return;}}

// ── SUPABASE ──
async function connectSB(){
  const url=document.getElementById('sb-url').value.trim(),key=document.getElementById('sb-key').value.trim(),st=document.getElementById('sb-st');
  if(!url||!key){toast('❗ أدخل URL و key');return;}
  st.textContent='⏳ جاري الاتصال...';
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    G.sb=createClient(url,key);
    const {error}=await G.sb.from('sessions').select('code').limit(1);
    if(error&&!['PGRST116','42P01'].includes(error.code))throw error;
    st.textContent='✅ متصل!';st.style.color='#18883C';
    toast('✅ متصل!');activateOwner();
  }catch(e){st.textContent='❌ '+(e.message||'فشل');st.style.color='#C83020';}
}
function enableDemo(){
  G.demo=true;toast('🎮 وضع التجربة');activateOwner();
  G.qBank=[
    {id:'q1',image_url:'https://picsum.photos/seed/pr1/400/225',answer:'الصبر مفتاح الفرج',hint:'',type:'text',options:null},
    {id:'q2',image_url:'https://picsum.photos/seed/pr2/400/225',answer:'من جد وجد',hint:'',type:'mcq',options:['من جد وجد','الوقت كالسيف','العجلة من الشيطان','الصبر مفتاح الفرج']},
    {id:'q3',image_url:'https://picsum.photos/seed/pr3/400/225',answer:'اضرب الحديد وهو حامي',hint:'حديد',type:'text',options:null},
    {id:'q4',image_url:'https://picsum.photos/seed/pr4/400/225',answer:'العجلة من الشيطان',hint:'',type:'mcq',options:['من جد وجد','العجلة من الشيطان','الصبر مفتاح الفرج','اضرب الحديد وهو حامي']},
    {id:'q5',image_url:'https://picsum.photos/seed/pr5/400/225',answer:'الوقت كالسيف إن لم تقطعه قطعك',hint:'',type:'text',options:null},
  ];
  renderQBank();
}
function activateOwner(){
  document.getElementById('sb-cfg').style.display='none';
  document.getElementById('oc-qbank').style.display='block';
  document.getElementById('oc-sess').style.display='block';
  if(G.sb)loadData();
  initMCQ();renderQBank();renderSessions();
}

// ── QUESTION BANK ──
function setQType(t){
  G.pendingType=t;
  document.getElementById('tt-text').classList.toggle('on',t==='text');
  document.getElementById('tt-mcq').classList.toggle('on',t==='mcq');
  document.getElementById('qa-text').style.display=t==='text'?'block':'none';
  document.getElementById('qa-mcq').style.display=t==='mcq'?'block':'none';
}
function initMCQ(){
  G.mcqOpts=['','','',''];G.mcqCorrect=0;
  document.getElementById('mcq-container').innerHTML=['أ','ب','ج','د'].map((l,i)=>`
    <div class="mcq-owner-row">
      <input class="oi" placeholder="الخيار ${l}" oninput="G.mcqOpts[${i}]=this.value" style="margin-bottom:6px">
      <div class="ck ${i===0?'on':''}" id="ck${i}" onclick="setCorrect(${i})">✓</div>
    </div>`).join('');
}
function setCorrect(i){G.mcqCorrect=i;document.querySelectorAll('.ck').forEach((el,j)=>el.classList.toggle('on',j===i));}
function previewImg(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{G.pendingImg=ev.target.result;document.getElementById('q-img-prev').innerHTML=`<img src="${ev.target.result}" style="max-height:90px;border-radius:8px;object-fit:contain">`;};
  r.readAsDataURL(f);
}
async function addQ(){
  if(!G.pendingImg){toast('❗ ارفع صورة');return;}
  let answer,options=null;
  if(G.pendingType==='text'){
    answer=document.getElementById('q-answer').value.trim();
    if(!answer){toast('❗ أدخل الإجابة');return;}
  } else {
    const opts=G.mcqOpts.filter(o=>o.trim());
    if(opts.length<2){toast('❗ أدخل خيارين على الأقل');return;}
    answer=G.mcqOpts[G.mcqCorrect];
    if(!answer.trim()){toast('❗ حدد الإجابة الصحيحة');return;}
    options=[...G.mcqOpts];
  }
  const hint=document.getElementById('q-hint')?.value.trim()||'';
  const q={id:'q_'+Date.now(),image_url:G.pendingImg,answer,hint,type:G.pendingType,options};
  if(G.sb&&!G.demo){
    const {data,error}=await G.sb.from('questions').insert({image_url:G.pendingImg,answer,hint,type:G.pendingType,options:options?JSON.stringify(options):null}).select().single();
    if(error){toast('❌ '+error.message);return;}
    q.id=data.id;
  }
  G.qBank.push(q);renderQBank();
  G.pendingImg=null;G.pendingType='text';
  document.getElementById('q-img-f').value='';
  document.getElementById('q-img-prev').innerHTML='<div style="font-size:28px">📷</div><p>انقر لرفع صورة السؤال</p>';
  document.getElementById('q-answer').value='';
  document.getElementById('q-hint').value='';
  setQType('text');initMCQ();
  toast('✅ تم إضافة السؤال!');
}
async function delQ(id){
  if(G.sb&&!G.demo)await G.sb.from('questions').delete().eq('id',id);
  G.qBank=G.qBank.filter(q=>q.id!==id);renderQBank();toast('🗑️ تم الحذف');
}
function renderQBank(){
  document.getElementById('q-count').textContent=G.qBank.length;
  const el=document.getElementById('qbank-list');
  if(!G.qBank.length){el.innerHTML='<div style="font-size:12px;color:var(--muted);padding:8px 0;text-align:center">لا توجد أسئلة بعد</div>';return;}
  el.innerHTML=G.qBank.map(q=>`<div class="qbi"><div class="qb-thumb"><img src="${q.image_url}" alt=""></div><div class="qb-info"><div class="qb-ans">${q.answer}</div><div class="qb-type">${q.type==='mcq'?'☑️ اختيار':'✏️ نص حر'}${q.hint?' • 💡 '+q.hint:''}</div></div><button class="qb-del" onclick="delQ('${q.id}')">✕</button></div>`).join('');
}

// ── SESSIONS ──
function genCode(){return String(Math.floor(1000+Math.random()*9000));}
async function createSession(){
  const label=document.getElementById('new-client').value.trim()||'عميل';
  const qc=parseInt(document.getElementById('new-qcount').value)||5;
  if(!G.qBank.length){toast('❗ أضف أسئلة أولاً');return;}
  const shuffled=[...G.qBank].sort(()=>Math.random()-.5);
  const picked=shuffled.slice(0,Math.min(qc,shuffled.length));

  // كودان: كود اللاعبين + كود الأدمن (مختلفان)
  const playerCode=genCode();
  const adminCode=genCode();
  // تأكد إنهما مختلفان
  const finalAdminCode = adminCode===playerCode ? genCode() : adminCode;

  const init={
    phase:'lobby',qIndex:0,redScore:0,blueScore:0,
    redPlayers:[],bluePlayers:[],history:[],
    questions:picked,
    answers:{},revealedAnswer:null,
    adminCode:finalAdminCode  // مخزن في الـ state
  };

  if(G.sb&&!G.demo){
    const {error}=await G.sb.from('sessions').insert({code:playerCode,client_label:label,admin_code:finalAdminCode,state:init});
    if(error){toast('❌ '+error.message);return;}
  }
  G.sessions.unshift({code:playerCode,admin_code:finalAdminCode,client_label:label,state:init});
  renderSessions();
  document.getElementById('new-client').value='';

  // نسخ الرسالة الكاملة للعميل
  const url=location.href.split('?')[0];
  const msg=`مثّل 🪔 — ${label}\n\n👥 كود اللاعبين: ${playerCode}\n🎮 كود المضيف (أنت): ${finalAdminCode}\n\n🔗 الرابط: ${url}\n\nاللاعبون يدخلون من تاب "انضم للعبة"\nأنت تدخل من تاب "مشاهد / أدمن" بكود المضيف`;
  navigator.clipboard.writeText(msg).catch(()=>{});
  toast(`✅ كود اللاعبين: ${playerCode} — كود الأدمن: ${finalAdminCode}`);
}

function renderSessions(){
  const el=document.getElementById('sess-list');
  if(!G.sessions.length){el.innerHTML='<div style="font-size:12px;color:var(--muted);text-align:center;padding:8px 0">لا توجد جلسات</div>';return;}
  el.innerHTML=G.sessions.map(s=>{
    const st=s.state||{};const p=st.phase||'lobby';
    const ar={lobby:'انتظار',playing:'جارية',round_end:'نتيجة',ended:'انتهت'}[p]||p;
    return `<div class="si" onclick="copyBothCodes('${s.code}','${s.admin_code||s.state?.adminCode||''}','${s.client_label||''}')">
      <div>
        <div class="si-code">${s.code}</div>
        <div class="si-meta">${s.client_label||''} • 🔴${st.redScore||0} — 🔵${st.blueScore||0} • ${(st.questions||[]).length} سؤال</div>
        ${s.admin_code||st.adminCode?`<div style="font-size:10px;color:rgba(184,138,10,.5);margin-top:2px">🎮 أدمن: ${s.admin_code||st.adminCode}</div>`:''}
      </div>
      <span class="si-phase ${p}">${ar}</span>
    </div>`;
  }).join('');
}

function copyBothCodes(playerCode,adminCode,label){
  const url=location.href.split('?')[0];
  const msg=`مثّل 🪔 — ${label}\n\n👥 كود اللاعبين: ${playerCode}\n🎮 كود المضيف (أنت): ${adminCode}\n\n🔗 الرابط: ${url}\n\nاللاعبون يدخلون من تاب "انضم للعبة"\nأنت تدخل من تاب "مشاهد / أدمن" بكود المضيف`;
  navigator.clipboard.writeText(msg).then(()=>toast('📋 تم نسخ الرسالة كاملة!')).catch(()=>toast('اللاعبين: '+playerCode+' — أدمن: '+adminCode));
}

function copyCode(code){const url=location.href.split('?')[0]+'?code='+code;navigator.clipboard.writeText(`مثّل 🪔\nالرابط: ${url}\nكود: ${code}`).then(()=>toast('📋 تم النسخ!')).catch(()=>toast('الكود: '+code));}
async function loadData(){
  if(!G.sb)return;
  const {data:qs}=await G.sb.from('questions').select('*').order('created_at');
  if(qs){G.qBank=qs.map(q=>({...q,options:q.options?JSON.parse(q.options):null}));renderQBank();}
  const {data:ss}=await G.sb.from('sessions').select('*').order('created_at',{ascending:false}).limit(20);
  if(ss){G.sessions=ss;renderSessions();}
}

// ── JOIN ──
async function playerJoin(){
  const name=document.getElementById('pName').value.trim(),code=document.getElementById('pCode').value.trim();
  if(!name){toast('❗ أدخل اسمك');return;}
  if(!/^\d{4}$/.test(code)){toast('❗ الكود 4 أرقام');return;}
  let st=null;
  if(G.sb&&!G.demo){const {data,error}=await G.sb.from('sessions').select('*').eq('code',code).single();if(error||!data){toast('❌ الكود غير موجود');return;}if(data.state?.phase==='ended'){toast('❌ الجلسة انتهت');return;}st=data.state;G.questions=st.questions||[];}
  else if(G.demo){const s=G.sessions.find(s=>s.code===code);if(!s){toast('❌ الكود غير موجود');return;}st=s.state;G.questions=st.questions||[];}
  G.pName=name;G.sessionCode=code;
  document.getElementById('tm-code').textContent=code;
  if(st)applyState(st,'player');
  if(G.sb&&!G.demo)subSession(code,'player');
  go('s-team');toast('✅ انضممت! اختر فريقك');
}
async function clientJoin(){
  const code=document.getElementById('cCode').value.trim();
  if(!/^\d{4}$/.test(code)){toast('❗ الكود 4 أرقام');return;}

  let sessionData=null;
  let isAdmin=false;

  if(G.sb&&!G.demo){
    // ابحث أولاً: هل هذا كود أدمن؟
    const {data:adminRow}=await G.sb.from('sessions').select('*').eq('admin_code',code).maybeSingle();
    if(adminRow){
      sessionData=adminRow;
      isAdmin=true;
      // الكود الحقيقي للجلسة هو playerCode — نحتاجه للـ realtime
      G.playerCodeForSession=adminRow.code;
    } else {
      // ابحث: هل هذا كود لاعبين (مشاهد)؟
      const {data:playerRow,error}=await G.sb.from('sessions').select('*').eq('code',code).maybeSingle();
      if(error||!playerRow){toast('❌ الكود غير موجود');return;}
      sessionData=playerRow;
      isAdmin=false;
      G.playerCodeForSession=code;
    }
  } else {
    // وضع التجربة — ابحث بكود الأدمن أولاً
    const byAdmin=G.sessions.find(s=>s.admin_code===code);
    if(byAdmin){sessionData=byAdmin;isAdmin=true;G.playerCodeForSession=byAdmin.code;}
    else{
      const byPlayer=G.sessions.find(s=>s.code===code);
      if(!byPlayer){toast('❌ الكود غير موجود');return;}
      sessionData=byPlayer;isAdmin=false;G.playerCodeForSession=code;
    }
  }

  G.sessionCode=code; // الكود اللي أدخله المستخدم

  if(isAdmin){
    // ── دخول كأدمن الجلسة ──
    G.isClientAdmin=true;
    G.questions=sessionData?.state?.questions||[];
    // عرض كود اللاعبين في لوحة الأدمن (مش كوده هو)
    document.getElementById('ca-code').textContent=G.playerCodeForSession;
    caUpdateUI(sessionData?.state||{});
    applyState(sessionData?.state||{},'cadmin');
    if(G.sb&&!G.demo)subSession(G.playerCodeForSession,'cadmin');
    go('s-cadmin');
    toast('✅ مرحباً أيها المضيف!');
  } else {
    // ── دخول كمشاهد ──
    G.isClientAdmin=false;
    if(sessionData?.state)applyState(sessionData.state,'client');
    if(G.sb&&!G.demo)subSession(code,'client');
    document.getElementById('cl-code').textContent=code;
    go('s-client');
    toast('✅ وضع المشاهدة');
  }
}

// ══ CLIENT-ADMIN FUNCTIONS ══

function caUpdateUI(state){
  if(!state)return;
  // يعرض كود اللاعبين (مش كوده هو) حتى يوزعه على المشاركين
  document.getElementById('ca-code').textContent=G.playerCodeForSession||G.sessionCode||'----';
  // Scores
  document.getElementById('ca-rs').textContent=state.redScore||0;
  document.getElementById('ca-bs').textContent=state.blueScore||0;
  // Players
  const rp=state.redPlayers||[],bp=state.bluePlayers||[];
  const chip=n=>`<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.06);border-radius:20px;padding:3px 9px;font-size:11px;color:var(--parch);margin:2px">👤 ${n}</span>`;
  document.getElementById('ca-rp').innerHTML=rp.map(chip).join('')||'<span style="font-size:11px;color:var(--muted)">—</span>';
  document.getElementById('ca-bp').innerHTML=bp.map(chip).join('')||'<span style="font-size:11px;color:var(--muted)">—</span>';
  // Question
  const qi=state.qIndex||0;
  const qs=state.questions||G.questions||[];
  document.getElementById('ca-q-num').textContent=`${qi+1} / ${qs.length}`;
  const q=qs[qi];
  if(q){document.getElementById('ca-q-img').innerHTML=`<img src="${q.image_url}" style="width:100%;height:100%;object-fit:cover">`;}
  // Answers
  const answers=Object.values(state.answers||{});
  const aList=document.getElementById('ca-answers');
  if(answers.length){
    aList.innerHTML=answers.map(a=>`
      <div style="display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:9px;margin-bottom:6px;background:rgba(255,255,255,.04);font-size:13px;font-weight:600;color:var(--parch)">
        <div style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:11px">💬</div>
        <div><strong>${a.team==='red'?'🔴':'🔵'} ${a.name}:</strong> ${a.answer}</div>
      </div>`).join('');
  } else {
    aList.innerHTML='<div style="font-size:12px;color:var(--muted);padding:6px 0">في انتظار الإجابات...</div>';
  }
  // Correct answer (if revealed)
  if(state.revealedAnswer){
    document.getElementById('ca-correct-wrap').style.display='block';
    document.getElementById('ca-correct-ans').textContent=state.revealedAnswer;
  } else {
    document.getElementById('ca-correct-wrap').style.display='none';
  }
  // Controls visibility
  const phase=state.phase||'lobby';
  document.getElementById('ca-ctrl-lobby').style.display=phase==='lobby'?'block':'none';
  document.getElementById('ca-ctrl-game').style.display=phase==='playing'||phase==='round_end'?'block':'none';
  document.getElementById('ca-restart-btn').style.display=phase==='ended'?'block':'none';
}

async function caStart(){
  if(!G.sessionCode)return;
  await write({phase:'playing',qIndex:0,answers:{},revealedAnswer:null});
  toast('▶ اللعبة بدأت!');
}

async function caReveal(){
  const q=(G.questions||[])[G.qIndex];
  if(!q){toast('❗ لا يوجد سؤال');return;}
  await write({revealedAnswer:q.answer});
  toast('👁 تم كشف الإجابة');
}

async function caNext(){
  const qs=G.questions||[];
  const nextQi=G.qIndex+1;
  if(nextQi>=qs.length){
    // آخر سؤال
    await write({phase:'ended'});
    return;
  }
  await write({phase:'playing',qIndex:nextQi,answers:{},revealedAnswer:null,roundWinner:null});
  toast(`⏭ السؤال ${nextQi+1}`);
}

async function caPoint(team){
  const rs=G.redScore+(team==='red'?1:0);
  const bs=G.blueScore+(team==='blue'?1:0);
  await write({redScore:rs,blueScore:bs});
  toast('+1 للفريق '+(team==='red'?'الأحمر 🔴':'الأزرق 🔵'));
}

async function caRestart(){
  const qs=G.questions||[];
  await write({phase:'lobby',qIndex:0,redScore:0,blueScore:0,answers:{},history:[],revealedAnswer:null,roundWinner:null,questions:qs});
  toast('🔄 تمت إعادة اللعبة');
}

async function caEnd(){
  await write({phase:'ended'});
  toast('🏁 انتهت اللعبة');
}

function caCopyLink(){
  const url=location.href.split('?')[0]+'?code='+G.sessionCode;
  navigator.clipboard.writeText(`مثّل 🪔\nالرابط: ${url}\nكود: ${G.sessionCode}`).then(()=>toast('📋 تم نسخ الرابط!'));
}

function copyLink(){const url=location.href.split('?')[0]+'?code='+G.sessionCode;navigator.clipboard.writeText(`مثّل 🪔\nالرابط: ${url}\nكود: ${G.sessionCode}`).then(()=>toast('📋 تم النسخ!'));}


// ── TEAM ──
async function pickTeam(t){
  G.pTeam=t;
  document.getElementById('tb-r').classList.toggle('sel',t==='red');
  document.getElementById('tb-b').classList.toggle('sel',t==='blue');
  if(!G.redPlayers.includes(G.pName)&&!G.bluePlayers.includes(G.pName)){
    if(t==='red')G.redPlayers.push(G.pName);else G.bluePlayers.push(G.pName);
    syncTeams();await write({redPlayers:G.redPlayers,bluePlayers:G.bluePlayers});
  }
  checkStart();toast('✅ انضممت للفريق '+(t==='red'?'الأحمر 🔴':'الأزرق 🔵'));
}
function checkStart(){const ok=G.redPlayers.length>0&&G.bluePlayers.length>0;document.getElementById('start-wrap').style.display=ok?'block':'none';document.getElementById('wait-wrap').style.display=ok?'none':'block';}
async function startGame(){if(G.phase!=='lobby')return;await write({phase:'playing',qIndex:0});}

// ── GAME ENGINE ──
function beginRound(qi){
  G.qIndex=qi;G.answered=false;
  const q=G.questions[qi];if(!q){endGame();return;}
  document.getElementById('g-qbox').innerHTML=`<img src="${q.image_url}" alt="سؤال"><div class="q-num">سؤال ${qi+1}/${G.questions.length}</div>`;
  document.getElementById('g-badge').textContent=`السؤال ${qi+1}`;
  showArea(q);
  document.getElementById('g-timer').style.display='block';
  startTimer(30,()=>{if(!G.answered)resolveRound(null,null,null);});
}
function showArea(q){
  document.getElementById('g-text-ans').style.display='none';
  document.getElementById('g-mcq-ans').style.display='none';
  document.getElementById('g-result').style.display='none';
  document.getElementById('g-state').style.display='none';
  if(q.type==='mcq'&&q.options){
    document.getElementById('g-mcq-ans').style.display='block';
    document.getElementById('g-mcq-grid').innerHTML=q.options.filter(o=>o&&o.trim()).map(opt=>`<div class="mcq-opt" onclick="selectMCQ(this,'${esc(opt)}','${esc(q.answer)}')">${opt}</div>`).join('');
  } else {
    document.getElementById('g-text-ans').style.display='block';
    document.getElementById('g-ans').value='';
    setTimeout(()=>document.getElementById('g-ans').focus(),100);
  }
}
function esc(s){return String(s).replace(/'/g,"&#39;").replace(/"/g,'&quot;');}

function selectMCQ(el,chosen,correct){
  if(G.answered)return;
  const isOk=checkAns(chosen,correct);
  if(isOk){
    el.classList.add('correct');
    G.answered=true;clearTimer();
    stateMsg('⏳','إجابة صحيحة!','في انتظار تأكيد النتيجة...');
    write({roundWinner:G.pTeam,winnerAns:chosen,winnerPlayer:G.pName});
  } else {
    el.classList.add('wrong');
    setTimeout(()=>el.classList.remove('wrong'),700);
    toast('❌ ليست الإجابة!');
  }
}
async function sendAns(){
  if(G.answered)return;
  const ans=document.getElementById('g-ans').value.trim();if(!ans){toast('❗ اكتب إجابتك');return;}
  const q=G.questions[G.qIndex];if(!q)return;
  if(checkAns(ans,q.answer)){
    G.answered=true;clearTimer();
    stateMsg('⏳','إجابة صحيحة!','في انتظار تأكيد النتيجة...');
    await write({roundWinner:G.pTeam,winnerAns:ans,winnerPlayer:G.pName});
  } else {
    toast('❌ حاول مرة ثانية!');
    const inp=document.getElementById('g-ans');
    inp.style.borderColor='var(--red2)';inp.style.boxShadow='0 0 0 3px rgba(200,48,32,.2)';
    setTimeout(()=>{inp.style.borderColor='';inp.style.boxShadow='';inp.value='';inp.focus();},700);
  }
}
function checkAns(u,c){
  const n=s=>String(s).trim().toLowerCase().replace(/[أإآا]/g,'ا').replace(/[ةه]/g,'ه').replace(/[يى]/g,'ي').replace(/[^\u0600-\u06FF\s]/g,'').replace(/\s+/g,' ');
  const un=n(u),cn=n(c);
  if(un===cn)return true;
  if(cn.length>4&&(cn.includes(un)||un.includes(cn)))return true;
  const cw=cn.split(' ').filter(w=>w.length>2),uw=un.split(' ');
  const m=cw.filter(cword=>uw.some(uw=>uw.includes(cword)||cword.includes(uw)));
  return cw.length>0&&m.length/cw.length>=0.5;
}
async function resolveRound(winner,winnerAns,winnerPlayer){
  clearTimer();
  document.getElementById('g-text-ans').style.display='none';
  document.getElementById('g-mcq-ans').style.display='none';
  document.getElementById('g-state').style.display='none';
  const q=G.questions[G.qIndex];
  let rs=G.redScore,bs=G.blueScore;
  if(winner==='red')rs++;if(winner==='blue')bs++;
  const hist=[...G.history,{qIndex:G.qIndex,imageUrl:q?.image_url||'',answer:q?.answer||'',winner,winnerAns:winnerAns||'',winnerPlayer:winnerPlayer||''}];
  showRR(winner,q?.answer,winnerAns);
  const nqi=G.qIndex+1,last=nqi>=G.questions.length;
  await write({redScore:rs,blueScore:bs,history:hist,roundWinner:winner,phase:last?'ended':'round_end',qIndex:G.qIndex});
  setTimeout(async()=>{if(last)await write({phase:'ended'});else await write({phase:'playing',qIndex:nqi,roundWinner:null});},3000);
}
function showRR(winner,correct,given){
  let icon,title,cls;
  if(winner==='red'){icon='🔴';title='الفريق الأحمر أجاب أولاً!';cls='r';}
  else if(winner==='blue'){icon='🔵';title='الفريق الأزرق أجاب أولاً!';cls='b';}
  else{icon='⏱️';title='انتهى الوقت — لا أحد أجاب!';cls='none';}
  document.getElementById('g-result').innerHTML=`<div class="rr ${cls}"><div class="rr-icon">${icon}</div><div class="rr-title">${title}</div><div class="rr-ans">الإجابة: <strong>${correct||''}</strong></div>${given&&given!==correct?`<div class="rr-ans" style="margin-top:2px">كُتبت: "${given}"</div>`:''}</div>`;
  document.getElementById('g-result').style.display='block';
  document.getElementById('g-timer').style.display='none';
  document.querySelectorAll('#g-mcq-grid .mcq-opt').forEach(el=>{if(el.textContent.trim()===correct)el.classList.add('reveal-ok');});
}
function stateMsg(icon,title,sub){
  document.getElementById('g-text-ans').style.display='none';
  document.getElementById('g-mcq-ans').style.display='none';
  document.getElementById('g-st-i').textContent=icon;
  document.getElementById('g-st-t').textContent=title;
  document.getElementById('g-st-s').textContent=sub;
  document.getElementById('g-state').style.display='block';
}

// ── STATE ──
function applyState(state,role){
  if(!state)return;
  G.redScore=state.redScore||0;G.blueScore=state.blueScore||0;syncScores();
  G.redPlayers=state.redPlayers||[];G.bluePlayers=state.bluePlayers||[];syncTeams();checkStart();
  if(state.questions?.length)G.questions=state.questions;
  G.history=state.history||[];
  if(state.qIndex!==undefined)G.qIndex=state.qIndex;

  // Client-admin: always update their panel
  if(role==='cadmin'||G.isClientAdmin){
    caUpdateUI(state);
    // If game ended, show winner for everyone
    if(state.phase==='ended'){setTimeout(showWinner,400);}
    return; // cadmin doesn't get the player game screen
  }

  // Client spectator status
  const cst=document.getElementById('cl-status');
  if(cst){const m={lobby:'في انتظار اللاعبين...',playing:'🟢 اللعبة جارية الآن!',round_end:'نتيجة الجولة...',ended:'✅ انتهت اللعبة'};cst.textContent=m[state.phase]||'';cst.style.color=state.phase==='playing'?'var(--green2)':'var(--ink2)';}

  const prev=G.phase;G.phase=state.phase||'lobby';
  if(G.phase==='playing'){
    const nqi=state.qIndex||0;
    if(prev!=='playing'||nqi!==G.qIndex){go('s-game');beginRound(nqi);}
    if(state.roundWinner&&!G.answered){clearTimer();const q=G.questions[G.qIndex];showRR(state.roundWinner,q?.answer,state.winnerAns);}
  }
  if(G.phase==='round_end'&&state.roundWinner){clearTimer();const q=G.questions[state.qIndex??G.qIndex];showRR(state.roundWinner,q?.answer,state.winnerAns);}
  if(G.phase==='ended'&&prev!=='ended')setTimeout(showWinner,400);
}

// ── DB WRITE ──
async function write(patch){
  if(!G.sessionCode)return;
  const dbCode=G.playerCodeForSession||G.sessionCode;
  if(G.sb&&!G.demo){
    const {data}=await G.sb.from('sessions').select('state').eq('code',dbCode).single();
    const m={...(data?.state||{}),...patch};
    await G.sb.from('sessions').update({state:m}).eq('code',dbCode);
  } else {
    const s=G.sessions.find(s=>s.code===dbCode)||G.sessions.find(s=>s.admin_code===G.sessionCode);
    if(s){s.state={...s.state,...patch};applyState(s.state,G.isClientAdmin?'cadmin':'player');}
  }
}

// ── REALTIME ──
async function subSession(code,role){
  if(!G.sb)return;
  if(G.ch)G.ch.unsubscribe();
  // للعميل-أدمن: يحتاج يشترك باستخدام playerCode (ليس adminCode)
  let subscribeCode=code;
  if(role==='cadmin'){
    const {data}=await G.sb.from('sessions').select('code').eq('admin_code',code).single().catch(()=>({data:null}));
    if(data)subscribeCode=data.code;
  }
  G.ch=G.sb.channel('s-'+subscribeCode)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'sessions',filter:'code=eq.'+subscribeCode},
      ({new:row})=>applyState(row.state,role))
    .subscribe();
}
function endGame(){write({phase:'ended'});}

// ── TIMER ──
function startTimer(secs,onEnd){clearTimer();G.timerVal=secs;drawTimer();G.timerInt=setInterval(()=>{G.timerVal--;drawTimer();if(G.timerVal<=0){clearTimer();if(onEnd)onEnd();}},1000);}
function clearTimer(){clearInterval(G.timerInt);}
function drawTimer(){const p=(G.timerVal/30)*100,hot=G.timerVal<=8;const b=document.getElementById('g-tf'),n=document.getElementById('g-tn');if(b){b.style.width=p+'%';b.className='timer-fill'+(hot?' hot':'');}if(n){n.textContent=G.timerVal;n.className='timer-num'+(hot?' hot':'');}}

// ── WINNER ──
function showWinner(){
  const r=G.redScore,b=G.blueScore,tie=r===b,rw=r>b;
  document.getElementById('fw-r').textContent=r;document.getElementById('fw-b').textContent=b;
  document.getElementById('fw-rc').textContent='';document.getElementById('fw-bc').textContent='';
  if(tie){document.getElementById('w-trophy').textContent='🤝';document.getElementById('w-title').textContent='تعادل!';document.getElementById('w-sub').textContent='الفريقان متساويان';document.getElementById('fb-r').className='fbox r';document.getElementById('fb-b').className='fbox b';}
  else{document.getElementById('w-trophy').textContent='🏆';document.getElementById('w-title').textContent=(rw?'🔴 الفريق الأحمر':'🔵 الفريق الأزرق')+' فاز!';document.getElementById('w-sub').textContent='مبروك! 🎉';document.getElementById('fb-r').className='fbox r '+(rw?'champ':'lose');document.getElementById('fb-b').className='fbox b '+(rw?'lose':'champ');document.getElementById(rw?'fw-rc':'fw-bc').textContent='👑';}
  document.getElementById('hist-body').innerHTML=G.history.map((h,i)=>{const wt=h.winner==='red'?'🔴 الأحمر':h.winner==='blue'?'🔵 الأزرق':'لا أحد';const wc=h.winner||'none';return `<div class="hist-item"><div class="hist-q"><img src="${h.imageUrl}" alt=""></div><div class="hist-info"><div class="hist-ans">س${i+1}: ${h.answer}</div><div class="hist-winner ${wc}">${wt} فاز${h.winnerPlayer?' — '+h.winnerPlayer:''}</div>${h.winnerAns&&h.winnerAns!==h.answer?`<div style="font-size:10px;color:var(--ink2)">كتب: "${h.winnerAns}"</div>`:''}</div></div>`;}).join('');
  go('s-win');
}
function toggleHist(){const b=document.getElementById('hist-body'),a=document.getElementById('h-arrow');b.classList.toggle('open');a.textContent=b.classList.contains('open')?'▲':'▼';}

// ── SYNC ──
function syncScores(){['g-rs','cl-rs'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=G.redScore;});['g-bs','cl-bs'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=G.blueScore;});}
function syncTeams(){document.getElementById('tc-r').textContent=G.redPlayers.length+' لاعب';document.getElementById('tc-b').textContent=G.bluePlayers.length+' لاعب';}
function resetAll(){G.sessionCode=null;G.playerCodeForSession=null;G.isClientAdmin=false;G.pName='';G.pTeam=null;G.answered=false;G.phase='lobby';G.qIndex=0;G.questions=[];G.redScore=0;G.blueScore=0;G.redPlayers=[];G.bluePlayers=[];G.history=[];clearTimer();if(G.ch)G.ch.unsubscribe();syncScores();}

// ── TOAST ──
let _tt;function toast(msg){clearTimeout(_tt);const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');_tt=setTimeout(()=>el.classList.remove('show'),2800);}

// ── AUTO JOIN FROM URL ──
const urlCode=new URLSearchParams(location.search).get('code');
if(urlCode){document.getElementById('pCode').value=urlCode;toast('✅ كود: '+urlCode+' — أدخل اسمك وانضم!');}

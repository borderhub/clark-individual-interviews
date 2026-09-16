(() => {
  const data = window.TEAM_REVIEW_DATA;
  const synthesis = window.INTERPRETIVE_SYNTHESIS_DATA;
  if (!synthesis) throw new Error('Interpretive synthesis data is unavailable.');
  const CASES = data.cases.map(x => x.case_id);
  const QUESTIONS = ['Q01', 'Q02', 'Q03', 'Q04', 'Q05'];
  const params = new URLSearchParams(location.search);
  const valid = (value, list, fallback) => list.includes(value) ? value : fallback;
  const state = {
    view: valid(params.get('view'), ['overview', 'case', 'compare'], 'overview'),
    caseId: valid(params.get('case'), CASES, CASES[0]),
    q: valid(params.get('all') === '1' ? 'all' : params.get('q'), ['all', ...QUESTIONS], 'Q01'),
    a: valid(params.get('a'), CASES, CASES[0]), b: valid(params.get('b'), CASES, CASES[1]),
    axis: valid(params.get('axis'), ['topic', 'form', 'interpretive'], 'topic'), source: valid(params.get('source'), ['both', 'interview', 'questionnaire'], 'both'),
    interpretiveAxis: valid(params.get('interpretive_axis'), ['self_social', 'inner_outer', 'temporal', 'agency', 'movement', 'abstraction', 'certainty', 'relation_mode'], 'self_social')
  };
  if (state.a === state.b) state.b = CASES.find(x => x !== state.a);
  const $ = selector => document.querySelector(selector);
  const el = (tag, text, attrs = {}) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k,v)); return node; };
  const question = (caseId, q = state.q) => data.cases.find(x => x.case_id === caseId).questions.find(x => x.question_id === q);
  const cardFor = (caseId, questionId, source) => question(caseId, questionId).cards.find(card => card.record_type === source);
  const allQuestions = () => data.cases.flatMap(c => c.questions);
  const questionState = () => (state.q === 'all' ? 'all' : state.q);
  const detailQuestion = () => (state.q === 'all' ? QUESTIONS[0] : state.q);
  const urlFor = () => { const p = new URLSearchParams({view:state.view,q:questionState()}); if(state.view==='case')p.set('case',state.caseId); if(state.view==='compare'){p.set('a',state.a);p.set('b',state.b);p.set('axis',state.axis);p.set('source',state.source);p.set('interpretive_axis',state.interpretiveAxis);} return `${location.pathname}?${p}`; };
  const updateUrl = (push=false) => { const url=urlFor(); if(push) history.pushState({...state},'',url); else history.replaceState({...state},'',url); };
  const go = changes => { Object.assign(state,changes); if(state.a===state.b)state.b=CASES.find(x=>x!==state.a); updateUrl(true); render(); };

  $('#notice').textContent = data.notice;
  function button(label, selected, handler, attrs = {}) { const b=el('button',label,{type:'button',...attrs}); if(selected!==undefined)b.setAttribute('aria-selected',String(selected)); b.addEventListener('click',handler); return b; }
  function tagList(tags) { const list=el('ul',undefined,{class:'tags', 'aria-label':'関連するテーマ'}); tags.forEach(t=>list.append(el('li',t))); return list; }
  function status(text, tone='') { return el('span',text,{class:`state ${tone}`.trim()}); }
  const sourceLabel = source => source === 'interview' ? '面談' : 'アンケート';
  const contextFor = (caseId, questionId, source) => synthesis.question_context_summaries.find(x => x.case_id === caseId && x.question_id === questionId && x.record_type === source);
  const matrixFor = (caseId, questionId, source) => synthesis.interpretive_matrix.find(x => x.case_id === caseId && x.question_id === questionId && x.record_type === source);
  const caseSynthesisFor = caseId => synthesis.case_syntheses.find(x => x.case_id === caseId);
  const questionFindingFor = questionId => synthesis.question_findings.find(x => x.question_id === questionId);
  const AXIS_LABELS = {self_social:'自己・関係・社会',inner_outer:'内面・外部環境',temporal:'時間の方向',agency:'選択・制約・交渉',movement:'継続・変化・移行',abstraction:'具体・抽象',certainty:'確信・迷い・両義性',relation_mode:'個人・集団・制度'};
  const axisRow = (entry, axis) => entry?.axes?.find(row => row.axis === axis);
  const axisText = (entry, axis) => axisRow(entry, axis)?.value || '該当なし';
  function contextReading(context) { const section=el('section',undefined,{class:'context-reading'});section.append(el('h3',`${sourceLabel(context.record_type)}の文脈要約`),el('p',context.context));const meta=el('div',undefined,{class:'context-meta'});meta.append(status(`根拠：確認済みの${sourceLabel(context.record_type)}記録`,'quiet'));section.append(meta);return section; }
  function contentReading(context, field, title) { const section=el('section',undefined,{class:'context-reading'});section.append(el('h3',`${sourceLabel(context.record_type)}：${title}`),el('p',context[field] || '該当なし'));return section; }
  function interpretiveAxes(caseId, questionId, source) { const entry=matrixFor(caseId,questionId,source);const block=el('section',undefined,{class:'axis-panel'});block.append(el('h3',`${sourceLabel(source)}の分析軸と理由`));const list=el('dl',undefined,{class:'axis-list'});(entry?.axes || []).forEach(row=>{list.append(el('dt',AXIS_LABELS[row.axis]),el('dd',row.value),el('dd',row.reason,{class:'axis-reason'}))});block.append(list);return block; }
  function summaryCard(title, text, tags=[]) { const s=el('article',undefined,{class:'summary-card'});s.append(el('h3',title),el('p',text));if(tags.length)s.append(tagList(tags));return s; }
  function reading(title,text,tone='') { const block=el('section',undefined,{class:`reading ${tone}`});block.append(el('h3',title),el('p',text));return block; }
  function recordPanel(record, q, caseId) { const interview=record.record_type==='interview';const panel=el('article',undefined,{class:`record-panel ${interview?'interview':'questionnaire'}`});const contextual=contextFor(caseId,q.question_id,record.record_type);const summary=contextual?.reading || (interview?q.summary.interview_only:q.summary.questionnaire_only);panel.append(el('div',interview?'面談の記録':'アンケートの記録',{class:'record-title'}),el('p',summary,{class:'record-reading'}),status(record.kind==='masked_quote'?'マスク済み直引用':'編集要約','quiet'));const text=el(record.kind==='masked_quote'?'blockquote':'p',record.text);panel.append(text,tagList(q.tags));if(interview)panel.append(el('p','面談内の記録から作成した抜粋です。発話者と回答範囲は特定していません。',{class:'notice'}));return panel; }
  function records(q, limit=false, source='both', caseId) { const wrap=el('div',undefined,{class:'record-grid'}); const picked=q.cards.filter(x=>source==='both'||x.record_type===source); const ordered=[...picked.filter(x=>x.record_type==='interview'),...picked.filter(x=>x.record_type==='questionnaire')]; (limit?ordered.slice(0,source==='both'?2:1):ordered).forEach(x=>wrap.append(recordPanel(x,q,caseId))); return wrap; }
  function sourceCards(q, source, caseId) { const wrap=el('div',undefined,{class:'record-grid'}); q.cards.filter(x=>x.record_type===source).forEach(x=>wrap.append(recordPanel(x,q,caseId))); return wrap; }
  const TOPIC_VALUES = ['自己に関する記述','関係・集団に向かう記述','より広い文脈に向かう記述','この区分では判断しない'];
  const FORM_VALUES = {
    interview: {'振り返りや描写として扱われています':'振り返り・描写として展開','やり取りのなかで扱われています':'やり取りとして展開','話題が移りながら広がる形で扱われています':'話題が移り広がる展開','読み取れる手がかりが限られています':'話題を十分に読み取れない記録上の状態','この区分では判断していません':'この区分では判断しない'},
    questionnaire: {'振り返りや描写として扱われています':'振り返り・描写として展開','具体的な出来事や外への参照として書かれています':'具体的な出来事・外部への参照','短い記述として表れています':'記述が短く、話題を十分に読み取れない状態','この区分では判断していません':'この区分では判断しない'}
  };
  const SOURCE_LABEL = { interview: '面談', questionnaire: 'アンケート' };
  const axisName = () => (state.axis === 'form' ? '記録の表れ方' : state.axis === 'interpretive' ? AXIS_LABELS[state.interpretiveAxis] : '話題の向き');
  const activeSources = () => (state.source === 'both' ? ['interview','questionnaire'] : [state.source]);
  const pickTopics = text => TOPIC_VALUES.filter(v => (text||'').includes(v));
  function topicSets(q) { const both=pickTopics(q.summary.both); return { both, interview:[...new Set([...both,...pickTopics(q.summary.interview_only)])], questionnaire:[...new Set([...both,...pickTopics(q.summary.questionnaire_only)])] }; }
  function formValue(q, source) { const m=(q.summary.form_difference||'').match(/面談では(.+?)。アンケートでは(.+?)。/); if(!m) return ''; return FORM_VALUES[source][source==='interview'?m[1]:m[2]] || ''; }
  function axisValues(q, source, caseId) { if(state.axis==='form'){const v=formValue(q,source);return v?[v]:[];} if(state.axis==='interpretive'){const value=axisText(matrixFor(caseId,q.question_id,source),state.interpretiveAxis);return value==='該当なし'?[]:[value];} return topicSets(q)[source]; }
  function axisEntries(q, source, caseId) { return axisValues(q,source,caseId).map(v => [v,1]); }
  function axisSummary(q, source, caseId) { const contextual=contextFor(caseId,q.question_id,source);if(state.axis==='interpretive'){const row=axisRow(matrixFor(caseId,q.question_id,source),state.interpretiveAxis);return row ? `${row.value}。${row.reason}` : '該当なし';}if(state.axis==='form'){const form=formValue(q,source);return form ? `記録の表れ方：${form}。${contextual?.reading || '該当なし'}` : (contextual?.reading || '該当なし');}return contextual?.reading || '該当なし'; }
  function countTags(questions) { const counts={};questions.forEach(q=>q.tags.forEach(t=>counts[t]=(counts[t]||0)+1));return Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])); }
  const palette=['#2f6258','#b4573c','#b99336','#506d90','#856b8c','#6c7a51','#9a5f73','#537f7d'];
  function donut(entries,label,center) {
    const values=entries.filter(([,value])=>Number.isFinite(value)&&value>0);
    const figure=el('figure',undefined,{class:'donut'});
    if(!values.length){
      figure.classList.add('donut-empty');
      figure.append(el('figcaption',label),el('p',`${center}：該当なし`,{class:'chart-empty',role:'status'}));
      return figure;
    }
    const total=values.reduce((n,[,value])=>n+value,0);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 180 180');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${label}: ${values.map(([name,value])=>`${name} ${value}件`).join('、')}`);
    const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=svg.getAttribute('aria-label');svg.append(title);
    if(values.length===1){
      const ring=document.createElementNS('http://www.w3.org/2000/svg','circle');
      ring.setAttribute('cx','90');ring.setAttribute('cy','90');ring.setAttribute('r','60');ring.setAttribute('fill',palette[0]);svg.append(ring);
    }else{
      let cursor=-Math.PI/2;
      values.forEach(([name,value],i)=>{const angle=(value/total)*Math.PI*2;const x1=90+60*Math.cos(cursor),y1=90+60*Math.sin(cursor);cursor+=angle;const x2=90+60*Math.cos(cursor),y2=90+60*Math.sin(cursor);const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M90 90 L${x1} ${y1} A60 60 0 ${angle>Math.PI?1:0} 1 ${x2} ${y2} Z`);path.setAttribute('fill',palette[i%palette.length]);svg.append(path);});
    }
    const hole=document.createElementNS('http://www.w3.org/2000/svg','circle');hole.setAttribute('cx','90');hole.setAttribute('cy','90');hole.setAttribute('r','38');hole.setAttribute('fill','#fffdfa');svg.append(hole);
    [[88,center,'10'],[102,`${total} 件`,'9']].forEach(([y,text,size])=>{const node=document.createElementNS('http://www.w3.org/2000/svg','text');node.setAttribute('x','90');node.setAttribute('y',String(y));node.setAttribute('text-anchor','middle');node.setAttribute('font-size',size);node.textContent=text;svg.append(node);});
    figure.append(svg,el('figcaption',label));
    const legend=el('ul',undefined,{class:'legend'});values.forEach(([name,value],i)=>{const li=el('li');li.append(el('i','',{style:`background:${palette[i%palette.length]}`}),document.createTextNode(`${name} ${value}件`));legend.append(li);});figure.append(legend);return figure;
  }
  function bars(counts,label) { const max=Math.max(...Object.values(counts),1);const block=el('section',undefined,{class:'bar-chart'});block.append(el('h3',label));Object.entries(counts).filter(([,v])=>v>0).forEach(([name,value],i)=>{const row=el('div',undefined,{class:'bar-row'});const head=el('div',undefined,{class:'bar-head'});head.append(el('span',name),el('b',`${value}件`));const track=el('div',undefined,{class:'bar-track'}),bar=el('i','',{style:`width:${value/max*100}%;background:${palette[i%palette.length]}`});track.append(bar);row.append(head,track);block.append(row);});return block; }
  function sectionNotice() { return el('p','面談とアンケートは別の記録として扱います。件数は重要度・発話量・参加者数を示しません。',{class:'section-notice'}); }

  // ---- 軸のカテゴリと記号 ----------------------------------------------
  const TOPIC_CATEGORIES = ['自己に関する記述','関係・集団に向かう記述','より広い文脈に向かう記述','この区分では判断しない'];
  const AXIS_ORDER = {self_social:['自己','関係','社会'],inner_outer:['内面','外部環境'],temporal:['過去','現在','未来'],agency:['選択','交渉','制約'],movement:['継続','変化','移行'],abstraction:['具体的経験','抽象的判断'],certainty:['確信','迷い','両義性'],relation_mode:['個人','集団','制度']};
  const formCategories = source => Object.keys(data.cross_case.form_counts[source] || {});
  function axisCategories(source) {
    if (state.axis === 'form') return formCategories(source);
    if (state.axis === 'interpretive') return AXIS_ORDER[state.interpretiveAxis] || [];
    return TOPIC_CATEGORIES;
  }
  const MARKS = {both:{glyph:'◎',label:'両方の記録に見られる'},a:{glyph:'●',label:'CASE Aだけに見られる'},b:{glyph:'■',label:'CASE Bだけに見られる'},none:{glyph:'—',label:'この観点では判断しない'}};
  function mark(kind) { const m=MARKS[kind];const span=el('span',m.glyph,{class:`mark mark-${kind}`,role:'img','aria-label':m.label,title:m.label});return span; }
  function markLegend() {
    const list=el('ul',undefined,{class:'mark-legend'});
    [['both','両方のケースに見られる'],['a','ケースAだけに見られる'],['b','ケースBだけに見られる'],['none','この観点では判断しない']]
      .forEach(([kind,text])=>{const li=el('li');li.append(mark(kind),el('span',text));list.append(li)});
    return list;
  }
  const caseMark = (inA,inB) => (inA&&inB) ? 'both' : inA ? 'a' : inB ? 'b' : 'none';

  // ---- 比較のための値 --------------------------------------------------
  function valuesFor(caseId, questionId, source) {
    const q = question(caseId, questionId);
    return axisValues(q, source, caseId).filter(Boolean);
  }
  function rangeValues(caseId, source) {
    const ids = state.q === 'all' ? QUESTIONS : [state.q];
    return [...new Set(ids.flatMap(id => valuesFor(caseId, id, source)))];
  }
  function compareSets(source) {
    const a = rangeValues(state.a, source), b = rangeValues(state.b, source);
    const order = axisCategories(source);
    const sort = list => order.filter(x => list.includes(x)).concat(list.filter(x => !order.includes(x)));
    return {common:sort(a.filter(x=>b.includes(x))), onlyA:sort(a.filter(x=>!b.includes(x))), onlyB:sort(b.filter(x=>!a.includes(x)))};
  }
  function readingSample(caseId, source, values) {
    const ids = state.q === 'all' ? QUESTIONS : [state.q];
    for (const id of ids) {
      if (!values.length || valuesFor(caseId, id, source).some(v => values.includes(v))) {
        const ctx = contextFor(caseId, id, source);
        if (ctx && ctx.reading) return `${id}（${sourceLabel(source)}）：${ctx.reading}`;
      }
    }
    return '';
  }

  // ---- 全体を見る ------------------------------------------------------
  function researchNoteMatrix(note) {
    const table=el('div',undefined,{class:'note-matrix',role:'table','aria-label':'関係するケースと問い'});
    const headRow=el('div',undefined,{class:'note-matrix-row head',role:'row'});
    headRow.append(el('span','',{role:'columnheader'}));
    QUESTIONS.forEach(id=>headRow.append(el('span',id,{role:'columnheader'})));
    table.append(headRow);
    CASES.forEach(caseId=>{
      const row=el('div',undefined,{class:'note-matrix-row',role:'row'});
      row.append(el('span',caseId,{role:'rowheader'}));
      QUESTIONS.forEach(id=>{
        const hits=note.related.filter(x=>x.case_id===caseId&&x.question_id===id);
        const cell=el('span',undefined,{role:'cell'});
        if(!hits.length){cell.append(el('i','—',{class:'note-none','aria-label':'この問いでは関係しない'}));}
        else{
          const wrap=el('button',undefined,{type:'button',class:'note-cell','aria-label':`${caseId}の${id}を読む`});
          hits.forEach(h=>wrap.append(el('i',h.record_type==='interview'?'●':'▲',{class:`note-glyph ${h.record_type}`,title:sourceLabel(h.record_type)})));
          wrap.addEventListener('click',()=>go({view:'case',caseId,q:id}));
          cell.append(wrap);
        }
        row.append(cell);
      });
      table.append(row);
    });
    const key=el('p','● 面談の記録 ／ ▲ アンケートの記録 ／ — この問いでは関係しない。印の数は重要度を示しません。',{class:'section-notice'});
    const wrap=el('div',undefined,{class:'note-matrix-wrap'});
    wrap.append(table,key);
    return wrap;
  }

  function researchNote(note) {
    const card=el('details',undefined,{class:'research-note'});
    card.append(el('summary',note.title),el('p',note.summary,{class:'note-lead'}));
    card.append(el('h3','記録から見えたこと'),el('p',note.seen_in_records));
    const forms=el('div',undefined,{class:'context-grid'});
    forms.append(reading('面談での現れ方',note.interview_form),reading('アンケートでの現れ方',note.questionnaire_form));
    card.append(forms);
    card.append(el('h3','社会・時代との接点'),el('p',note.social_connection));
    card.append(el('h3','作品・研究へ開く問い'),el('p',note.open_question));
    card.append(el('h3','別の読み方・限界'),el('p',note.alternative_reading,{class:'notice'}));
    card.append(el('h3','関係するケースと問い'),researchNoteMatrix(note));
    const links=el('div',undefined,{class:'evidence-links'});
    note.evidence.forEach(item=>links.append(button(`${item.case_id} ${item.question_id}／${sourceLabel(item.record_type)}`,false,()=>go({view:'case',caseId:item.case_id,q:item.question_id}),{class:'evidence-link'})));
    card.append(el('h3','関連する承認済み記録'),links);
    const cards=el('div',undefined,{class:'record-grid'});
    note.evidence.forEach(item=>cards.append(recordPanel(cardFor(item.case_id,item.question_id,item.record_type),question(item.case_id,item.question_id),item.case_id)));
    card.append(cards);
    return card;
  }

  function overview() { const host=el('div',undefined,{class:'overview'});const overviewCards=el('div',undefined,{class:'summary-grid'});synthesis.overview_findings.forEach(item=>overviewCards.append(summaryCard(item.title,item.text)));const header=el('header','', {class:'view-header'});header.append(el('p','全体を見る',{class:'eyebrow'}),el('h2','まず見えること'));host.append(header);
    const about=el('section',undefined,{class:'interpretive-about'});about.append(el('p','この調査が記録しようとしていること',{class:'eyebrow'}),el('h2',synthesis.about.title),el('p',synthesis.about.text),el('p',synthesis.about.limit,{class:'notice'}));host.append(about);
    const observations=el('section',undefined,{class:'block'});observations.append(el('h2','社会の断面として見えること'));const observationGrid=el('div',undefined,{class:'observation-grid'});synthesis.societal_observations.forEach(item=>{const card=el('details',undefined,{class:'observation'});card.append(el('summary',item.title),el('p',item.text),el('h3','研究・作品への問い'),el('p',item.question));const links=el('div',undefined,{class:'evidence-links'});item.evidence.forEach(itemEvidence=>{const label=`${itemEvidence.case_id} ${itemEvidence.question_id}／${sourceLabel(itemEvidence.record_type)}`;links.append(button(label,false,()=>go({view:'case',caseId:itemEvidence.case_id,q:itemEvidence.question_id}),{class:'evidence-link'}));});card.append(el('h3','根拠となる記録'),links);const details=el('div',undefined,{class:'observation-evidence'});item.evidence.forEach(itemEvidence=>details.append(recordPanel(cardFor(itemEvidence.case_id,itemEvidence.question_id,itemEvidence.record_type),question(itemEvidence.case_id,itemEvidence.question_id),itemEvidence.case_id)));card.append(details,el('h3','読み方の留保'),el('p',item.caveat));observationGrid.append(card)});observations.append(observationGrid);host.append(observations,el('section',undefined,{class:'block'}));host.lastElementChild.append(el('h2','具体的な横断的発見'),overviewCards);
    const qSection=el('section',undefined,{class:'block'});qSection.append(el('h2','質問ごとの構成'));const qGrid=el('div',undefined,{class:'question-grid'});QUESTIONS.forEach(id=>{const qs=data.cases.map(c=>question(c.case_id,id));const finding=questionFindingFor(id);const tags=countTags(qs).slice(0,4).map(x=>x[0]);const card=el('article',undefined,{class:'question-card'});card.append(el('p',id,{class:'eyebrow'}),el('h3',`質問 ${id}`),reading('面談側で見えること',finding.interview),reading('アンケート側で見えること',finding.questionnaire),reading('記録形式を行き来して読む',finding.connection),tagList(tags),button('詳細を見る',false,()=>go({view:'case',q:id,caseId:CASES[0]})));qGrid.append(card)});qSection.append(qGrid);host.append(qSection);
    const chart=el('section',undefined,{class:'block'});chart.append(el('h2','全体グラフ'),sectionNotice());const chartGrid=el('div',undefined,{class:'chart-grid'});chartGrid.append(bars(data.cross_case.form_counts.interview,'面談：記録の表れ方'),bars(data.cross_case.form_counts.questionnaire,'アンケート：記録の表れ方'),donut(countTags(allQuestions()).slice(0,6),'話題の向きが現れる問いの数','全体'));chart.append(chartGrid);host.append(chart);
    const notes=el('section',undefined,{class:'block'});notes.append(el('h2','テーマ別研究ノート'),el('p','六つのケースの記録を横断して、内容のまとまりごとに読み直したノートです。見出しを選ぶと、記録での現れ方・社会との接点・次の問い・関係するケースと問いが開きます。',{class:'section-notice'}));const noteGrid=el('div',undefined,{class:'note-grid'});synthesis.research_notes.forEach(note=>noteGrid.append(researchNote(note)));notes.append(noteGrid,sectionNotice());host.append(notes);return host; }

  // ---- ケースを読む ----------------------------------------------------
  function caseView() {
    const c=data.cases.find(x=>x.case_id===state.caseId),q=question(c.case_id);
    const interviewContext=contextFor(c.case_id,q.question_id,'interview'),questionnaireContext=contextFor(c.case_id,q.question_id,'questionnaire');
    const host=el('div',undefined,{class:'case-view'});
    const head=el('header',undefined,{class:'view-header'});
    head.append(el('p',`${c.case_id} ／ 問い ${q.question_id}`,{class:'eyebrow'}),el('h2',`${q.question_id}を文脈から読む`),el('p','ここから下は、選んだ問いだけを扱います。ケース全体の記述は、問いのタブの上にあります。',{class:'section-notice'}));
    host.append(head);
    const flow=el('section',undefined,{class:'block question-reading'});
    flow.append(el('h3','この問いで扱われたこと'));
    flow.append(el('p',`この問いの記録には、${q.tags.join('、')}が見られます。面談とアンケートは別の記録として読みます。`));
    flow.append(el('h3','面談の文脈要約'),el('p',interviewContext.context));
    flow.append(el('h3','アンケートの文脈要約'),el('p',questionnaireContext.context));
    flow.append(el('h3','面談から読み取れること'),el('p',interviewContext.reading));
    flow.append(el('h3','アンケートから読み取れること'),el('p',questionnaireContext.reading));
    flow.append(el('h3','両方を行き来して見えること'),el('p',q.summary.both));
    const socialRows=[interviewContext,questionnaireContext].filter(row=>row.social_connection);
    if(socialRows.length){flow.append(el('h3','社会との接点'));const socialGrid=el('div',undefined,{class:'context-grid'});socialRows.forEach(row=>socialGrid.append(reading(`${sourceLabel(row.record_type)}：社会との接点`,row.social_connection)));flow.append(socialGrid);}
    flow.append(el('h3','根拠となる引用・編集要約'),records(q,false,'both',c.case_id));
    flow.append(el('h3','分析軸と理由'));
    const axes=el('div',undefined,{class:'axis-grid'});axes.append(interpretiveAxes(c.case_id,q.question_id,'interview'),interpretiveAxes(c.case_id,q.question_id,'questionnaire'));flow.append(axes);
    flow.append(el('h3','別の読み方・不足情報'));
    const alternatives=el('div',undefined,{class:'context-grid'});
    alternatives.append(reading(`面談：別の読み方・不足情報`,interviewContext.alternative_reading),reading(`アンケート：別の読み方・不足情報`,questionnaireContext.alternative_reading));
    flow.append(alternatives);
    flow.append(el('h3','補助図表'),donut(countTags([q]),`${q.question_id}の話題の向き`,q.question_id),sectionNotice());
    host.append(flow);
    return host;
  }

  // ---- ケースを比べる --------------------------------------------------
  function compareChips() {
    const chips=el('ul',undefined,{class:'compare-chips'});
    const items=[`${state.a} と ${state.b}`, state.q==='all'?'すべての問い':`問い ${state.q}`,
      state.source==='both'?'面談とアンケート':sourceLabel(state.source),
      `比較軸：${state.axis==='topic'?'話題の向き':state.axis==='form'?'記録の表れ方':'解釈軸'}`];
    if(state.axis==='interpretive') items.push(`解釈軸：${AXIS_LABELS[state.interpretiveAxis]}`);
    items.forEach(text=>chips.append(el('li',text)));
    return chips;
  }
  function compareSentence() {
    const scope=state.q==='all'?'5つの問い':`問い ${state.q}`;
    const src=state.source==='both'?'面談記録とアンケート回答':`${sourceLabel(state.source)}の記録`;
    const lens=state.axis==='topic'?'「話題の向き」':state.axis==='form'?'「記録の表れ方」':`「${AXIS_LABELS[state.interpretiveAxis]}」`;
    return `${state.a}と${state.b}について、${scope}の${src}を${lens}の観点から見ています。`;
  }
  function compareSummaryCards(source) {
    const sets=compareSets(source);
    const wrap=el('div',undefined,{class:'compare-cards'});
    const build=(title,values,caseId)=>{
      const text=values.length
        ? (caseId ? `${caseId}だけに、${values.join('、')}が見られます。` : `両方のケースで、${values.join('、')}が見られます。`)
        : (caseId ? `${caseId}だけに見られる区分は、この範囲ではありません。` : 'この範囲では、両方のケースに共通して見られる区分はありません。');
      const card=summaryCard(title,text,values);
      const targets=caseId?[caseId]:[state.a,state.b];
      const seen=[];
      targets.forEach(target=>{
        const sample=readingSample(target,source,values);
        if(sample&&!seen.includes(sample)){seen.push(sample);card.append(el('p',`${target} ${sample}`,{class:'card-sample'}));}
      });
      return card;
    };
    wrap.append(build('共通して見えること',sets.common,null),build(`${state.a}で見えること`,sets.onlyA,state.a),build(`${state.b}で見えること`,sets.onlyB,state.b));
    return wrap;
  }
  function comparisonMatrix(source) {
    const categories=axisCategories(source);
    const table=el('div',undefined,{class:'compare-matrix',role:'table','aria-label':`${sourceLabel(source)}の${axisName()}の比較`});
    const head=el('div',undefined,{class:'compare-matrix-row head',role:'row'});
    head.append(el('span','問い',{role:'columnheader'}));
    categories.forEach(name=>head.append(el('span',name,{role:'columnheader'})));
    table.append(head);
    QUESTIONS.forEach(id=>{
      const a=valuesFor(state.a,id,source),b=valuesFor(state.b,id,source);
      const row=el('button',undefined,{type:'button',class:'compare-matrix-row',role:'row','aria-label':`${id}の比較詳細を開く`});
      row.append(el('span',id,{role:'rowheader',class:'row-head'}));
      categories.forEach(name=>{
        const cell=el('span',undefined,{role:'cell'});
        cell.append(mark(caseMark(a.includes(name),b.includes(name))));
        row.append(cell);
      });
      if(!a.length&&!b.length) row.append(el('span','該当なし',{class:'row-none'}));
      row.addEventListener('click',()=>go({q:id}));
      table.append(row);
    });
    return table;
  }
  function laneChart(source) {
    const categories=axisCategories(source);
    const wrap=el('div',undefined,{class:'lane-wrap'});
    const ids=state.q==='all'?QUESTIONS:[state.q];
    ids.forEach(id=>{
      const a=valuesFor(state.a,id,source),b=valuesFor(state.b,id,source);
      const lane=el('div',undefined,{class:'lane'});
      lane.append(el('span',id,{class:'lane-label'}));
      const track=el('div',undefined,{class:'lane-track',role:'img','aria-label':`${id}：${state.a}は${a.join('、')||'軸なし'}、${state.b}は${b.join('、')||'軸なし'}`});
      categories.forEach(name=>{
        const slot=el('span',undefined,{class:'lane-slot'});
        slot.append(el('i',name,{class:'lane-name'}));
        const marks=el('span',undefined,{class:'lane-marks'});
        if(a.includes(name)) marks.append(el('b','●',{title:`${state.a}`}));
        if(b.includes(name)) marks.append(el('b','■',{title:`${state.b}`}));
        slot.append(marks);
        track.append(slot);
      });
      lane.append(track);
      if(!a.length&&!b.length) lane.append(el('span','軸なし',{class:'row-none'}));
      wrap.append(lane);
    });
    return wrap;
  }
  function axisChart(source) {
    if(state.axis==='interpretive') return laneChart(source);
    if(state.axis==='form'){
      const charts=el('div',undefined,{class:'compare-charts'});
      [state.a,state.b].forEach(caseId=>{
        const values=rangeValues(caseId,source);
        if(!values.length){charts.append(el('p',`${caseId}：該当なし`,{class:'row-none'}));return;}
        const counts={};
        (state.q==='all'?QUESTIONS:[state.q]).forEach(id=>valuesFor(caseId,id,source).forEach(v=>{counts[v]=(counts[v]||0)+1}));
        charts.append(donut(Object.entries(counts),`${caseId}：記録の表れ方（${sourceLabel(source)}）`,caseId));
      });
      return charts;
    }
    return comparisonMatrix(source);
  }

  function comparison() {
    const host=el('div',undefined,{class:'compare-view'});
    const header=el('header',undefined,{class:'view-header'});
    header.append(el('p','ケースを比べる',{class:'eyebrow'}),el('h2',state.q==='all'?'5つの問いを見渡す':'一つの問いを並べて読む'));
    header.append(compareChips(),el('p',compareSentence(),{class:'compare-sentence'}));
    header.append(el('p','「共通して見える」は、二人が同じことを言ったという意味ではありません。面談とアンケートは別の記録として数え、合算しません。',{class:'section-notice'}));
    host.append(header);

    activeSources().forEach(source=>{
      const panel=el('section',undefined,{class:`compare-source ${source}`});
      panel.append(el('h2',`${sourceLabel(source)}の記録`));
      panel.append(compareSummaryCards(source));
      if(state.q==='all'){
        panel.append(el('h3',`${axisName()}の比較`),el('p','行を選ぶと、その問いの詳しい比較へ移動します。',{class:'section-notice'}),axisChart(source),markLegend());
      } else {
        const qid=state.q;
        const ctxA=contextFor(state.a,qid,source),ctxB=contextFor(state.b,qid,source);
        const contexts=el('div',undefined,{class:'context-grid'});
        contexts.append(reading(`${state.a}の文脈要約`,ctxA?ctxA.context:'該当なし'),reading(`${state.b}の文脈要約`,ctxB?ctxB.context:'該当なし'));
        panel.append(el('h3','それぞれの文脈要約'),contexts);
        const sets=compareSets(source);
        panel.append(el('h3','共通して読めること'),el('p',sets.common.length?`両方の記録で、${sets.common.join('、')}が見られます。`:'この問いでは、両方に共通して見られる区分はありません。'));
        panel.append(el('h3','異なる形で現れること'),el('p',`${state.a}：${sets.onlyA.join('、')||'この観点で固有の区分はありません'}／${state.b}：${sets.onlyB.join('、')||'この観点で固有の区分はありません'}`));
        panel.append(el('h3',`${axisName()}の比較図`),axisChart(source),markLegend());
        const evidence=el('div',undefined,{class:'record-grid'});
        evidence.append(sourceCards(question(state.a,qid),source,state.a),sourceCards(question(state.b,qid),source,state.b));
        panel.append(el('h3',`${state.a}の根拠／${state.b}の根拠`),evidence);
        const alt=el('div',undefined,{class:'context-grid'});
        alt.append(reading(`${state.a}：別の読み方・不足情報`,ctxA?ctxA.alternative_reading:'該当なし'),reading(`${state.b}：別の読み方・不足情報`,ctxB?ctxB.alternative_reading:'該当なし'));
        panel.append(el('h3','別の読み方・不足情報'),alt);
      }
      host.append(panel);
    });

    if(state.q!=='all'){
      const links=el('div',undefined,{class:'evidence-links'});
      [state.a,state.b].forEach(caseId=>links.append(button(`${caseId}の${state.q}を読む`,false,()=>go({view:'case',caseId,q:state.q}),{class:'evidence-link'})));
      const foot=el('section',undefined,{class:'block'});
      foot.append(el('h2','ケース詳細へ移動'),links);
      host.append(foot);
    }
    host.append(sectionNotice());
    return host;
  }

  function subnav() {
    const host=$('#subnav'); host.replaceChildren(); const inner=el('div',undefined,{class:'shell subnav-inner'});
    if(state.view==='case'){
      const caseTabs=el('div',undefined,{class:'tab-scroll',role:'tablist','aria-label':'ケースを選ぶ'});
      CASES.forEach(id=>caseTabs.append(button(id,id===state.caseId,()=>go({caseId:id}),{role:'tab'})));
      inner.append(caseTabs);
      const cs=caseSynthesisFor(state.caseId);
      const whole=el('section',undefined,{class:'case-synthesis'});
      whole.append(el('h2','このケースを横断して読む'),el('p','Q01〜Q05を通した記述です。問いのタブを切り替えても、ここは変わりません。',{class:'section-notice'}));
      whole.append(el('p',cs.synthesis.slice(0,90)+(cs.synthesis.length>90?'…':''),{class:'case-lead'}));
      const more=el('details',undefined,{class:'case-full'});
      more.append(el('summary','全文を読む'),el('p',cs.synthesis),el('h3','別の読み方と限界'),el('p',cs.alternative_reading,{class:'notice'}));
      whole.append(more);
      inner.append(whole);
      const qTabs=el('div',undefined,{class:'tab-scroll',role:'tablist','aria-label':'問いを選ぶ'});
      qTabs.append(el('span','問いを選ぶ',{class:'tab-label'}));
      QUESTIONS.forEach(id=>qTabs.append(button(id,id===state.q,()=>go({q:id}),{role:'tab'})));
      inner.append(qTabs);
    }
    if(state.view==='compare'){
      const form=el('div',undefined,{class:'compare-controls'});
      const select=(label,value,items,fn)=>{const l=el('label',label);const s=el('select');items.forEach(item=>{const [id,text]=Array.isArray(item)?item:[item,item];const o=el('option',text,{value:id});o.selected=id===value;o.disabled=(label==='ケース B'&&id===state.a)||(label==='ケース A'&&id===state.b);s.append(o)});s.addEventListener('change',e=>fn(e.target.value));l.append(s);return l;};
      const group=(title,...fields)=>{const box=el('fieldset',undefined,{class:'control-group'});box.append(el('legend',title));fields.forEach(f=>box.append(f));return box;};
      form.append(
        group('比較する対象',select('ケース A',state.a,CASES,v=>go({a:v})),select('ケース B',state.b,CASES,v=>go({b:v})),select('問い',state.q,[['all','すべての問い'],...QUESTIONS],v=>go({q:v}))),
        group('見る記録',select('記録の種類',state.source,[['both','面談とアンケート'],['interview','面談'],['questionnaire','アンケート']],v=>go({source:v}))),
        group('見る観点',select('比較軸',state.axis,[['topic','話題の向き'],['form','記録の表れ方'],['interpretive','解釈軸']],v=>go({axis:v})),select('解釈軸',state.interpretiveAxis,[['self_social','自己・関係・社会'],['inner_outer','内面・外部環境'],['temporal','時間の方向'],['agency','選択・制約・交渉'],['movement','継続・変化・移行'],['abstraction','具体・抽象'],['certainty','確信・迷い・両義性'],['relation_mode','個人・集団・制度']],v=>go({interpretiveAxis:v})))
      );
      inner.append(form,el('p',compareSentence(),{class:'compare-sentence subnav-sentence'}));
    }
    host.append(inner);
  }
  function render(){document.querySelectorAll('.primary-nav button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.view===state.view)));subnav();const host=$('#view');host.replaceChildren(state.view==='overview'?overview():state.view==='case'?caseView():comparison());}
  document.querySelectorAll('.primary-nav button').forEach(b=>b.addEventListener('click',()=>go({view:b.dataset.view})));
  window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);
    state.view=valid(p.get('view'),['overview','case','compare'],'overview');
    state.caseId=valid(p.get('case'),CASES,state.caseId);
    state.q=valid(p.get('all')==='1'?'all':p.get('q'),['all',...QUESTIONS],'Q01');
    state.a=valid(p.get('a'),CASES,state.a);state.b=valid(p.get('b'),CASES,state.b);
    if(state.a===state.b)state.b=CASES.find(x=>x!==state.a);
    state.axis=valid(p.get('axis'),['topic','form','interpretive'],'topic');
    state.source=valid(p.get('source'),['both','interview','questionnaire'],'both');
    state.interpretiveAxis=valid(p.get('interpretive_axis'),['self_social','inner_outer','temporal','agency','movement','abstraction','certainty','relation_mode'],'self_social');
    render();});
  updateUrl();render();
})();

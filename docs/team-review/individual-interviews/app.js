(() => {
  const data = window.TEAM_REVIEW_DATA;
  const CASES = data.cases.map(x => x.case_id);
  const QUESTIONS = ['Q01', 'Q02', 'Q03', 'Q04', 'Q05'];
  const params = new URLSearchParams(location.search);
  const valid = (value, list, fallback) => list.includes(value) ? value : fallback;
  const state = {
    view: valid(params.get('view'), ['overview', 'case', 'compare'], 'overview'),
    caseId: valid(params.get('case'), CASES, CASES[0]),
    q: valid(params.get('all') === '1' ? 'all' : params.get('q'), ['all', ...QUESTIONS], 'Q01'),
    a: valid(params.get('a'), CASES, CASES[0]), b: valid(params.get('b'), CASES, CASES[1]),
    axis: valid(params.get('axis'), ['topic', 'form'], 'topic'), source: valid(params.get('source'), ['both', 'interview', 'questionnaire'], 'both')
  };
  if (state.a === state.b) state.b = CASES.find(x => x !== state.a);
  const $ = selector => document.querySelector(selector);
  const el = (tag, text, attrs = {}) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k,v)); return node; };
  const question = (caseId, q = state.q) => data.cases.find(x => x.case_id === caseId).questions.find(x => x.question_id === q);
  const allQuestions = () => data.cases.flatMap(c => c.questions);
  const questionState = () => (state.q === 'all' ? 'all' : state.q);
  const detailQuestion = () => (state.q === 'all' ? QUESTIONS[0] : state.q);
  const urlFor = () => { const p = new URLSearchParams({view:state.view,q:questionState()}); if(state.view==='case')p.set('case',state.caseId); if(state.view==='compare'){p.set('a',state.a);p.set('b',state.b);p.set('axis',state.axis);p.set('source',state.source);} return `${location.pathname}?${p}`; };
  const updateUrl = (push=false) => { const url=urlFor(); if(push) history.pushState({...state},'',url); else history.replaceState({...state},'',url); };
  const go = changes => { Object.assign(state,changes); if(state.a===state.b)state.b=CASES.find(x=>x!==state.a); updateUrl(true); render(); };

  $('#notice').textContent = data.notice;
  function button(label, selected, handler, attrs = {}) { const b=el('button',label,{type:'button',...attrs}); if(selected!==undefined)b.setAttribute('aria-selected',String(selected)); b.addEventListener('click',handler); return b; }
  function tagList(tags) { const list=el('ul',undefined,{class:'tags', 'aria-label':'関連するテーマ'}); tags.forEach(t=>list.append(el('li',t))); return list; }
  function status(text, tone='') { return el('span',text,{class:`state ${tone}`.trim()}); }
  function summaryCard(title, text, tags=[]) { const s=el('article',undefined,{class:'summary-card'});s.append(el('h3',title),el('p',text));if(tags.length)s.append(tagList(tags));return s; }
  function reading(title,text,tone='') { const block=el('section',undefined,{class:`reading ${tone}`});block.append(el('h3',title),el('p',text));return block; }
  function recordPanel(record, q) { const interview=record.record_type==='interview';const panel=el('article',undefined,{class:`record-panel ${interview?'interview':'questionnaire'}`});const summary=interview?q.summary.interview_only:q.summary.questionnaire_only;panel.append(el('div',interview?'面談の記録':'アンケートの記録',{class:'record-title'}),el('p',summary,{class:'record-reading'}),status(record.kind==='masked_quote'?'マスク済み直引用':'編集要約','quiet'));const text=el(record.kind==='masked_quote'?'blockquote':'p',record.text);panel.append(text,tagList(q.tags));if(interview)panel.append(el('p','面談内の記録から作成した抜粋です。発話者と回答範囲は特定していません。',{class:'notice'}));return panel; }
  function records(q, limit=false, source='both') { const wrap=el('div',undefined,{class:'record-grid'}); const picked=q.cards.filter(x=>source==='both'||x.record_type===source); const ordered=[...picked.filter(x=>x.record_type==='interview'),...picked.filter(x=>x.record_type==='questionnaire')]; (limit?ordered.slice(0,source==='both'?2:1):ordered).forEach(x=>wrap.append(recordPanel(x,q))); return wrap; }
  function sourceCards(q, source) { const wrap=el('div',undefined,{class:'record-grid'}); q.cards.filter(x=>x.record_type===source).forEach(x=>wrap.append(recordPanel(x,q))); return wrap; }
  const TOPIC_VALUES = ['自己に関する記述','関係・集団に向かう記述','より広い文脈に向かう記述','この区分では判断しない'];
  const FORM_VALUES = {
    interview: {'振り返りや描写として扱われています':'振り返り・描写として展開','やり取りのなかで扱われています':'やり取りとして展開','話題が移りながら広がる形で扱われています':'話題が移り広がる展開','読み取れる手がかりが限られています':'話題を十分に読み取れない記録上の状態','この区分では判断していません':'この区分では判断しない'},
    questionnaire: {'振り返りや描写として扱われています':'振り返り・描写として展開','具体的な出来事や外への参照として書かれています':'具体的な出来事・外部への参照','短い記述として表れています':'記述が短く、話題を十分に読み取れない状態','この区分では判断していません':'この区分では判断しない'}
  };
  const SOURCE_LABEL = { interview: '面談', questionnaire: 'アンケート' };
  const axisName = () => (state.axis === 'form' ? '記録の表れ方' : '話題の向き');
  const activeSources = () => (state.source === 'both' ? ['interview','questionnaire'] : [state.source]);
  const pickTopics = text => TOPIC_VALUES.filter(v => (text||'').includes(v));
  function topicSets(q) { const both=pickTopics(q.summary.both); return { both, interview:[...new Set([...both,...pickTopics(q.summary.interview_only)])], questionnaire:[...new Set([...both,...pickTopics(q.summary.questionnaire_only)])] }; }
  function formValue(q, source) { const m=(q.summary.form_difference||'').match(/面談では(.+?)。アンケートでは(.+?)。/); if(!m) return ''; return FORM_VALUES[source][source==='interview'?m[1]:m[2]] || ''; }
  function axisValues(q, source) { if(state.axis==='form'){const v=formValue(q,source);return v?[v]:[];} return topicSets(q)[source]; }
  function axisEntries(q, source) { return axisValues(q,source).map(v => [v,1]); }
  function axisSummary(q, source) { return state.axis==='form' ? (source==='interview'?`面談では${(q.summary.form_difference.match(/面談では(.+?)。/)||[,''])[1]}。`:`アンケートでは${(q.summary.form_difference.match(/アンケートでは(.+?)。/)||[,''])[1]}。`) : (source==='interview'?q.summary.interview_only:q.summary.questionnaire_only); }
  function countTags(questions) { const counts={};questions.forEach(q=>q.tags.forEach(t=>counts[t]=(counts[t]||0)+1));return Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])); }
  const palette=['#2f6258','#b4573c','#b99336','#506d90','#856b8c','#6c7a51','#9a5f73','#537f7d'];
  function donut(entries,label,center) { const total=entries.reduce((n,[,v])=>n+v,0)||1;let cursor=-Math.PI/2;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 180 180');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${label}: ${entries.map(([n,v])=>`${n} ${v}件`).join('、')}`);const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=svg.getAttribute('aria-label');svg.append(title);entries.forEach(([name,value],i)=>{const angle=(value/total)*Math.PI*2;const x1=90+60*Math.cos(cursor),y1=90+60*Math.sin(cursor);cursor+=angle;const x2=90+60*Math.cos(cursor),y2=90+60*Math.sin(cursor);const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M90 90 L${x1} ${y1} A60 60 0 ${angle>Math.PI?1:0} 1 ${x2} ${y2} Z`);path.setAttribute('fill',palette[i%palette.length]);svg.append(path);});const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx','90');circle.setAttribute('cy','90');circle.setAttribute('r','38');circle.setAttribute('fill','#fffdfa');svg.append(circle);const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x','90');text.setAttribute('y','88');text.setAttribute('text-anchor','middle');text.setAttribute('font-size','10');text.textContent=center;svg.append(text);const n=document.createElementNS('http://www.w3.org/2000/svg','text');n.setAttribute('x','90');n.setAttribute('y','102');n.setAttribute('text-anchor','middle');n.setAttribute('font-size','9');n.textContent=`${total} 件`;svg.append(n);const figure=el('figure',undefined,{class:'donut'});figure.append(svg,el('figcaption',label));const legend=el('ul',undefined,{class:'legend'});entries.forEach(([name,value],i)=>{const li=el('li');li.append(el('i','',{style:`background:${palette[i%palette.length]}`}),document.createTextNode(`${name} ${value}件`));legend.append(li);});figure.append(legend);return figure; }
  function bars(counts,label) { const max=Math.max(...Object.values(counts),1);const block=el('section',undefined,{class:'bar-chart'});block.append(el('h3',label));Object.entries(counts).filter(([,v])=>v>0).forEach(([name,value],i)=>{const row=el('div',undefined,{class:'bar-row'});const head=el('div',undefined,{class:'bar-head'});head.append(el('span',name),el('b',`${value}件`));const track=el('div',undefined,{class:'bar-track'}),bar=el('i','',{style:`width:${value/max*100}%;background:${palette[i%palette.length]}`});track.append(bar);row.append(head,track);block.append(row);});return block; }
  function sectionNotice() { return el('p','面談とアンケートは別の記録として扱います。件数は重要度・発話量・参加者数を示しません。',{class:'section-notice'}); }

  function overview() { const host=el('div',undefined,{class:'overview'});const tags=countTags(allQuestions()).slice(0,5).map(x=>x[0]);const overviewCards=el('div',undefined,{class:'summary-grid'});overviewCards.append(summaryCard('複数ケースに見られた話題',data.cross_case.common,tags.slice(0,3)),summaryCard('面談で表れやすかった記録の形',data.cross_case.record_forms,[]),summaryCard('アンケートと行き来して見えること',data.cross_case.by_question,tags.slice(2)),summaryCard('研究・場づくりへの問い',data.cross_case.questions[0]||'',[]));host.append(el('header','', {class:'view-header'}),overviewCards);host.querySelector('header').append(el('p','全体を見る',{class:'eyebrow'}),el('h2','まず見えること'));
    const qSection=el('section',undefined,{class:'block'});qSection.append(el('h2','質問ごとの構成'));const qGrid=el('div',undefined,{class:'question-grid'});QUESTIONS.forEach(id=>{const qs=data.cases.map(c=>question(c.case_id,id));const tags=countTags(qs).slice(0,4).map(x=>x[0]);const card=el('article',undefined,{class:'question-card'});card.append(el('p',id,{class:'eyebrow'}),el('h3',`質問 ${id}`),reading('面談側で見えること',qs[0].summary.interview_only),reading('アンケート側で見えること',qs[0].summary.questionnaire_only),reading('共通して確認できること',qs[0].summary.both),tagList(tags),button('詳細を見る',false,()=>go({view:'case',q:id,caseId:CASES[0]})));qGrid.append(card)});qSection.append(qGrid);host.append(qSection);
    const chart=el('section',undefined,{class:'block'});chart.append(el('h2','全体グラフ'),sectionNotice());const chartGrid=el('div',undefined,{class:'chart-grid'});chartGrid.append(bars(data.cross_case.form_counts.interview,'面談：記録の表れ方'),bars(data.cross_case.form_counts.questionnaire,'アンケート：記録の表れ方'),donut(countTags(allQuestions()).slice(0,6),'テーマタグが現れる質問数','全体'));chart.append(chartGrid);host.append(chart);
    const cross=el('section',undefined,{class:'block'});cross.append(el('h2','横断して見えること'));[['共通性',data.cross_case.common],['形式差',data.cross_case.record_forms],['研究・場づくりへの問い',data.cross_case.questions.join('\n')]].forEach(([title,text])=>{const d=el('details');d.append(el('summary',title),el('p',text));cross.append(d)});host.append(cross);return host; }
  function caseView() { const c=data.cases.find(x=>x.case_id===state.caseId),q=question(c.case_id);const host=el('div',undefined,{class:'case-view'});const head=el('header',undefined,{class:'view-header'});head.append(el('p',`${c.case_id} ／ 質問 ${q.question_id}`,{class:'eyebrow'}),el('h2','ケースを読む'));host.append(head);const summary=el('div',undefined,{class:'summary-grid compact'});summary.append(summaryCard('このケースで見えている話題',q.summary.both,q.tags),summaryCard('記録上の特徴',q.summary.form_difference),summaryCard('読む際の留保',q.summary.caveat));host.append(summary);const flow=el('section',undefined,{class:'block'});flow.append(el('h2','この問いで見えていること'),reading('面談とアンケートを行き来して読む',q.summary.both),el('h3','テーマタグ'),tagList(q.tags),el('h3','面談とアンケートの記録'),records(q),el('h3','話題構成の補助図'),donut(countTags([q]),'この質問で確認済みのテーマタグ','質問 '+q.question_id),reading('読み方の留保',q.summary.caveat,'caveat'),sectionNotice());host.append(flow);return host; }
  function comparison() {
    const host = el('div', undefined, { class: 'compare-view' });
    const header = el('header', undefined, { class: 'view-header' });
    const sourceText = state.source === 'both' ? '面談とアンケート' : SOURCE_LABEL[state.source];
    header.append(
      el('p', 'ケースを比べる', { class: 'eyebrow' }),
      el('h2', state.q === 'all' ? '5つの質問の概要' : '一つの質問を並べて読む'),
      el('p', `比較軸は「${axisName()}」、表示する記録は「${sourceText}」です。順位や優劣ではなく、話題の向きと記録の表れ方を探索します。`)
    );
    host.append(header);

    if (state.q === 'all') {
      const matrix = el('div', undefined, { class: 'matrix' });
      QUESTIONS.forEach(id => {
        const a = question(state.a, id), b = question(state.b, id);
        const row = el('button', undefined, { type: 'button' });
        row.append(el('b', id));
        activeSources().forEach(src => {
          const va = axisValues(a, src), vb = axisValues(b, src);
          const cell = el('span', undefined, { class: 'matrix-cell' });
          if (state.source === 'both') cell.append(el('i', SOURCE_LABEL[src], { class: 'matrix-source' }));
          cell.append(document.createTextNode(`${state.a}: ${va.join('、') || '該当なし'} ／ ${state.b}: ${vb.join('、') || '該当なし'}`));
          row.append(cell);
        });
        row.addEventListener('click', () => go({ q: id }));
        matrix.append(row);
      });
      host.append(el('p', `行を選ぶと、その質問の比較詳細を開きます。表は「${axisName()}」で表示しています。`, { class: 'section-notice' }), matrix, sectionNotice());
      return host;
    }

    const qid = detailQuestion();
    const qa = question(state.a, qid), qb = question(state.b, qid);

    activeSources().forEach(src => {
      const panel = el('section', undefined, { class: `compare-source ${src}` });
      panel.append(el('h2', `${SOURCE_LABEL[src]}の記録`));
      panel.append(el('p', `${axisName()}で読みます。`, { class: 'section-notice' }));

      const cards = el('div', undefined, { class: 'compare-cards' });
      if (state.axis === 'form') {
        cards.append(
          summaryCard(`${state.a}の記録の表れ方`, axisSummary(qa, src)),
          summaryCard(`${state.b}の記録の表れ方`, axisSummary(qb, src)),
          summaryCard('比較の留保', qa.summary.caveat)
        );
      } else {
        const va = axisValues(qa, src), vb = axisValues(qb, src);
        const common = va.filter(v => vb.includes(v));
        const onlyA = va.filter(v => !vb.includes(v));
        const onlyB = vb.filter(v => !va.includes(v));
        cards.append(
          summaryCard('共通して確認できること', common.length ? common.join('、') : '共通する話題の向きはありません。', common),
          summaryCard(`${state.a}で確認できること`, onlyA.length ? onlyA.join('、') : '一方だけで確認できる話題の向きはありません。', onlyA),
          summaryCard(`${state.b}で確認できること`, onlyB.length ? onlyB.join('、') : '一方だけで確認できる話題の向きはありません。', onlyB)
        );
      }
      panel.append(cards);

      const charts = el('div', undefined, { class: 'compare-charts' });
      charts.append(
        donut(axisEntries(qa, src), `${state.a}：${axisName()}（${SOURCE_LABEL[src]}）`, state.a),
        donut(axisEntries(qb, src), `${state.b}：${axisName()}（${SOURCE_LABEL[src]}）`, state.b)
      );
      panel.append(charts);

      const evidence = el('details', undefined, { class: 'evidence' });
      evidence.append(el('summary', `${SOURCE_LABEL[src]}の根拠となる記録を見る`));
      const columns = el('div', undefined, { class: 'record-grid' });
      columns.append(sourceCards(qa, src), sourceCards(qb, src));
      evidence.append(columns);
      panel.append(evidence);

      host.append(panel);
    });

    host.append(sectionNotice());
    return host;
  }

  function subnav() {
    const host=$('#subnav'); host.replaceChildren(); const inner=el('div',undefined,{class:'shell subnav-inner'});
    if(state.view==='case'){
      const caseTabs=el('div',undefined,{class:'tab-scroll',role:'tablist','aria-label':'ケースを選ぶ'});
      CASES.forEach(id=>caseTabs.append(button(id,id===state.caseId,()=>go({caseId:id}),{role:'tab'})));
      const qTabs=el('div',undefined,{class:'tab-scroll',role:'tablist','aria-label':'質問を選ぶ'});
      QUESTIONS.forEach(id=>qTabs.append(button(id,id===state.q,()=>go({q:id}),{role:'tab'})));
      inner.append(caseTabs,qTabs);
    }
    if(state.view==='compare'){
      const form=el('div',undefined,{class:'compare-controls'});
      const select=(label,value,items,fn)=>{const l=el('label',label);const s=el('select');items.forEach(item=>{const [id,text]=Array.isArray(item)?item:[item,item];const o=el('option',text,{value:id});o.selected=id===value;o.disabled=(label==='ケース B'&&id===state.a)||(label==='ケース A'&&id===state.b);s.append(o)});s.addEventListener('change',e=>fn(e.target.value));l.append(s);return l;};
      form.append(select('ケース A',state.a,CASES,v=>go({a:v})),select('ケース B',state.b,CASES,v=>go({b:v})),select('質問',state.q,[['all','すべての質問'],...QUESTIONS],v=>go({q:v})),select('比較軸',state.axis,[['topic','話題の向き'],['form','記録の表れ方']],v=>go({axis:v})),select('表示する記録',state.source,[['both','面談とアンケート'],['interview','面談'],['questionnaire','アンケート']],v=>go({source:v})));
      inner.append(form);
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
    state.axis=valid(p.get('axis'),['topic','form'],'topic');
    state.source=valid(p.get('source'),['both','interview','questionnaire'],'both');
    render();});
  updateUrl();render();
})();

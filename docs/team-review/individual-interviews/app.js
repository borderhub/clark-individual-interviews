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

  function overview() { const host=el('div',undefined,{class:'overview'});const overviewCards=el('div',undefined,{class:'summary-grid'});synthesis.overview_findings.forEach(item=>overviewCards.append(summaryCard(item.title,item.text)));const header=el('header','',{class:'view-header'});header.append(el('p','全体を見る',{class:'eyebrow'}),el('h2','まず見えること'));host.append(header);
    const about=el('section',undefined,{class:'interpretive-about'});about.append(el('p','この調査が記録しようとしていること',{class:'eyebrow'}),el('h2',synthesis.about.title),el('p',synthesis.about.text),el('p',synthesis.about.limit,{class:'notice'}));host.append(about);
    const observations=el('section',undefined,{class:'block'});observations.append(el('h2','社会の断面として見えること'));const observationGrid=el('div',undefined,{class:'observation-grid'});synthesis.societal_observations.forEach(item=>{const card=el('details',undefined,{class:'observation'});card.append(el('summary',item.title),el('p',item.text),el('h3','研究・作品への問い'),el('p',item.question));const links=el('div',undefined,{class:'evidence-links'});item.evidence.forEach(itemEvidence=>{const label=`${itemEvidence.case_id} ${itemEvidence.question_id}／${sourceLabel(itemEvidence.record_type)}`;links.append(button(label,false,()=>go({view:'case',caseId:itemEvidence.case_id,q:itemEvidence.question_id}),{class:'evidence-link'}));});card.append(el('h3','根拠となる記録'),links);const details=el('div',undefined,{class:'observation-evidence'});item.evidence.forEach(itemEvidence=>details.append(recordPanel(cardFor(itemEvidence.case_id,itemEvidence.question_id,itemEvidence.record_type),question(itemEvidence.case_id,itemEvidence.question_id),itemEvidence.case_id)));card.append(details,el('h3','読み方の留保'),el('p',item.caveat));observationGrid.append(card)});observations.append(observationGrid);host.append(observations,el('section',undefined,{class:'block'}));host.lastElementChild.append(el('h2','具体的な横断的発見'),overviewCards);
    const qSection=el('section',undefined,{class:'block'});qSection.append(el('h2','質問ごとの構成'));const qGrid=el('div',undefined,{class:'question-grid'});QUESTIONS.forEach(id=>{const qs=data.cases.map(c=>question(c.case_id,id));const finding=questionFindingFor(id);const tags=countTags(qs).slice(0,4).map(x=>x[0]);const card=el('article',undefined,{class:'question-card'});card.append(el('p',id,{class:'eyebrow'}),el('h3',`質問 ${id}`),reading('面談側で見えること',finding.interview),reading('アンケート側で見えること',finding.questionnaire),reading('記録形式を行き来して読む',finding.connection),tagList(tags),button('詳細を見る',false,()=>go({view:'case',q:id,caseId:CASES[0]})));qGrid.append(card)});qSection.append(qGrid);host.append(qSection);
    const chart=el('section',undefined,{class:'block'});chart.append(el('h2','全体グラフ'),sectionNotice());const chartGrid=el('div',undefined,{class:'chart-grid'});chartGrid.append(bars(data.cross_case.form_counts.interview,'面談：記録の表れ方'),bars(data.cross_case.form_counts.questionnaire,'アンケート：記録の表れ方'),donut(countTags(allQuestions()).slice(0,6),'テーマタグが現れる質問数','全体'));chart.append(chartGrid);host.append(chart);
    const research=el('section',undefined,{class:'block'});research.append(el('h2','研究・作品への問い'));const researchGrid=el('div',undefined,{class:'note-grid'});synthesis.societal_observations.forEach(item=>researchGrid.append(summaryCard(item.title,item.question)));research.append(researchGrid);host.append(research);
    const notes=el('section',undefined,{class:'block'});notes.append(el('h2','読み方の留保と研究ノート'));const noteGrid=el('div',undefined,{class:'note-grid'});synthesis.research_notes.forEach(note=>noteGrid.append(summaryCard(note.theme,note.note)));notes.append(noteGrid,sectionNotice());host.append(notes);return host; }
  function caseView() { const c=data.cases.find(x=>x.case_id===state.caseId),q=question(c.case_id),caseSynthesis=caseSynthesisFor(c.case_id);const interviewContext=contextFor(c.case_id,q.question_id,'interview'),questionnaireContext=contextFor(c.case_id,q.question_id,'questionnaire');const host=el('div',undefined,{class:'case-view'});const head=el('header',undefined,{class:'view-header'});head.append(el('p',`${c.case_id} ／ 質問 ${q.question_id}`,{class:'eyebrow'}),el('h2','ケースを読む'));host.append(head);
    const whole=el('details',undefined,{class:'case-synthesis'});whole.append(el('summary','このケースを横断して読む'),el('p',caseSynthesis.synthesis),el('h3','別の読み方と限界'),el('p',caseSynthesis.alternative_reading));host.append(whole);
    const flow=el('section',undefined,{class:'block'});flow.append(el('h2','質問別の文脈要約'));const contexts=el('div',undefined,{class:'context-grid'});contexts.append(contextReading(interviewContext),contextReading(questionnaireContext));flow.append(contexts,el('h3','この記録から読み取れること'));const readings=el('div',undefined,{class:'context-grid'});readings.append(contentReading(interviewContext,'reading','読み取れること'),contentReading(questionnaireContext,'reading','読み取れること'));flow.append(readings);
    const socialRows=[interviewContext,questionnaireContext].filter(row=>row.social_connection);if(socialRows.length){flow.append(el('h3','社会との接点'));const socialGrid=el('div',undefined,{class:'context-grid'});socialRows.forEach(row=>socialGrid.append(contentReading({ ...row, reading: row.social_connection },'reading','社会との接点')));flow.append(socialGrid);}
    flow.append(el('h3','根拠となる引用・要約'),records(q,false,'both',c.case_id),el('h3','分析軸とその理由'));const axes=el('div',undefined,{class:'axis-grid'});axes.append(interpretiveAxes(c.case_id,q.question_id,'interview'),interpretiveAxes(c.case_id,q.question_id,'questionnaire'));flow.append(axes,el('h3','別の読み方・不足情報'));const alternatives=el('div',undefined,{class:'context-grid'});alternatives.append(contentReading({ ...interviewContext, reading: interviewContext.alternative_reading },'reading','別の読み方・不足情報'),contentReading({ ...questionnaireContext, reading: questionnaireContext.alternative_reading },'reading','別の読み方・不足情報'));flow.append(alternatives,el('h3','補助図表'),donut(countTags([q]),'この質問で確認済みのテーマタグ','質問 '+q.question_id),sectionNotice());host.append(flow);return host; }
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
          const va = axisValues(a, src, state.a), vb = axisValues(b, src, state.b);
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
      if (state.axis === 'form' || state.axis === 'interpretive') {
        cards.append(
          summaryCard(`${state.a}の記録に現れたこと`, axisSummary(qa, src, state.a)),
          summaryCard(`${state.b}の記録に現れたこと`, axisSummary(qb, src, state.b)),
          summaryCard('比較の留保', `${contextFor(state.a, qid, src).alternative_reading} ${contextFor(state.b, qid, src).alternative_reading}`)
        );
      } else {
        const va = axisValues(qa, src, state.a), vb = axisValues(qb, src, state.b);
        const common = va.filter(v => vb.includes(v));
        const onlyA = va.filter(v => !vb.includes(v));
        const onlyB = vb.filter(v => !va.includes(v));
        cards.append(
          summaryCard('共通して確認できること', common.length ? common.join('、') : '共通項なし', common),
          summaryCard(`${state.a}で確認できること`, onlyA.length ? onlyA.join('、') : '該当なし', onlyA),
          summaryCard(`${state.b}で確認できること`, onlyB.length ? onlyB.join('、') : '該当なし', onlyB)
        );
      }
      panel.append(cards);

      const contentSpecific = el('section', undefined, { class: 'interpretive-compare' });
      contentSpecific.append(el('h3', '記録に現れたことを並べて読む'));
      const contentCards = el('div', undefined, { class: 'compare-cards' });
      contentCards.append(
        summaryCard(`${state.a}の${SOURCE_LABEL[src]}記録`, contextFor(state.a, qid, src).reading),
        summaryCard(`${state.b}の${SOURCE_LABEL[src]}記録`, contextFor(state.b, qid, src).reading),
        summaryCard('異なりを読むときの留保', '二つの記録を同じ人物の回答として照合せず、それぞれの記録形式と質問範囲で読む。')
      );
      contentSpecific.append(contentCards);
      panel.append(contentSpecific);

      const charts = el('div', undefined, { class: 'compare-charts' });
      charts.append(
        donut(axisEntries(qa, src, state.a), `${state.a}：${axisName()}（${SOURCE_LABEL[src]}）`, state.a),
        donut(axisEntries(qb, src, state.b), `${state.b}：${axisName()}（${SOURCE_LABEL[src]}）`, state.b)
      );
      panel.append(charts);

      const interpretive = el('section', undefined, { class: 'interpretive-compare' });
      interpretive.append(el('h3', `分析軸と理由：${AXIS_LABELS[state.interpretiveAxis]}`));
      const axisCards = el('div', undefined, { class: 'compare-cards' });
      const rowA=axisRow(matrixFor(state.a, qid, src), state.interpretiveAxis),rowB=axisRow(matrixFor(state.b, qid, src), state.interpretiveAxis);
      axisCards.append(
        summaryCard(`${state.a}の${SOURCE_LABEL[src]}記録`, rowA ? `${rowA.value}。${rowA.reason}` : '該当なし'),
        summaryCard(`${state.b}の${SOURCE_LABEL[src]}記録`, rowB ? `${rowB.value}。${rowB.reason}` : '該当なし'),
        summaryCard('読み方の限界', 'この軸は記録範囲の読み取りを補助するものです。個人の特徴、優劣、診断を示すものではありません。')
      );
      interpretive.append(axisCards);
      panel.append(interpretive);

      const evidence = el('details', undefined, { class: 'evidence' });
      evidence.append(el('summary', `${SOURCE_LABEL[src]}の根拠となる記録を見る`));
      const columns = el('div', undefined, { class: 'record-grid' });
      columns.append(sourceCards(qa, src, state.a), sourceCards(qb, src, state.b));
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
      form.append(select('ケース A',state.a,CASES,v=>go({a:v})),select('ケース B',state.b,CASES,v=>go({b:v})),select('質問',state.q,[['all','すべての質問'],...QUESTIONS],v=>go({q:v})),select('比較軸',state.axis,[['topic','話題の向き'],['form','記録の表れ方'],['interpretive','解釈軸']],v=>go({axis:v})),select('表示する記録',state.source,[['both','面談とアンケート'],['interview','面談'],['questionnaire','アンケート']],v=>go({source:v})),select('解釈軸',state.interpretiveAxis,[['self_social','自己・関係・社会'],['inner_outer','内面・外部環境'],['temporal','時間の方向'],['agency','選択・制約・交渉'],['movement','継続・変化・移行'],['abstraction','具体・抽象'],['certainty','確信・迷い・両義性'],['relation_mode','個人・集団・制度']],v=>go({interpretiveAxis:v})));
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
    state.axis=valid(p.get('axis'),['topic','form','interpretive'],'topic');
    state.source=valid(p.get('source'),['both','interview','questionnaire'],'both');
    state.interpretiveAxis=valid(p.get('interpretive_axis'),['self_social','inner_outer','temporal','agency','movement','abstraction','certainty','relation_mode'],'self_social');
    render();});
  updateUrl();render();
})();

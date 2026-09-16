(() => {
  const data = window.TEAM_REVIEW_DATA;
  const state = { caseId: 'all', questionId: 'Q01', view: 'record', a: 'CASE_01', b: 'CASE_02', range: 'all', mode: 'topic' };
  const $ = selector => document.querySelector(selector);
  const el = (tag, text, attrs = {}) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
  };

  $('#notice').textContent = data.notice;

  function tab(label, active, onClick) {
    const button = el('button', label, { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(active) });
    button.addEventListener('click', onClick);
    return button;
  }
  function renderTabs() {
    const cases = $('#case-tabs'); cases.replaceChildren();
    cases.append(tab('全体を見る', state.caseId === 'all', () => { state.caseId = 'all'; state.view = 'record'; render(); }));
    data.cases.forEach(item => cases.append(tab(item.case_id, state.caseId === item.case_id, () => { state.caseId = item.case_id; state.view = 'record'; render(); })));
    const questions = $('#question-tabs'); questions.replaceChildren();
    ['Q01', 'Q02', 'Q03', 'Q04', 'Q05'].forEach(id => questions.append(tab(id, state.questionId === id, () => { state.questionId = id; render(); })));
    document.querySelectorAll('[data-view]').forEach(button => {
      button.setAttribute('aria-selected', String(button.dataset.view === state.view));
      button.onclick = () => { state.view = button.dataset.view; render(); };
    });
  }
  function tagList(tags) {
    const list = el('ul', undefined, { class: 'tag-list', 'aria-label': 'この問いから読み取る話題' });
    tags.forEach(tag => list.append(el('li', tag)));
    return list;
  }
  function reading(title, text, className = '') {
    const block = el('section', undefined, { class: `reading ${className}`.trim() });
    block.append(el('h3', title), el('p', text)); return block;
  }
  function card(record) {
    const name = record.record_type === 'interview' ? '面談の記録' : 'アンケートの記録';
    const kind = record.kind === 'masked_quote' ? 'マスク済み直引用' : '編集要約';
    const block = el('article', undefined, { class: 'record-card' });
    block.append(el('h3', name));
    const quote = el(record.kind === 'masked_quote' ? 'blockquote' : 'p', record.text);
    block.append(quote, el('p', kind, { class: 'record-meta' }));
    if (record.record_type === 'interview') block.append(el('p', '面談内の記録から作成した抜粋です。発話者と回答範囲は特定していません。', { class: 'record-notice' }));
    return block;
  }
  function diagram(tags) {
    const figure = el('figure', undefined, { class: 'diagram' });
    figure.append(el('p', '主題構成の補助図', { class: 'section-kicker' }));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 280 220'); svg.setAttribute('aria-hidden', 'true');
    [[95,105,66,'#346458','.86'],[164,92,56,'#ad5539','.78'],[151,151,48,'#c7a752','.72']].forEach(([cx,cy,r,fill,opacity]) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx',cx);circle.setAttribute('cy',cy);circle.setAttribute('r',r);circle.setAttribute('fill',fill);circle.setAttribute('opacity',opacity);svg.append(circle);
    });
    figure.append(svg, el('figcaption', '話題は固定された分類ではなく、この問いに現れた向きを補助的に示しています。'));
    const list = el('ul', undefined, { class: 'diagram-list' });
    tags.slice(0, 3).forEach((tag, index) => { const item = el('li'); item.append(el('span', '', { class: `dot-${'abc'[index]}` }), document.createTextNode(tag)); list.append(item); });
    figure.append(list); return figure;
  }
  function caseRecord(item) {
    const question = item.questions.find(q => q.question_id === state.questionId);
    const root = el('div', undefined, { class: 'content-grid' });
    const main = el('section');
    main.append(el('p', `${item.case_id} ／ ${question.question_id}`, { class: 'section-kicker' }), el('h2', '二つの記録を、別々に読む', { class: 'section-title' }), tagList(question.tags));
    const readings = el('div', undefined, { class: 'reading-grid' });
    readings.append(reading('両方の記録で確認できること', question.summary.both));
    readings.append(reading('面談記録で確認できること', question.summary.interview_only));
    readings.append(reading('アンケート回答で確認できること', question.summary.questionnaire_only));
    readings.append(reading('記録の表れ方の違い', question.summary.form_difference, 'form'));
    readings.append(reading('読み方の留保', question.summary.caveat, 'caveat'));
    main.append(readings, el('h3', '人間確認済みの記録', { class: 'section-title' }));
    const cards = el('div', undefined, { class: 'record-stack' });
    question.cards.filter(r => r.record_type === 'interview').forEach(r => cards.append(card(r)));
    question.cards.filter(r => r.record_type === 'questionnaire').forEach(r => cards.append(card(r)));
    main.append(cards); root.append(main, diagram(question.tags)); return root;
  }
  function allRecord() {
    const root = el('div', undefined, { class: 'all-view' });
    root.append(el('p', '全体を見る', { class: 'section-kicker' }), el('h2', '横断して見えること', { class: 'section-title' }));
    [['共通して確認できる話題',data.cross_case.common],['問いごとに見えること',data.cross_case.by_question],['記録の表れ方',data.cross_case.record_forms]].forEach(([title,text]) => { const section=el('section');section.append(el('h2',title),el('p',text));root.append(section); });
    const inquiry=el('section'); inquiry.append(el('h2','研究・場づくりへ接続する問い'));
    const list=el('ul',undefined,{class:'question-list'});data.cross_case.questions.forEach(text=>list.append(el('li',text)));inquiry.append(list);root.append(inquiry);return root;
  }
  function optionSelect(label, value, options, onChange) {
    const field = el('label', label); const select = el('select', undefined, { 'aria-label': label });
    options.forEach(([id, text, disabled]) => { const opt = el('option', text, { value: id }); opt.selected = id === value; opt.disabled = Boolean(disabled); select.append(opt); });
    select.addEventListener('change', event => onChange(event.target.value)); field.append(select); return field;
  }
  function comparisonCard(question, caseId) {
    const section = el('section'); section.append(el('h3', caseId));
    if (state.mode === 'topic') {
      section.append(tagList(question.tags));
      ['both','interview_only','questionnaire_only'].forEach(key => section.append(reading({both:'両方の記録で確認できること',interview_only:'面談記録で確認できること',questionnaire_only:'アンケート回答で確認できること'}[key], question.summary[key])));
    } else section.append(reading('記録の表れ方', question.summary.form_difference, 'form'));
    question.cards.filter(r=>r.record_type==='interview').forEach(r=>section.append(card(r)));
    question.cards.filter(r=>r.record_type==='questionnaire').forEach(r=>section.append(card(r)));
    return section;
  }
  function comparison() {
    const root = el('div'); const head = el('div',undefined,{class:'comparison-head'});
    head.append(el('p','ケース比較',{class:'section-kicker'}),el('h2','記録に現れる視点と表れ方を、並べて読む'),el('p','順位や優劣ではなく、話題の向きと記録の表れ方を探索するための比較です。'));
    const controls=el('div',undefined,{class:'comparison-controls'}); const cases=data.cases.map(c=>c.case_id);
    controls.append(optionSelect('ケース A',state.a,cases.map(x=>[x,x,x===state.b]),v=>{state.a=v;render();}));
    controls.append(optionSelect('ケース B',state.b,cases.map(x=>[x,x,x===state.a]),v=>{state.b=v;render();}));
    controls.append(optionSelect('問いの範囲',state.range,[['all','すべて'],...['Q01','Q02','Q03','Q04','Q05'].map(x=>[x,x])],v=>{state.range=v;render();}));
    controls.append(optionSelect('比較するもの',state.mode,[['topic','話題の向き'],['form','記録の表れ方']],v=>{state.mode=v;render();})); root.append(head,controls);
    const range = state.range==='all'?['Q01','Q02','Q03','Q04','Q05']:[state.range]; const a=data.cases.find(c=>c.case_id===state.a), b=data.cases.find(c=>c.case_id===state.b);
    range.forEach(questionId=>{const qa=a.questions.find(q=>q.question_id===questionId),qb=b.questions.find(q=>q.question_id===questionId);const summary=el('div',undefined,{class:'comparison-summary'});const common=qa.tags.filter(t=>qb.tags.includes(t));const onlyA=qa.tags.filter(t=>!qb.tags.includes(t));const onlyB=qb.tags.filter(t=>!qa.tags.includes(t));[['両方に見られる話題',common],['Aに見られる話題',onlyA],['Bに見られる話題',onlyB]].forEach(([title,tags])=>{const s=el('section');s.append(el('h3',`${questionId} ／ ${title}`),el('p',tags.length?tags.join('、'):'この問いでは、共通する話題としては示していません。'));summary.append(s)});const columns=el('div',undefined,{class:'compare-columns'});columns.append(comparisonCard(qa,state.a),comparisonCard(qb,state.b));root.append(summary,columns);});return root;}
  function render() { renderTabs(); const host=$('#view');host.replaceChildren(state.view==='comparison'?comparison():(state.caseId==='all'?allRecord():caseRecord(data.cases.find(c=>c.case_id===state.caseId)))); }
  render();
})();

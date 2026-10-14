(function () {
  'use strict';
  const data = window.PREP_DATA;
  data.site_url = new URL('./', location.href).href;
  const core = window.PrepCore;
  const main = document.getElementById('main');
  const album = { id: 'demo', name: '🐧 广告营销 · 面试准备', total: 5, url: 'https://www.xiaohongshu.com/board/demo' };
  const formatNames = { markdown: 'Markdown' };
  const state = { page: 0, furthest: 0, contentType: 'all', albumUrl: album.url, identified: false, linkError: '', formats: ['markdown'], formatOpen: false, selected: data.sources.map(s => s.id), scenario: 'normal', query: '', module: 'all', kind: 'all', completed: [], scopeOpen: false, limit: 8, demoOpen: true, actionFiles: {} };
  const names = ['提交专辑链接', '确认资料', '检查处理结果', '问题与来源', '下一步建议'];
  const e = text => String(text).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  const link = (sourceId, line) => `sources/${encodeURIComponent(sourceId)}.html#L${Number(line)}`;
  const selectedAttr = (value, target) => value === target ? ' selected' : '';
  const announce = text => { document.getElementById('announcement').textContent = text; };
  function sourceChoices() {
    return `<div class="source-list">${data.sources.map(source => `<label class="source-choice" for="source-${source.id}">
      <input id="source-${source.id}" type="checkbox" data-source="${source.id}"${state.selected.includes(source.id) ? ' checked' : ''}>
      <span><strong>[${source.id}] ${e(source.title)}</strong><span class="source-meta">${e(source.summary)}</span><span class="source-limit">${e(source.kind)} · 图文笔记</span></span></label>`).join('')}</div>`;
  }

  function heading(kicker, title, desc) {
    return `<div class="page-heading"><p class="kicker">${e(kicker)}</p><h1>${e(title)}</h1><p class="lead">${e(desc)}</p></div>`;
  }

  function albumMock() {
    return `<div class="album-mock"><aside class="mock-sidebar" aria-hidden="true"><span class="mock-logo">收藏页</span><span>⌂ 首页</span><span>◇ 发现</span><span>⊕ 发布</span><span>♧ 通知</span><span>◌ 消息</span><span class="mock-nav-active">● 我</span><span class="mock-more">☰ 更多</span></aside><div class="mock-content"><div class="mock-search" aria-hidden="true">搜索你感兴趣的内容 <span>⌕</span></div><div class="mock-back">‹ &nbsp; 我的收藏</div><div class="mock-title-row"><h2>🐧 广告营销 · 面试准备 <svg role="img" aria-label="私密专辑示意" width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor"><rect x="2" y="6" width="8" height="7" rx="2"/><path d="M4 6V4a2 2 0 0 1 4 0v2M6 9v2"/></svg></h2><span class="mock-edit">编辑专辑</span></div><p class="mock-description">广告营销管培 / 行业运营 · 题库与面经</p><div class="mock-author-row"><span><i class="mock-avatar">藏</i> 我的收藏</span><span>笔记 · ${data.sources.length} &nbsp;｜&nbsp; 专辑示意</span></div><div class="mock-grid">${data.sources.map(source=>`<a class="mock-card" href="${link(source.id,1)}" target="_blank" rel="noopener" aria-label="查看原创虚构笔记：${e(source.title)}"><div class="mock-note ${e(source.color)}"><span class="mock-quote" aria-hidden="true">“</span><strong>${source.cover.map(e).join('<br>')}</strong><small>笔记 ${source.id}</small></div><h3>${e(source.title)}</h3><div class="mock-card-meta"><span>${e(source.author)}</span><span>♡</span></div></a>`).join('')}</div></div></div>`;
  }

  function taskPage() {
    return `${heading('第 1 步', '从一个专辑开始', '把已收藏的面试资料整理成有出处的问题清单和行动建议。')}
      <div class="input-stage"><section class="panel upload-panel"><form id="album-form" novalidate><label for="album-url">小红书专辑链接</label>
      <div class="link-input-row"><input id="album-url" type="url" inputmode="url" autocomplete="off" spellcheck="false" value="${e(state.albumUrl)}" placeholder="https://www.xiaohongshu.com/board/…" aria-describedby="link-help${state.linkError ? ' link-error' : ''}"${state.linkError ? ' aria-invalid="true"' : ''}><button class="button primary" type="submit">识别专辑</button></div>
      <div class="link-help-row"><p id="link-help" class="hint">已填入演示链接，点击“识别专辑”开始。</p><button class="text-button" type="button" id="sample-link">填入示例链接</button></div>
      ${state.linkError ? `<p class="field-error" id="link-error" role="alert">${e(state.linkError)}</p>` : ''}</form>
      ${state.identified ? `<div class="identified-inline" aria-label="专辑识别结果"><div><strong>${e(album.name)}</strong><p>专辑记录 ${album.total} 篇 · 当前列出 ${data.sources.length} 篇</p></div><button class="button primary" data-nav="1">确认资料 →</button></div>` : '<div class="input-outcome"><span>输入</span> 指定专辑内的图文笔记<br><span>输出</span> 问题与出处 → 按优先级排列的行动卡</div>'}</section>
      ${!state.identified ? `<aside class="demo-bubble" aria-label="专辑输入示意"><details id="album-demo"${state.demoOpen?' open':''}><summary><span><span class="annotation-label">演示注释</span> 输入的专辑长什么样？</span><span class="collapse-toggle"><span class="toggle-open">展开专辑 ＋</span><span class="toggle-close">收起专辑 −</span></span></summary>${albumMock()}<p>专辑布局示意 · 点击卡片查看笔记。此区域帮助理解输入，不属于产品操作流程。</p></details></aside>` : ''}</div>`;
  }

  function scopePage(view) {
    return `${heading('第 2 步', '确认资料范围', '核对下方笔记，取消误存或与本次整理无关的内容。资料范围会同步影响问题与行动建议。')}
      <div class="scope-tools"><span class="scope-count">${e(album.name)} · 共 ${data.sources.length} 篇 · 已选 ${view.selected.length} 篇</span><div class="action-group"><button class="button small" data-select="all">全选</button><button class="button small" data-select="none">清空选择</button></div></div>
      ${sourceChoices()}${view.selected.length ? '' : '<p class="field-error" role="alert">至少选择一篇资料。</p>'}
      <div class="actions-bar"><button class="button ghost" data-nav="0">← 修改专辑链接</button><button class="button primary" data-nav="2"${view.selected.length ? '' : ' disabled'}>确认并查看处理结果 →</button></div>`;
  }

  function captureStatus(source, view) {
    if (view.failed.includes(source.id)) return {icon:'×',label:'抓取失败',style:'failed',detail:'未取得可用内容。',use:'不参与整理'};
    if (view.incomplete.includes(source.id)) return {icon:'○',label:'部分抓取',style:'incomplete',detail:'文案已保存；图片文字未完整识别。',use:'可用信息不足，不参与整理'};
    if (view.insufficient.includes(source.id)) return {icon:'○',label:'部分抓取',style:'incomplete',detail:'仅识别到笔记条目，正文与图片信息不足。',use:'不参与整理'};
    return {icon:'✓',label:'资料就绪',style:'complete',detail:`${source.status_summary}`,use:'参与整理'};
  }

  function statusPage(view) {
    const partialCount=view.incomplete.length+view.insufficient.length;
    return `${heading('第 3 步', '检查处理结果', '逐篇确认资料是否可用，避免遗漏内容进入整理。')}
      <div class="capture-overview"><span>已选 ${view.selected.length} 篇</span><span>✓ 完成 ${view.available.length}</span><span>○ 部分 ${partialCount}</span><span>× 失败 ${view.failed.length}</span></div>
      <section class="panel capture-panel"><ul class="capture-list">${view.selectedSources.map(source => { const status=captureStatus(source,view); return `<li data-capture="${source.id}"><div class="capture-source"><strong>[${source.id}] ${e(source.title)}</strong><span>${e(source.kind)}</span></div><div class="capture-detail ${status.style}"><div class="capture-state"><strong><span class="capture-symbol" aria-hidden="true">${status.icon}</span>${status.label}</strong><span>${e(status.detail)}</span></div><div class="capture-use"><span class="hint">${status.use}</span>${status.style==='complete' ? `<a href="${link(source.id,1)}" target="_blank" rel="noopener">查看内容 ↗</a>` : ''}</div></div></li>`; }).join('')}</ul></section>
      <div class="status-legend" aria-label="抓取状态说明"><span>✓ 完成：取得本次所需内容</span><span>○ 部分：部分内容未取得或无法识别</span><span>× 失败：没有可用内容</span></div>
      <div class="actions-bar"><button class="button ghost" data-nav="1">← 调整资料范围</button><button class="button primary" data-nav="3">${view.available.length ? '确认并查看整理结果' : '查看缺失说明'} →</button></div>`;
  }

  function evidence(ref, view) {
    const source = view.sourceMap[ref.source_id];
    return `<div class="evidence-block"><strong>[${source.id}] ${e(source.title)}</strong><p>${e(core.relationNames[ref.relation])} · ${e(source.kind)} · ${e(source.role)}</p>${ref.context ? `<p>${e(ref.context)}</p>` : ''}<blockquote>${e(ref.quote)}</blockquote><div class="evidence-links"><a href="${link(source.id,ref.start_line)}" target="_blank" rel="noopener">查看样例全文 · 第 ${ref.start_line} 段 ↗</a></div></div>`;
  }

  function questionCard(item, view) {
    const isQ = item.kind === 'explicit_question';
    return `<article class="question-card" id="${item.id}" data-item="${item.id}"><div class="question-top"><div><span class="question-id">${item.id} · ${e(item.module)} · ${isQ ? '明确问题' : '作者建议'}</span><h3>${e(item.title)}</h3></div><span class="coverage">${isQ ? `明确问题 ${item.explicitSources.length} 篇<br>仅相关主题 ${item.themeSources.length} 篇` : `建议来源 ${item.adviceSources.length} 篇`}</span></div><p class="prep-text"><strong>Agent 推断 · 准备方向：</strong>${e(item.preparation)}</p>
      <details class="evidence-details" data-evidence="${item.id}"><summary>展开出处与语境 · ${new Set(item.supports.map(s => s.source_id)).size} 篇资料</summary>${isQ ? `<p class="evidence-intent">可能考察点（Agent 推断）：${e(item.intent)}。<br>合并说明：${e(item.merge_note)}</p>` : '<p class="evidence-intent">这部分是笔记作者的准备建议。</p>'}${item.supports.map(ref => evidence(ref,view)).join('')}</details></article>`;
  }

  function resultsPage(view) {
    const types = core.contentTypes(data);
    const noResults = !view.questions.length && !view.advices.length;
    let emptyTitle = '当前筛选没有匹配内容。';
    let emptyDesc = '资料仍在当前范围内，试试清除内容类型或关键词筛选。';
    if (!view.selected.length) { emptyTitle = '先选择资料，再开始准备。'; emptyDesc = '当前没有选中资料，不能把空选择当成没有相关信息。展开上方资料范围重新选择。'; }
    else if (!view.available.length) { emptyTitle = '当前可用资料不足，暂不生成有据结果。'; emptyDesc = '这是已标注的测试状态。切回正常样例或调整资料范围后继续。'; }
    return `<div class="result-top"><div><p class="kicker">第 4 步</p><h1>问题与来源</h1><p class="hint">${e(album.name)} · 面试准备资料</p></div><div class="result-tools"><button class="button primary" data-nav="4">查看行动建议 →</button><button id="export" class="button"${view.canExport ? '' : ' disabled'}>导出</button></div></div>
      <div class="scope-inline"><details class="scope-edit" id="scope-edit"${state.scopeOpen ? ' open' : ''}><summary>资料范围 · 已选 ${view.selected.length} 篇 / 可用 ${view.available.length} 篇</summary><div class="scope-tools"><span></span><div class="action-group"><button class="button small" data-select="all">全选</button><button class="button small" data-select="none">清空选择</button></div></div>${sourceChoices()}</details></div>
      
      <section aria-label="结果筛选"><div class="filter-bar"><label for="query">查找问题或准备方向<input id="query" type="search" placeholder="例如：预算、协作、自我介绍" value="${e(state.query)}"></label><label for="contentType">内容类型<select id="contentType"><option value="all">全部内容</option>${types.map(type=>`<option value="${e(type)}"${selectedAttr(state.contentType,type)}>${e(type)}</option>`).join('')}</select></label><button class="button small" data-clear-filters>清除筛选</button></div><p class="filter-count" id="filter-count">当前显示 ${view.questions.length} 个明确问题、${view.advices.length} 项作者建议。</p></section>
      ${noResults ? `<section class="empty"><h3>${emptyTitle}</h3><p>${emptyDesc}</p>${view.available.length ? '<button class="button" data-clear-filters>清除筛选</button>' : '<button class="button" data-nav="1">返回确认资料</button>'}</section>` : `
      <section aria-label="问题和建议"><div class="question-list">${[...view.questions,...view.advices].slice(0,state.limit).map(item => questionCard(item,view)).join('')}</div>${view.questions.length+view.advices.length>state.limit ? `<button class="button load-more" id="load-more">再显示 8 条（已显示 ${Math.min(state.limit,view.questions.length+view.advices.length)} / ${view.questions.length+view.advices.length}）</button>`:''}</section>`}
      ${view.nuances.length ? `<section class="nuances" aria-label="差异与信息限制"><div class="section-heading"><h2>差异与信息缺口</h2><span>不强行拼成同一个答案</span></div>${view.nuances.map(n => `<details class="nuance" data-nuance="${n.id}"><summary>${e(n.title)}</summary>${n.statements.map(s => `<p>[${s.source_id}] ${e(s.text)}</p>${s.supports.map(ref => evidence(ref,view)).join('')}`).join('')}<p><strong>整理判断：</strong>${e(n.partialComparison ? '当前范围仅保留以上资料说法，不作跨来源比较。' : n.interpretation)}</p></details>`).join('')}</section>` : ''}
      <div class="actions-bar"><button class="button ghost" data-nav="2">← 返回处理结果</button><button class="button primary" data-nav="4">下一步建议 →</button></div>`;
  }

  function suggestionsView() {
    return core.derive(data,{...state,query:'',module:'all',kind:'all',contentType:'all'});
  }

  function suggestionsPage() {
    const view=suggestionsView();
    return `${heading('第 5 步','把资料变成下一步行动','按优先级准备，每张卡片都有明确产出、建议用时与依据。')}
      <p class="hint">基于当前 ${view.available.length} 篇可用资料；问题页的搜索和类型筛选不改变这里的建议。</p>
      <div class="next-actions">${view.actions.map((action,index)=>`<article class="prep-card" data-suggestion="${action.id}"><div class="prep-card-header"><span class="action-order">${String(index+1).padStart(2,'0')}</span><input id="action-${action.id}" type="checkbox" data-action="${action.id}" aria-label="标记完成：${e(action.title)}"${state.completed.includes(action.id)?' checked':''}><h3>${e(action.title)} <span class="time-tag">建议 ${action.minutes} 分钟</span></h3></div><p>${e(action.deliverable)}</p><p>准备顺序：${e(action.reason)}</p><div class="prep-links">${action.related_ids.map(id=>`<button class="prep-link" data-jump="${id}" aria-label="查看${id}的来源">${id} ↗</button>`).join('')}</div>${action.personal?`<div class="action-materials"><button class="button small" data-files="${action.id}">${state.actionFiles[action.id]?.length?'管理所选资料':'补充简历或经历'}</button><span>${state.actionFiles[action.id]?.length?`已选 ${state.actionFiles[action.id].length} 份资料`:'可选 · 结合自己的经历准备这一项'}</span></div>`:''}</article>`).join('')}</div>
      ${view.actions.length?'':'<section class="empty"><h3>当前没有可用的建议依据</h3><p>返回资料范围，检查是否未选资料或内容不足。</p></section>'}
      <div class="actions-bar"><button class="button ghost" data-nav="3">← 返回问题与来源</button></div>`;
  }

  function openFilesDialog(actionId) {
    const action=data.actions.find(a=>a.id===actionId);
    let files=[...(state.actionFiles[actionId]||[])];
    const dialog=document.createElement('dialog');dialog.className='export-dialog files-dialog';dialog.id='files-dialog';dialog.setAttribute('aria-labelledby','files-title');
    const draw=()=>{
      dialog.innerHTML=`<div class="dialog-heading"><h2 id="files-title">补充简历或经历</h2><button class="dialog-close" aria-label="关闭资料选择">×</button></div><p class="hint">用于准备：${e(action.title)}</p><label class="file-pick" for="action-files">选择本地资料<span>简历、项目经历或学习笔记 · PDF / Word / Markdown / TXT</span><input id="action-files" type="file" accept=".pdf,.docx,.md,.txt" multiple></label><ul class="personal-files">${files.map((file,i)=>`<li><span>${e(file.name)}</span><button class="text-button" data-remove-file="${i}" aria-label="移除${e(file.name)}">移除</button></li>`).join('')}</ul><p class="hint">核对所选文件，确认后回到行动卡。</p><div class="actions-bar"><button class="button" id="files-cancel">取消</button><button class="button primary" id="files-confirm">确认选择</button></div>`;
      dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
      dialog.querySelector('#files-cancel').onclick=()=>dialog.close();
      dialog.querySelector('#action-files').onchange=event=>{files.push(...Array.from(event.target.files).map(f=>({name:f.name})));draw();};
      dialog.querySelectorAll('[data-remove-file]').forEach(button=>button.onclick=()=>{files.splice(Number(button.dataset.removeFile),1);draw();});
      dialog.querySelector('#files-confirm').onclick=()=>{state.actionFiles[actionId]=files;dialog.close();};
    };
    document.body.appendChild(dialog);draw();dialog.addEventListener('close',()=>{dialog.remove();render();document.querySelector(`[data-files="${actionId}"]`)?.focus();});dialog.showModal();
  }

  function openExportDialog() {
    const view=core.derive(data,state);
    if(!view.canExport)return;
    const dialog=document.createElement('dialog');dialog.id='export-dialog';dialog.className='export-dialog';dialog.setAttribute('aria-labelledby','export-title');
    dialog.innerHTML=`<div class="dialog-heading"><h2 id="export-title">导出</h2><button class="dialog-close" aria-label="关闭导出设置">×</button></div><p class="hint">当前筛选：${view.questions.length} 个问题、${view.advices.length} 项作者建议；包含支持片段与出处。</p><fieldset class="export-formats"><legend>导出格式</legend>${Object.entries(formatNames).map(([value,name])=>`<label><input type="checkbox" data-export-format="${value}"${state.formats.includes(value)?' checked':''}><span>${name}</span>${value==='markdown'?'':'<small>设置预览</small>'}</label>`).join('')}</fieldset><label class="path-label" for="export-path">输出路径</label><input id="export-path" value="浏览器下载位置" readonly><p class="hint">保存位置由浏览器下载设置决定。</p><p class="dialog-format-note" id="export-format-note"></p><div class="actions-bar"><button class="button" id="export-cancel">取消</button><button class="button primary" id="export-confirm">导出</button></div>`;
    document.body.appendChild(dialog);
    const sync=()=>{const supported=state.formats.includes('markdown');dialog.querySelector('#export-confirm').disabled=!supported;dialog.querySelector('#export-format-note').textContent=state.formats.some(f=>f!=='markdown')?'当前仅生成 Markdown；PDF、Word、Excel 暂不生成文件。':supported?'':'请选择输出格式。';};
    dialog.querySelectorAll('[data-export-format]').forEach(input=>input.addEventListener('change',()=>{state.formats=input.checked?[...state.formats,input.dataset.exportFormat]:state.formats.filter(f=>f!==input.dataset.exportFormat);sync();}));
    const close=()=>dialog.close();dialog.querySelector('.dialog-close').addEventListener('click',close);dialog.querySelector('#export-cancel').addEventListener('click',close);
    dialog.addEventListener('close',()=>{dialog.remove();document.getElementById('export')?.focus();});
    dialog.querySelector('#export-confirm').addEventListener('click',()=>{
      const current=core.derive(data,{...state,exportMode:'sources'});if(!current.canExport||!state.formats.includes('markdown'))return;
      const markdown=core.exportMarkdown(data,current);const url=URL.createObjectURL(new Blob([markdown],{type:'text/markdown;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`放马过来_问题与来源_${current.selected.join('-')}.md`;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);close();announce('已导出当前筛选的问题与来源。');
    });sync();dialog.showModal();
  }

  function render(focusMain = false) {
    const active = document.activeElement;
    const focusId = active && active.id;
    const caret = active && active.tagName === 'INPUT' && ['text','search'].includes(active.type) ? active.selectionStart : null;
    const view = core.derive(data,state);
    document.getElementById('steps').innerHTML = names.map((name,i) => `<li class="${i === state.page ? 'current' : i < state.page ? 'past' : ''}"${i === state.page ? ' aria-current="step"' : ''}><button data-nav="${i}"${i>state.furthest?' disabled':''}><span class="step-number">${i < state.page ? '✓' : i + 1}</span>${name}</button></li>`).join('');
    main.innerHTML = [taskPage,scopePage,statusPage,resultsPage,suggestionsPage][state.page](view);
    bind(view);
    if (focusMain) { main.focus(); window.scrollTo(0,0); }
    else if (focusId) {
      const replacement = document.getElementById(focusId);
      if (replacement) { replacement.focus({preventScroll:true}); if (caret !== null) replacement.setSelectionRange(caret,caret); }
    }
  }

  function bind(view) {
    document.getElementById('load-more')?.addEventListener('click',()=>{state.limit+=8;render();});
    const albumInput=document.getElementById('album-url');
    if(albumInput)albumInput.addEventListener('input',()=>{
      state.albumUrl=albumInput.value;
      if(state.identified || state.linkError){state.identified=false;state.furthest=0;state.linkError='';render();}
    });
    const sampleButton=document.getElementById('sample-link');
    if(sampleButton)sampleButton.addEventListener('click',()=>{state.albumUrl=album.url;state.identified=false;state.furthest=0;state.linkError='';render();document.getElementById('album-url').focus();});
    const form=document.getElementById('album-form');
    if(form)form.addEventListener('submit',event=>{
      event.preventDefault();state.identified=false;state.linkError='';
      let url;
      try { url=new URL(state.albumUrl.trim()); } catch (_) { state.linkError='请输入完整的小红书专辑链接。'; }
      if(url && (!['https:','http:'].includes(url.protocol) || !['www.xiaohongshu.com','xiaohongshu.com'].includes(url.hostname) || !/^\/board\/[a-z0-9]+\/?$/i.test(url.pathname))) state.linkError='请使用小红书专辑页链接（/board/），不是单篇笔记或其他网页链接。';
      if(url && !state.linkError && url.pathname.replace(/\/$/,'')!==`/board/${album.id}`) state.linkError='此演示只载入预设的虚构样例。请点击“填入示例链接”继续，暂不支持实时处理其他专辑。';
      if(!state.linkError){state.identified=true;state.furthest=0;state.contentType='all';state.selected=data.sources.map(s=>s.id);state.scenario='normal';state.query='';state.module='all';state.kind='all';state.completed=[];state.scopeOpen=false;state.actionFiles={};}
      render();announce(state.linkError || `已载入示例专辑，共${data.sources.length}篇资料。`);
    });
    const picker=document.getElementById('format-picker');
    if(picker)picker.addEventListener('toggle',()=>{state.formatOpen=picker.open;});
    main.querySelectorAll('[data-format]').forEach(input=>input.addEventListener('change',()=>{
      state.formats=input.checked?[...state.formats,input.dataset.format]:state.formats.filter(f=>f!==input.dataset.format);state.formatOpen=true;render();
    }));
    document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click',() => {const next=Number(button.dataset.nav);if(next>0&&!state.identified)return;state.page=next;state.furthest=Math.max(state.furthest,next===3?4:next);state.formatOpen=false;render(true);}));
    main.querySelectorAll('[data-source]').forEach(input => input.addEventListener('change',() => {
      state.selected = input.checked ? [...state.selected,input.dataset.source] : state.selected.filter(id => id !== input.dataset.source);
      render(); const next=core.derive(data,state); announce(`已选${next.selected.length}篇，可用${next.available.length}篇，当前显示${next.questions.length}个明确问题和${next.advices.length}项建议。`);
    }));
    main.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click',() => {state.selected=button.dataset.select==='all'?data.sources.map(s=>s.id):[];render();announce(`已选${state.selected.length}篇资料。`);}));
    main.querySelectorAll('[data-clear-filters]').forEach(button => button.addEventListener('click',() => {state.query='';state.module='all';state.kind='all';state.contentType='all';render();announce('已清除筛选。');}));
    ['query','contentType','scenario'].forEach(id => {
      const control=document.getElementById(id);if(!control)return;
      const applyValue=() => {state[id]=control.value;state.limit=8;render();const next=core.derive(data,state);announce(`当前显示${next.questions.length}个明确问题和${next.advices.length}项建议。`);};
      if(id==='query') {
        let composing=false;
        control.addEventListener('compositionstart',()=>{composing=true;});
        control.addEventListener('input',event=>{if(!composing&&!event.isComposing)applyValue();});
        control.addEventListener('compositionend',()=>{composing=false;applyValue();});
      } else control.addEventListener('change',applyValue);
    });
    const scopeEdit=document.getElementById('scope-edit');if(scopeEdit)scopeEdit.addEventListener('toggle',() => {state.scopeOpen=scopeEdit.open;});
    main.querySelectorAll('[data-action]').forEach(input => input.addEventListener('change',() => {state.completed=input.checked?[...state.completed,input.dataset.action]:state.completed.filter(id=>id!==input.dataset.action);}));
    main.querySelectorAll('[data-jump]').forEach(button=>button.addEventListener('click',()=>{
      if(state.page===4){state.page=3;state.query='';state.contentType='all';state.limit=100;render(true);}
      const card=document.getElementById(button.dataset.jump);if(!card)return;card.querySelector('details').open=true;card.classList.add('highlight');card.scrollIntoView({block:'start',behavior:'instant'});card.querySelector('summary').focus({preventScroll:true});
    }));
    const exportButton=document.getElementById('export');
    if(exportButton)exportButton.addEventListener('click',openExportDialog);
    main.querySelectorAll('[data-files]').forEach(button=>button.addEventListener('click',()=>openFilesDialog(button.dataset.files)));
    const demo=document.getElementById('album-demo');if(demo)demo.addEventListener('toggle',()=>{state.demoOpen=demo.open;});
  }
  document.getElementById('demo-result').addEventListener('click',()=>{state.identified=true;state.selected=data.sources.map(s=>s.id);state.page=3;state.furthest=4;state.query='';state.contentType='all';state.limit=8;render(true);});
  document.getElementById('demo-reset').addEventListener('click',()=>{location.reload();});
  render();
})();

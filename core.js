/* Shared derivation and Markdown export. Runs in a browser or existing Node.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PrepCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const unique = values => [...new Set(values)];
  const relationNames = { explicit: '明确问题', theme: '相关主题（不计明确问题）', advice: '作者建议', comment: '样例评论' };

  // Current saved collection is interview material; other collection profiles
  // must supply their own categories instead of inheriting interview labels.
  const interviewTypes = ['公司与岗位', '面试原题', '案例与复盘', '行业与业务', '面试技巧'];
  function contentTypes(data) {
    return data.content_profile ? data.content_profile.categories : interviewTypes;
  }
  function itemTypes(item, data) {
    if (data.content_profile) return item.content_types || [];
    const types=[];
    if(item.kind==='explicit_question')types.push('面试原题');
    if(['公司与岗位','动机与规划'].includes(item.module))types.push('公司与岗位');
    if(['业务案例','群面业务题'].includes(item.module)||['Q03','Q04','Q13','Q23','Q26','Q36'].includes(item.id))types.push('案例与复盘');
    if(['广告基础','行业观察'].includes(item.module))types.push('行业与业务');
    if(item.kind==='author_advice')types.push('面试技巧');
    return types;
  }

  function derive(data, options = {}) {
    const validIds = new Set(data.sources.map(s => s.id));
    const selected = unique(options.selected === undefined ? [...validIds] : options.selected).filter(id => validIds.has(id));
    const scenario = options.scenario || 'normal';
    if (!['normal', 'partial', 'incomplete', 'insufficient'].includes(scenario)) throw new Error('未知演示场景');
    const failed = scenario === 'partial' && selected.includes('002') ? ['002'] : [];
    const insufficient = scenario === 'insufficient' ? [...selected] : [];
    const incomplete = scenario === 'incomplete' && selected.includes('003') ? ['003'] : [];
    const available = selected.filter(id => !failed.includes(id) && !insufficient.includes(id) && !incomplete.includes(id));
    const availableSet = new Set(available);
    const decorate = item => {
      const supports = item.supports.filter(s => availableSet.has(s.source_id));
      const explicitSources = unique(supports.filter(s => s.relation === 'explicit').map(s => s.source_id));
      const themeSources = unique(supports.filter(s => s.relation === 'theme').map(s => s.source_id)).filter(id => !explicitSources.includes(id));
      const adviceSources = unique(supports.filter(s => s.relation === 'advice').map(s => s.source_id));
      const scopeReduced = supports.length < item.supports.length;
      const merge_note = item.kind === 'explicit_question' && scopeReduced
        ? `当前依据明确问题来源 [${explicitSources.join('、')}]，同篇只计一次。规范化题目须结合下方所选来源的实际语境理解；不将被排除资料计入当前合并判断。`
        : item.merge_note;
      return { ...item, supports, explicitSources, themeSources, adviceSources, merge_note };
    };
    const allQuestions = data.questions.map(decorate).filter(q => q.explicitSources.length > 0);
    const allAdvices = data.advices.map(decorate).filter(q => q.adviceSources.length > 0);
    const query = (options.query || '').trim().toLocaleLowerCase();
    const moduleName = options.module || 'all';
    const kind = options.kind || 'all';
    const contentType=options.contentType || 'all';
    const matches = item => (contentType==='all'||itemTypes(item,data).includes(contentType))
      && (moduleName === 'all' || item.module === moduleName)
      && (!query || `${item.title} ${item.preparation}`.toLocaleLowerCase().includes(query));
    const questions = kind === 'advice' ? [] : allQuestions.filter(matches);
    const advices = kind === 'question' ? [] : allAdvices.filter(matches);
    const visibleIds = new Set([...questions, ...advices].map(q => q.id));
    const actions = data.actions.map(a => ({ ...a, related_ids: a.related_ids.filter(id => visibleIds.has(id)) })).filter(a => a.related_ids.length);
    const nuances = data.nuances.map(n => ({ ...n, statements: n.statements.filter(s => availableSet.has(s.source_id)) }))
      .filter(n => n.statements.length && (!n.related_ids.length || n.related_ids.some(id => visibleIds.has(id))))
      .map(n => ({ ...n, partialComparison: n.statements.length < data.nuances.find(original => original.id === n.id).statements.length }));
    return { selected, failed, incomplete, insufficient, available, scenario, questions, advices, allQuestions, allAdvices, actions, nuances,
      filters: { query, module: moduleName, kind, contentType }, exportMode: options.exportMode || 'all', sourceMap: Object.fromEntries(data.sources.map(s => [s.id, s])),
      selectedSources: data.sources.filter(s => selected.includes(s.id)), completed: unique(options.completed || []), canExport: questions.length + advices.length > 0 };
  }

  function escapeMd(text) {
    return String(text).replace(/[\\`*_[\]<>]/g, '\\$&');
  }

  function exportMarkdown(data, state) {
    if (!state.canExport) throw new Error('当前范围和筛选下没有可导出的有据结果');
    const lines = [state.exportMode==='sources'?'# 放马过来 · 问题与来源':'# 放马过来 · 面试准备清单', '', `> ${data.sample_label}`, '',
      '此清单来自五篇原创虚构笔记，不对应真实帖子、面试或用户记录。结果随所选资料与筛选条件变化；未进行实时抓取或模型生成。', '',
      `资料范围：已选 ${state.selected.length} 篇，可用 ${state.available.length} 篇；当前显示 ${state.questions.length} 个明确问题、${state.advices.length} 项作者建议。`,
      `筛选：模块=${state.filters.module === 'all' ? '全部' : escapeMd(state.filters.module)}；类型=${({all:'全部', question:'明确问题', advice:'作者建议'})[state.filters.kind] || escapeMd(state.filters.kind)}；关键词=${state.filters.query ? escapeMd(state.filters.query) : '无'}。`, '',
      ''];
    if (state.scenario !== 'normal') {
      lines.push('## 测试场景说明', '', state.scenario === 'partial'
        ? `测试：002 被模拟为处理失败；本次选中范围内失败 ${state.failed.length} 篇。这是人为设置的演示状态。`
        : state.scenario === 'incomplete' ? `测试：003 被模拟为部分抓取；图片文字未完整识别。本次所选范围中有 ${state.incomplete.length} 篇因此不参与整理；这是人为设置的演示状态。`
        : '测试：所选资料被模拟为信息不足；这是人为设置的演示状态。', '');
    }
    if(state.filters.contentType!=='all')lines.push(`内容类型：${escapeMd(state.filters.contentType)}。`, '');
    if(state.exportMode!=='sources'){
    lines.push('## 先做这些准备', '', '以下为设计建议。用本人真实经历作答；没有成果或数字时如实说明。预计练习时间不是实测耗时。', '');
    if (!state.actions.length) lines.push('当前筛选没有对应的优先行动，可直接练习下方可见题目。', '');
    state.actions.forEach(a => lines.push(`- [${state.completed.includes(a.id) ? 'x' : ' '}] **${escapeMd(a.title)}**（建议 ${a.minutes} 分钟）：${escapeMd(a.deliverable)} 对应 ${a.related_ids.join('、')}。理由：${escapeMd(a.reason)}`));
    }
    lines.push('', '## 问题与来源', '');
    const appendSupport = ref => {
      const source = state.sourceMap[ref.source_id];
      lines.push(`- [${source.id}] ${relationNames[ref.relation]} · ${escapeMd(source.title)} · ${escapeMd(source.kind)} · ${escapeMd(source.role)}`,
        `  - 支持位置：原创虚构笔记第 ${ref.start_line} 段。${ref.context ? escapeMd(ref.context) : ''}`,
        `  - [样例全文](${data.site_url}${source.path}#L${ref.start_line})`);
      if (ref.image) lines.push(`  - 对照图片（包内路径）：\`${ref.image}\``);
      lines.push('');
      ref.quote.split('\n').forEach(line => lines.push(`> ${escapeMd(line)}`));
      lines.push('');
    };
    const appendItem = item => {
      lines.push(`### ${item.id} · ${escapeMd(item.title)}`, '', `模块：${item.module}。`);
      if (item.kind === 'explicit_question') {
        lines.push(`明确问题：${item.explicitSources.length} 篇 [${item.explicitSources.join('、')}]；仅相关主题：${item.themeSources.length} 篇${item.themeSources.length ? ' [' + item.themeSources.join('、') + ']' : ''}。`,
          `可能考察点（Agent 推断）：${escapeMd(item.intent)}。`, `合并说明：${escapeMd(item.merge_note)}`);
      } else lines.push(`作者建议：${item.adviceSources.length} 篇 [${item.adviceSources.join('、')}]，不当作明确练习题。`);
      lines.push(`准备方向（Agent 推断）：${escapeMd(item.preparation)}`, '');
      item.supports.forEach(appendSupport);
    };
    state.questions.forEach(appendItem);
    if (state.advices.length) lines.push('## 作者建议与练习方向', '');
    state.advices.forEach(appendItem);
    if (state.nuances.length) lines.push('## 差异与信息限制', '');
    state.nuances.forEach(n => {
      lines.push(`### ${escapeMd(n.title)}`, '');
      n.statements.forEach(s => { lines.push(`[${s.source_id}] ${escapeMd(s.text)}`, ''); s.supports.forEach(appendSupport); });
      lines.push(n.partialComparison ? '当前范围仅保留以上资料说法，不作跨来源比较。' : `整理判断：${escapeMd(n.interpretation)}`, '');
    });
    lines.push('## 本次资料范围', '');
    state.selectedSources.forEach(s => lines.push(`- [${s.id}] ${escapeMd(s.title)} · ${state.failed.includes(s.id) ? '模拟失败（测试）' : state.incomplete.includes(s.id) ? '模拟部分抓取（测试，不参与整理）' : state.insufficient.includes(s.id) ? '模拟信息不足（测试）' : '可用'} · ${escapeMd(s.kind)} · ${escapeMd(s.role)}。${escapeMd(s.limit)}`));
    lines.push('', '## 使用边界', '');
    data.global_limits.forEach(limit => lines.push(`- ${escapeMd(limit)}`));
    lines.push('', `生成方式：${data.generation_method}`, '', '样例全文随演示站点提供，无真实原帖或外部账号信息。', '');
    return lines.join('\n');
  }
  return { derive, exportMarkdown, relationNames, contentTypes, itemTypes };
});

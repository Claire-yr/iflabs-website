// I.F. Labs - Main JavaScript

(function () {
  'use strict';

  // Mobile menu toggle
  const menuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  // Filter chips on archive pages
  const filterChips = document.querySelectorAll('[data-filter]');
  if (filterChips.length > 0) {
    filterChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        const filter = chip.dataset.filter;
        const value = chip.dataset.value;
        const group = chip.dataset.group;

        // Toggle active state within group
        if (group) {
          document.querySelectorAll('[data-group="' + group + '"]').forEach(function (c) {
            c.classList.remove('active');
          });
          chip.classList.add('active');
        } else {
          chip.classList.toggle('active');
        }

        applyFilters();
      });
    });

    function applyFilters() {
      const items = document.querySelectorAll('[data-filterable]');
      const activeFilters = {};

      document.querySelectorAll('.filter-chip.active').forEach(function (chip) {
        const filter = chip.dataset.filter;
        const value = chip.dataset.value;
        if (value === 'all') return; // "全部" means no filter for this group
        if (!activeFilters[filter]) activeFilters[filter] = [];
        activeFilters[filter].push(value);
      });

      items.forEach(function (item) {
        let visible = true;
        for (const key in activeFilters) {
          const values = activeFilters[key];
          const itemValue = item.dataset[key];
          if (itemValue && values.length > 0) {
            const itemValues = itemValue.split(',');
            const match = values.some(function (v) {
              return itemValues.indexOf(v) !== -1;
            });
            if (!match) visible = false;
          } else {
            // Item lacks this data attribute but filter is active
            visible = false;
          }
        }
        item.style.display = visible ? '' : 'none';
      });

      updateEmptyState();
    }

    function updateEmptyState() {
      const emptyState = document.getElementById('filter-empty-state');
      if (!emptyState) return;
      const visibleItems = document.querySelectorAll('[data-filterable]:not([style*="display: none"])');
      emptyState.style.display = visibleItems.length === 0 ? 'block' : 'none';
    }
  }

  // Search page functionality
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (searchInput && searchResults) {
    let searchIndex = [];

    fetch('/data/search-index.json')
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        searchIndex = data;
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        if (query) {
          searchInput.value = query;
          performSearch(query);
        }
      })
      .catch(function (err) {
        console.error('Failed to load search index:', err);
      });

    let debounceTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        performSearch(searchInput.value.trim());
      }, 200);
    });

    function performSearch(query) {
      if (!query) {
        searchResults.innerHTML = '<p class="text-small text-secondary">输入关键词开始搜索</p>';
        return;
      }

      const q = query.toLowerCase();
      const results = searchIndex.filter(function (item) {
        return (
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.summary && item.summary.toLowerCase().includes(q)) ||
          (item.tags && item.tags.some(function (tag) {
            return tag.toLowerCase().includes(q);
          })) ||
          (item.scenarios && item.scenarios.some(function (s) {
            return s.toLowerCase().includes(q);
          }))
        );
      });

      renderResults(results, query);
    }

    function renderResults(results, query) {
      if (results.length === 0) {
        searchResults.innerHTML = '<p class="text-small">未找到与 "' + escapeHtml(query) + '" 相关的内容。</p>';
        return;
      }

      const html = results.map(function (item) {
        return '<article class="search-result">' +
          '<a href="' + item.url + '" class="search-result-title">' + escapeHtml(item.title) + '</a>' +
          '<p class="search-result-desc">' + escapeHtml(item.summary || '') + '</p>' +
          '<div class="metadata-row mt-1">' +
          '<span>' + item.type + '</span>' +
          '<span>' + (item.date || '') + '</span>' +
          '</div>' +
          '</article>';
      }).join('');

      searchResults.innerHTML = '<p class="text-small mb-2">找到 ' + results.length + ' 个结果</p>' + html;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Newsletter form
  const newsletterForms = document.querySelectorAll('.newsletter-form');
  newsletterForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const button = form.querySelector('button');
      if (input && input.value) {
        button.textContent = '已订阅';
        button.disabled = true;
        input.value = '';
        input.placeholder = '感谢订阅 I.F. Labs 每周雷达';
      }
    });
  });

  // Load assistant scenarios if modal present
  if (document.getElementById('assistant-modal')) {
    fetch('/data/assistant-scenarios.json')
      .then(function (response) { return response.json(); })
      .then(function (data) { window.assistantScenarios = data; })
      .catch(function (err) { console.error('Failed to load assistant scenarios:', err); });
  }

  // Assistant modal
  const assistantModal = document.getElementById('assistant-modal');
  const openAssistantButtons = [
    document.getElementById('open-assistant'),
    document.getElementById('open-assistant-panel'),
    document.getElementById('open-assistant-tab'),
    document.getElementById('open-assistant-detail')
  ].filter(Boolean);
  const closeAssistantButton = document.getElementById('assistant-modal-close');
  const assistantGenerate = document.getElementById('assistant-generate');
  const assistantOutputPanel = document.getElementById('assistant-output-panel');

  function openAssistantModal() {
    if (!assistantModal) return;
    assistantModal.classList.add('open');
    assistantModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeAssistantModal() {
    if (!assistantModal) return;
    assistantModal.classList.remove('open');
    assistantModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openAssistantButtons.forEach(function (btn) {
    btn.addEventListener('click', openAssistantModal);
  });

  if (closeAssistantButton) {
    closeAssistantButton.addEventListener('click', closeAssistantModal);
  }

  if (assistantModal) {
    assistantModal.addEventListener('click', function (e) {
      if (e.target === assistantModal) closeAssistantModal();
    });
  }

  if (assistantGenerate && assistantOutputPanel) {
    assistantGenerate.addEventListener('click', function () {
      const problem = (document.getElementById('assistant-problem') || {}).value || '';
      const scenario = (document.getElementById('assistant-scenario') || {}).value || '';
      const budget = (document.getElementById('assistant-budget') || {}).value || 'free';
      const output = (document.getElementById('assistant-output') || {}).value || '';

      if (!problem.trim()) {
        assistantOutputPanel.innerHTML = '<div class="modal-output-title">推荐方案</div><p class="text-small" style="color: var(--color-text-secondary);">请先描述你要解决的问题。</p>';
        return;
      }

      // Try to match a scenario by keyword
      const q = (problem + ' ' + scenario + ' ' + output).toLowerCase();
      let matched = null;
      if (typeof window.assistantScenarios !== 'undefined') {
        matched = window.assistantScenarios.find(function (s) {
          return s.keywords.some(function (k) {
            return q.indexOf(k) !== -1;
          });
        });
      }

      if (matched) {
        const budgetNote = budget === 'free' ? '优先使用免费版本' : '根据预算选择合适版本';
        const fallback = budget === 'free' ? matched.fallback : '在预算范围内选择付费版本以获得更好体验';
        assistantOutputPanel.innerHTML =
          '<div class="modal-output-title">推荐方案</div>' +
          '<div class="recommendation-block mb-3">' + escapeHtml(matched.recommendation) + '</div>' +
          '<h3 class="text-h3 mb-2">工具组合</h3>' +
          '<p class="text-small mb-3">' + escapeHtml(matched.tools.join(' + ')) + '</p>' +
          '<h3 class="text-h3 mb-2">提示词</h3>' +
          '<div class="prompt-block"><button type="button" class="prompt-copy" onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent.trim())">复制</button><pre>' + escapeHtml(matched.prompt) + '</pre></div>' +
          '<h3 class="text-h3 mb-2">执行步骤</h3>' +
          '<ol class="text-small">' + matched.workflow.map(function (step) { return '<li>' + escapeHtml(step) + '</li>'; }).join('') + '</ol>' +
          '<h3 class="text-h3 mb-2">成本测算</h3>' +
          '<p class="text-small mb-3">' + escapeHtml(matched.costEstimate) + '。' + budgetNote + '</p>' +
          '<h3 class="text-h3 mb-2">风险提示</h3>' +
          '<p class="text-small mb-3">' + escapeHtml(matched.risks) + '</p>' +
          '<h3 class="text-h3 mb-2">替代方案</h3>' +
          '<p class="text-small">' + escapeHtml(fallback) + '</p>';
      } else {
        assistantOutputPanel.innerHTML =
          '<div class="modal-output-title">推荐方案</div>' +
          '<p class="text-small" style="color: var(--color-text-secondary);">我们暂时没有完全匹配你需求的预制方案。建议：</p>' +
          '<ul class="text-small">' +
          '<li>前往 <a href="/packages" class="link">AI 速用包</a> 浏览官方方案</li>' +
          '<li>前往 <a href="/market" class="link">方案集市</a> 查看社区经验</li>' +
          '<li>简化问题描述，使用更常见的关键词如“会议”“周报”“竞品”“文献”</li>' +
          '</ul>';
      }
    });
  }

  // Like / favorite buttons (local state only)
  document.querySelectorAll('.js-like, .js-favorite').forEach(function (btn) {
    const isLike = btn.classList.contains('js-like');
    const key = (isLike ? 'liked-' : 'favorited-') + btn.dataset.id;
    const span = btn.querySelector('span');
    let baseCount = parseInt(span.textContent.replace(/\D/g, ''), 10) || 0;

    function updateState() {
      const set = localStorage.getItem(key) === '1';
      const count = baseCount + (set ? 1 : 0);
      span.textContent = isLike ? '❤ 点赞 (' + count + ')' : '☆ 收藏 (' + count + ')';
      btn.classList.toggle('is-active', set);
    }

    updateState();

    btn.addEventListener('click', function () {
      const currentlySet = localStorage.getItem(key) === '1';
      if (currentlySet) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, '1');
      }
      updateState();
    });
  });

  // Market submit form
  const marketSubmitForm = document.getElementById('market-submit-form');
  if (marketSubmitForm) {
    marketSubmitForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const button = marketSubmitForm.querySelector('button[type="submit"]');
      button.textContent = '已提交，等待审核';
      button.disabled = true;
      marketSubmitForm.reset();
    });
  }

  // Make package and market cards clickable as a whole
  function makeCardClickable(cardSelector, linkSelector) {
    document.querySelectorAll(cardSelector).forEach(function (card) {
      const link = card.querySelector(linkSelector);
      if (!link) return;
      card.addEventListener('click', function (e) {
        // Let internal links and buttons handle themselves
        if (e.target.closest('a, button')) return;
        window.location.href = link.href;
      });
      card.style.cursor = 'pointer';
    });
  }

  makeCardClickable('.package-card', '.package-card-title a');
  makeCardClickable('.market-card', '.market-card-title a');

  // Hero carousel auto-rotation (smooth slide/fade)
  (function initHeroCarousel() {
    const stage = document.getElementById('hero-3d-stage');
    const carousel = document.getElementById('hero-3d-carousel');
    if (!stage || !carousel) return;

    const cards = Array.from(stage.children).filter(function (el) {
      return el.classList.contains('hero-3d-card');
    });
    const count = cards.length;
    if (count <= 1) return;

    let current = 0;
    let interval;
    const delay = 5000;

    function updateCards() {
      cards.forEach(function (card, i) {
        card.classList.remove('active', 'prev');
        if (i === current) {
          card.classList.add('active');
        } else if (i === (current - 1 + count) % count) {
          card.classList.add('prev');
        }
      });
      document.querySelectorAll('.hero-3d-dot').forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function rotateTo(index) {
      current = index;
      updateCards();
    }

    function next() {
      rotateTo((current + 1) % count);
    }

    function start() {
      interval = setInterval(next, delay);
    }

    function stop() {
      clearInterval(interval);
    }

    updateCards();
    start();

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);

    document.querySelectorAll('.hero-3d-dot').forEach(function (dot) {
      dot.addEventListener('click', function () {
        rotateTo(parseInt(dot.dataset.heroDot, 10));
        stop();
        start();
      });
    });

    // Touch swipe support
    let touchStartX = 0;
    carousel.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
      stop();
    }, { passive: true });

    carousel.addEventListener('touchend', function (e) {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 40) {
        next();
      } else if (touchEndX > touchStartX + 40) {
        rotateTo((current - 1 + count) % count);
      }
      start();
    }, { passive: true });
  })();

  // 3D wall hover lift on non-touch devices
  (function initWall3DHover() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.wall-3d-card').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        card.style.zIndex = '10';
      });
      card.addEventListener('mouseleave', function () {
        setTimeout(function () {
          card.style.zIndex = '';
        }, 450);
      });
    });
  })();

  // ===== I.F. Labs · 艾弗 Ifer 浮动对话 =====
  (function initIferChat() {
    const bubble = document.getElementById('ifer-chat-bubble');
    const panel = document.getElementById('ifer-chat-panel');
    const messagesEl = document.getElementById('ifer-chat-messages');
    const quickEl = document.getElementById('ifer-chat-quick');
    const form = document.getElementById('ifer-chat-form');
    const input = document.getElementById('ifer-chat-input');
    if (!bubble || !panel || !messagesEl || !form || !input) return;

    const state = { open: false, greeted: false, busy: false };

    const QUICK = [
      '推荐一个写作 AI',
      'AI 速用包是什么？',
      '给我一个 Prompt 模板',
      '如何选 AI 工具？'
    ];

    const TOOLS = [
      { name: 'ChatGPT', cat: '通用对话', score: 8.6, tag: '推荐', note: '通用问答与起草首选，生态最全' },
      { name: 'Claude', cat: '长文 / 推理', score: 9.0, tag: '强推', note: '长文档理解与结构化输出能力强' },
      { name: 'Cursor', cat: 'AI IDE', score: 8.8, tag: '推荐', note: 'AI 编程编辑器首选，工程效率显著' },
      { name: 'Perplexity', cat: '联网搜索', score: 8.4, tag: '推荐', note: '需要实时信息 / 资料检索时用' },
      { name: 'Midjourney', cat: '图像生成', score: 8.7, tag: '推荐', note: '视觉质量与风格控制最强' },
      { name: 'Notion AI', cat: '文档协作', score: 7.8, tag: '视条件', note: '已在 Notion 体系内可启用，否则不必' },
      { name: 'v0', cat: 'UI 生成', score: 8.2, tag: '推荐', note: '快速产出前端代码 / 设计稿' },
      { name: 'Gamma', cat: 'PPT 生成', score: 7.9, tag: '视条件', note: '快速搭建演示稿骨架，细节需手工' }
    ];

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderMarkdownLite(text) {
      // Convert simple markdown to HTML: **bold**, `code`, newlines
      let html = escapeHtml(text);
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
      html = html.replace(/\n/g, '<br>');
      return html;
    }

    function appendMessage(role, content, opts) {
      opts = opts || {};
      const wrap = document.createElement('div');
      wrap.className = 'ifer-chat-msg ifer-chat-msg-' + role;

      if (role === 'bot') {
        const av = document.createElement('img');
        av.className = 'ifer-chat-msg-avatar';
        av.src = '/assets/ifer/ifer-avatar-minimal.png';
        av.alt = '艾弗';
        wrap.appendChild(av);
      }

      const bubble = document.createElement('div');
      bubble.className = 'ifer-chat-msg-bubble';

      if (opts.html) {
        bubble.innerHTML = content;
      } else {
        bubble.innerHTML = renderMarkdownLite(content);
      }
      wrap.appendChild(bubble);

      if (role === 'user') {
        const av = document.createElement('img');
        av.className = 'ifer-chat-msg-avatar';
        av.src = '/assets/logo.jpg';
        av.alt = '我';
        wrap.appendChild(av);
      }

      messagesEl.appendChild(wrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return wrap;
    }

    function showTyping() {
      const wrap = document.createElement('div');
      wrap.className = 'ifer-chat-msg ifer-chat-msg-bot ifer-chat-typing-wrap';
      const av = document.createElement('img');
      av.className = 'ifer-chat-msg-avatar';
      av.src = '/assets/ifer/ifer-avatar-minimal.png';
      av.alt = '';
      wrap.appendChild(av);
      const b = document.createElement('div');
      b.className = 'ifer-chat-msg-bubble';
      b.innerHTML = '<span class="ifer-chat-typing"><span></span><span></span><span></span></span>';
      wrap.appendChild(b);
      messagesEl.appendChild(wrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return wrap;
    }

    function renderToolTable(matches) {
      const rows = matches.map(function (t) {
        return '<tr><td><strong>' + escapeHtml(t.name) + '</strong></td><td>' + escapeHtml(t.cat) + '</td><td>' + t.score.toFixed(1) + '</td><td>' + escapeHtml(t.tag) + '</td><td>' + escapeHtml(t.note) + '</td></tr>';
      }).join('');
      const html = '推荐结论：以下工具按场景匹配，按站内评分排序。<br><br>' +
        '<table class="ifer-chat-msg-table"><thead><tr><th>工具</th><th>类别</th><th>评分</th><th>结论</th><th>适用场景</th></tr></thead><tbody>' +
        rows + '</tbody></table><br>—— 艾弗 Ifer';
      return html;
    }

    function classifyIntent(text) {
      const t = text.toLowerCase();
      if (/prompt|提示词/.test(t)) return 'prompt';
      if (/速用包|方案集市|套餐|订阅/.test(t)) return 'package';
      if (/评测|测评|打分|评分|对比|比较/.test(t)) return 'review';
      if (/怎么选|如何选|选什么|推荐|哪个|建议|用哪款/.test(t)) return 'recommend';
      if (/写作|文案|起草|文章|周报/.test(t)) return { cat: '写作' };
      if (/编程|写代码|cursor|代码|开发/.test(t)) return { cat: 'AI IDE' };
      if (/ppt|演示|幻灯片|汇报/.test(t)) return { cat: 'PPT 生成' };
      if (/搜索|查资料|联网|资料/.test(t)) return { cat: '联网搜索' };
      if (/画图|配图|海报|插画|设计/.test(t)) return { cat: '图像生成' };
      if (/长文|长文档|合同|论文|报告/.test(t)) return { cat: '长文 / 推理' };
      if (/文档|笔记|知识库/.test(t)) return { cat: '文档协作' };
      if (/ui|前端|网页|界面/.test(t)) return { cat: 'UI 生成' };
      return null;
    }

    function buildResponse(userText) {
      const intent = classifyIntent(userText);

      if (intent === 'prompt') {
        return '**结论前置**：给你一个可直接复用的万能 Prompt 模板，覆盖角色 / 上下文 / 任务 / 约束 / 输出格式五段。<br><br>' +
          '```\n你是 [角色]，擅长 [领域]。\n背景：[上下文与目标]\n任务：[请你做什么]\n约束：[限制条件，如字数、风格、禁用词]\n输出格式：[表格 / 编号 / Markdown / JSON]\n```<br><br>' +
          '把方括号里的内容换成你的具体场景即可。需我帮你把当前需求套进这个模板吗？<br>—— 艾弗 Ifer';
      }

      if (intent === 'package') {
        return '**结论前置**：AI 速用包是 I.F. Labs 把"工具组合 + 工作流 + 检查清单"做成可直接落地的成品包，比单条评测更省事。<br><br>' +
          '<strong>两类包</strong>：<br>' +
          '• <strong>官方速用包</strong>：评测验证过的工具组合，含执行步骤与风险提示<br>' +
          '• <strong>社区方案</strong>：用户自提交的真实案例，按场景分类<br><br>' +
          '入口：顶部导航「AI 速用包」或「方案集市」。<br>—— 艾弗 Ifer';
      }

      if (intent === 'review') {
        const top = TOOLS.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 4);
        return '**结论前置**：I.F. Labs 站内评分 ≥ 8.5 的 的 4 款工具，按场景匹配选你需要的：<br><br>' + renderToolTable(top);
      }

      if (intent === 'recommend' || (intent && intent.cat)) {
        const cat = intent && intent.cat ? intent.cat : null;
        let matches = TOOLS;
        if (cat) matches = TOOLS.filter(function (t) { return t.cat === cat; });
        if (matches.length === 0) {
          // 没有精确匹配则推荐综合最强的 3 款
          matches = TOOLS.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
          return '**结论前置**：未识别到精确场景，按综合评分推荐前三：<br><br>' + renderToolTable(matches);
        }
        return '**结论前置**：按你提到的场景（' + escapeHtml(cat) + '），匹配如下：<br><br>' + renderToolTable(matches);
      }

      // 默认回复：解释艾弗是谁 + 反问锁定场景
      return '**结论前置**：我是艾弗，I.F. Labs 的 AI 智能体伙伴，专注 AI 工具选型、工作流方案与 Prompt 生成。<br><br>' +
        '<strong>我能帮你做的</strong>：<br>' +
        '1. 推荐适合你场景的 AI 工具（按站内测评打分）<br>' +
        '2. 拆解工作流，给可执行步骤与产出模板<br>' +
        '3. 生成可直接粘贴的 Prompt<br><br>' +
        '为了更精准回答，告诉我 ① 你要做什么 ② 当前在用什么工具。<br>—— 艾弗 Ifer';
    }

    function openChat() {
      if (state.open) return;
      state.open = true;
      panel.hidden = false;
      bubble.classList.add('is-open');
      bubble.setAttribute('aria-expanded', 'true');
      if (!state.greeted) {
        state.greeted = true;
        setTimeout(function () {
          appendMessage('bot', '我是艾弗，I.F. Labs 的 AI 智能体伙伴。\n\n告诉我你要解决什么问题，我给你结构化方案。', { html: false });
          renderQuick();
        }, 120);
      } else {
        renderQuick();
      }
      setTimeout(function () { input.focus(); }, 200);
    }

    function closeChat() {
      state.open = false;
      panel.hidden = true;
      bubble.classList.remove('is-open');
      bubble.setAttribute('aria-expanded', 'false');
    }

    function toggleChat() {
      if (state.open) closeChat();
      else openChat();
    }

    function renderQuick() {
      quickEl.innerHTML = '';
      QUICK.forEach(function (q) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ifer-chat-quick-btn';
        b.textContent = q;
        b.addEventListener('click', function () { handleSend(q); });
        quickEl.appendChild(b);
      });
    }

    function handleSend(text) {
      const value = (text != null ? text : input.value).trim();
      if (!value || state.busy) return;
      input.value = '';
      appendMessage('user', value, { html: false });
      state.busy = true;
      const typing = showTyping();
      // simulate thinking
      const delay = 600 + Math.min(1200, value.length * 12);
      setTimeout(function () {
        typing.remove();
        const html = buildResponse(value);
        appendMessage('bot', html, { html: true });
        state.busy = false;
      }, delay);
    }

    bubble.addEventListener('click', toggleChat);
    document.querySelectorAll('[data-ifer-open]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openChat();
      });
    });
    const closeBtn = panel.querySelector('[data-ifer-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeChat);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSend();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.open) closeChat();
    });
  })();
})();

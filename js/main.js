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

  // ===== I.F. Labs · 艾弗 Ifer 探出实体 + 浮动对话 =====
  (function initIferChat() {
    const character = document.getElementById('ifer-character');
    const panel = document.getElementById('ifer-chat-panel');
    const messagesEl = document.getElementById('ifer-chat-messages');
    const quickEl = document.getElementById('ifer-chat-quick');
    const form = document.getElementById('ifer-chat-form');
    const input = document.getElementById('ifer-chat-input');
    if (!character || !panel || !messagesEl || !form || !input) return;

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
      if (/你好|你是谁|hi|hello|嗨/.test(t)) return 'greet';
      if (/评测|测评|打分|评分|对比|比较|排行/.test(t)) return 'review';
      if (/prompt|提示词|怎么写|模板/.test(t)) return 'prompt';
      const cats = [
        { key: '写作', re: /写作|文案|起草|文章|周报|公众号|小红书|朋友圈|邮件|润色/ },
        { key: 'AI IDE', re: /编程|写代码|cursor|代码|开发|debug|重构|单元测试/ },
        { key: 'PPT 生成', re: /ppt|演示|幻灯片|汇报|路演/ },
        { key: '联网搜索', re: /搜索|查资料|联网|资料|新闻|实时/ },
        { key: '图像生成', re: /画图|配图|海报|插画|设计|头像|logo/ },
        { key: '长文 / 推理', re: /长文|长文档|合同|论文|报告|分析|推理|总结/ },
        { key: '文档协作', re: /文档|笔记|知识库|notion/ },
        { key: 'UI 生成', re: /ui|前端|网页|界面|layout|原型/ }
      ];
      for (const c of cats) if (c.re.test(t)) return { cat: c.key };
      // 通用"推荐/选什么"——无特定场景
      if (/怎么选|如何选|选什么|推荐|哪个|建议|用哪款|有什么/.test(t)) return 'recommend';
      return null;
    }

    function toolPickReason(tool, cat) {
      // 给每款工具配一句"为什么选它"的人话解释，避免纯表格
      const map = {
        'ChatGPT': '通用问答与起草首选，插件与生态最全，几乎所有场景的兜底选项。',
        'Claude': '长文档理解、结构化输出、复杂推理的天花板，写方案与做分析的利器。',
        'Cursor': 'AI 编程 IDE，能直接改你工程里的代码，比聊天窗口强一个量级。',
        'Perplexity': '带联网 + 引用的搜索，回答有出处，适合做资料调研。',
        'Midjourney': '图像生成视觉质量与风格控制最强，设计师首选。',
        'Notion AI': '已在 Notion 体系内可顺手启用，否则不必专门订阅。',
        'v0': '前端 / UI 代码生成最快，描述需求直接出可跑的 React 组件。',
        'Gamma': '快速搭演示稿骨架，但细节文案需自己再调一遍。'
      };
      return map[tool.name] || tool.note;
    }

    function buildResponse(userText) {
      const intent = classifyIntent(userText);

      if (intent === 'greet') {
        return '我是艾弗，I.F. Labs 的 AI 智能体伙伴。\n\n我能帮你做三件事：选 AI 工具、拆工作流、生成 Prompt。\n\n直接说你的任务就行，比如"我想写一份项目周报"或"我想做个海报"。';
      }

      if (intent === 'prompt') {
        return '给你一个五段式万能 Prompt 模板，把方括号里的内容换成你的场景就能直接用：\n\n' +
          '```\n你是 [角色]，擅长 [领域]。\n背景：[上下文与目标读者]\n任务：[请你做什么，按编号列]\n约束：[字数、风格、禁用词、必须包含的要素]\n输出格式：[表格 / 编号 / Markdown / JSON]\n```\n\n要我帮你把现在这个需求套进这个模板吗？';
      }

      if (intent === 'package') {
        return 'AI 速用包是 I.F. Labs 把"工具组合 + 工作流 + 检查清单"打包好的成品，比单条评测省事。\n\n' +
          '站内分两类：\n' +
          '• 官方速用包：评测验证过的工具组合，含执行步骤与风险提示\n' +
          '• 社区方案：用户提交的真实案例，按场景分类\n\n' +
          '入口在顶部导航「AI 速用包」和「方案集市」。';
      }

      if (intent === 'review') {
        const top = TOOLS.slice().sort((a, b) => b.score - a.score).slice(0, 4);
        const head = 'I.F. Labs 站内评分最高的 4 款工具，按你的场景挑：';
        return head + '<br><br>' + renderToolTable(top);
      }

      if (intent === 'recommend') {
        // 没有明确场景——反问锁定，而不是硬塞
        return '想给你更对得上的推荐，先确认两件事：\n\n' +
          '1. 你主要用 AI 做什么？（写作 / 编程 / 出图 / 查资料 / 做 PPT / 其他）\n' +
          '2. 现在已经在用什么工具，遇到什么卡点？\n\n' +
          '回答这两个我就给你具体推荐。';
      }

      if (intent && intent.cat) {
        const cat = intent.cat;
        let matches = TOOLS.filter(t => t.cat === cat);
        if (matches.length === 0) {
          matches = TOOLS.slice().sort((a, b) => b.score - a.score).slice(0, 3);
          const head = `没在站内找到"${cat}"的精确匹配，按综合评分给你前三：`;
          return head + '<br><br>' + renderToolTable(matches);
        }
        // 有匹配——先说一句推荐 + 一句理由，再上表
        const top = matches.sort((a, b) => b.score - a.score)[0];
        const intro = `做${cat}首推 <strong>${top.name}</strong>。${toolPickReason(top, cat)}`;
        const rest = matches.length > 1 ? '<br><br>同场景备选：' : '';
        const restRows = matches.length > 1
          ? '<table class="ifer-chat-msg-table"><thead><tr><th>工具</th><th>评分</th><th>适用</th></tr></thead><tbody>' +
            matches.map(t => `<tr><td>${escapeHtml(t.name)}</td><td>${t.score.toFixed(1)}</td><td>${escapeHtml(toolPickReason(t, cat))}</td></tr>`).join('') +
            '</tbody></table>'
          : '';
        return intro + rest + restRows;
      }

      // 默认：自我介绍 + 反问
      return '我是艾弗，I.F. Labs 的 AI 智能体伙伴，专注 AI 工具选型、工作流方案与 Prompt 生成。\n\n' +
        '告诉我：\n' +
        '① 你要做什么\n' +
        '② 当前在用什么工具、卡在哪\n\n' +
        '我直接给你结构化方案。';
    }

    function openChat() {
      if (state.open) return;
      state.open = true;
      panel.hidden = false;
      document.body.classList.add('ifer-chat-open');
      character.setAttribute('aria-expanded', 'true');
      if (!state.greeted) {
        state.greeted = true;
        setTimeout(function () {
          appendMessage('bot', '我是艾弗，I.F. Labs 的 AI 智能体伙伴。\n\n告诉我你要解决什么问题，我给你结构化方案。', { html: false });
          renderQuick();
        }, 220);
      } else {
        renderQuick();
      }
      setTimeout(function () { input.focus(); }, 320);
    }

    function closeChat() {
      state.open = false;
      panel.hidden = true;
      document.body.classList.remove('ifer-chat-open');
      character.setAttribute('aria-expanded', 'false');
      setCharacterState('idle');
    }

    function toggleChat() {
      if (state.open) closeChat();
      else openChat();
    }

    function setCharacterState(s) {
      character.dataset.state = s;
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
      setCharacterState('thinking');
      const typing = showTyping();
      // simulate thinking
      const delay = 600 + Math.min(1200, value.length * 12);
      setTimeout(function () {
        typing.remove();
        const html = buildResponse(value);
        appendMessage('bot', html, { html: true });
        state.busy = false;
        setCharacterState('idle');
      }, delay);
    }

    character.addEventListener('click', toggleChat);
    character.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleChat();
      }
    });
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

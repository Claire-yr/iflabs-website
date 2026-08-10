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
})();

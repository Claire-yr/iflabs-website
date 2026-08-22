#!/usr/bin/env python3
"""I.F. Labs static site generator."""

import json
import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
DATA_FILE = ROOT / "data" / "content.json"
OUTPUT_DIR = ROOT / "dist"
TEMPLATES_DIR = ROOT / "templates"


def load_content():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def ensure_dirs():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "reviews").mkdir(exist_ok=True)
    (OUTPUT_DIR / "guides").mkdir(exist_ok=True)
    (OUTPUT_DIR / "packages").mkdir(exist_ok=True)
    (OUTPUT_DIR / "market").mkdir(exist_ok=True)
    (OUTPUT_DIR / "library").mkdir(exist_ok=True)
    (OUTPUT_DIR / "compare").mkdir(exist_ok=True)
    (OUTPUT_DIR / "about").mkdir(exist_ok=True)
    (OUTPUT_DIR / "search").mkdir(exist_ok=True)
    (OUTPUT_DIR / "data").mkdir(exist_ok=True)
    (OUTPUT_DIR / "assets").mkdir(exist_ok=True)


def copy_assets():
    src_css = ROOT / "css"
    src_js = ROOT / "js"
    src_assets = ROOT / "assets"
    dst_css = OUTPUT_DIR / "css"
    dst_js = OUTPUT_DIR / "js"
    dst_assets = OUTPUT_DIR / "assets"
    if src_css.exists():
        shutil.copytree(src_css, dst_css, dirs_exist_ok=True)
    if src_js.exists():
        shutil.copytree(src_js, dst_js, dirs_exist_ok=True)
    if src_assets.exists():
        shutil.copytree(src_assets, dst_assets, dirs_exist_ok=True)


def nav_link(label, href, active_href, english="", status=""):
    active = " active" if href == active_href else ""
    status_badge = f'<span class="navbar-status">{status}</span>' if status else ""
    return (
        f'<a href="{href}" class="navbar-link{active}">'
        f'{label}{status_badge}<span class="sr-only">{english}</span>'
        f'</a>'
    )


def base_layout(site, navigation, title, description, body, active_href="/"):
    nav_links = "\n".join(
        nav_link(item["label"], item["href"], active_href, item.get("english", ""), item.get("status", ""))
        for item in navigation
    )
    mobile_links = "\n".join(
        f'<a href="{item["href"]}">{item["label"]}</a>'
        for item in navigation
    )
    full_title = f"{title} | {site['name']}" if title else site["name"]
    meta_desc = description or site["description"]
    return f'''<!DOCTYPE html>
<html lang="{site['lang']}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{full_title}</title>
  <meta name="description" content="{meta_desc}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/main.css?v=5">
</head>
<body>
  <div class="page">
    <header class="navbar">
      <div class="container navbar-inner">
        <a href="/" class="navbar-logo">
          <img src="/assets/logo.jpg" alt="I.F. Labs" class="navbar-logo-img">
          <span>{site['name']}</span>
        </a>
        <nav class="navbar-links" aria-label="主导航">
          {nav_links}
        </nav>
        <div class="navbar-actions">
          <a href="/search" class="navbar-icon" aria-label="搜索">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </a>
          <button class="navbar-menu-btn" id="mobile-menu-button" aria-expanded="false" aria-label="打开菜单">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>
      <nav class="mobile-menu container" id="mobile-menu" aria-label="移动端导航">
        {mobile_links}
      </nav>
    </header>

    <main class="page-main">
      {body}
    </main>

    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div class="navbar-logo mb-2">
            <img src="/assets/logo.jpg" alt="I.F. Labs" class="navbar-logo-img">
            <span>{site['name']}</span>
          </div>
          <p class="text-small">{site['tagline']}</p>
          <p class="text-small" style="color: var(--color-text-muted); margin-top: 8px;">用真实测试和明确结论，帮你决定用哪款 AI 工具、怎么把它用好。</p>
        </div>
        <div>
          <div class="footer-heading">内容</div>
          <div class="footer-links">
            <a href="/reviews">评测</a>
            <a href="/guides">方案</a>
            <a href="/packages">AI 速用包</a>
            <a href="/market">方案集市</a>
            <a href="/library">工具库</a>
            <a href="/compare">对比</a>
          </div>
        </div>
        <div>
          <div class="footer-heading">信息</div>
          <div class="footer-links">
            <a href="/about">关于我们</a>
            <a href="/about#methodology">评测方法</a>
            <a href="/about#criteria">评分标准</a>
          </div>
        </div>
        <div>
          <div class="footer-heading">订阅</div>
          <div class="footer-links">
            <a href="/about#newsletter">每周雷达</a>
            <a href="/search">搜索全站</a>
          </div>
        </div>
      </div>
      <div class="container footer-bottom">
        <p class="text-mono" style="color: var(--color-text-muted);">© 2026 {site['name']}. 保留所有权利。</p>
        <div class="footer-social">
          <a href="#">X</a>
          <a href="#">Newsletter</a>
          <a href="#">RSS</a>
        </div>
      </div>
    </footer>
  </div>

  <button type="button" class="ifer-chat-bubble" id="ifer-chat-bubble" aria-label="与艾弗对话" aria-expanded="false">
    <img src="/assets/ifer/ifer-avatar-minimal.png" alt="" class="ifer-chat-bubble-avatar">
    <span class="ifer-chat-bubble-pulse" aria-hidden="true"></span>
  </button>

  <div class="ifer-chat-panel" id="ifer-chat-panel" hidden role="dialog" aria-label="艾弗 Ifer 对话窗口">
    <div class="ifer-chat-header">
      <div class="ifer-chat-header-left">
        <img src="/assets/ifer/ifer-avatar-minimal.png" alt="" class="ifer-chat-avatar">
        <div>
          <div class="ifer-chat-name">艾弗 Ifer <span class="ifer-chat-status-dot" aria-label="在线"></span></div>
          <div class="ifer-chat-sub">基于 I.F. Labs 知识库</div>
        </div>
      </div>
      <button type="button" class="ifer-chat-close" aria-label="关闭对话" data-ifer-close>×</button>
    </div>
    <div class="ifer-chat-messages" id="ifer-chat-messages" aria-live="polite"></div>
    <div class="ifer-chat-quick" id="ifer-chat-quick"></div>
    <form class="ifer-chat-input-wrap" id="ifer-chat-form">
      <input type="text" class="ifer-chat-input" id="ifer-chat-input" placeholder="问艾弗：哪个 AI 工具适合我？" autocomplete="off" maxlength="500">
      <button type="submit" class="ifer-chat-send" aria-label="发送">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </form>
    <div class="ifer-chat-footer">基于 I.F. Labs 知识库 · 结论前置 · —— 艾弗 Ifer</div>
  </div>

  <script src="/js/main.js?v=6"></script>
</body>
</html>'''


def badge_class(recommendation):
    return {
        "recommend": "badge-recommend",
        "conditional": "badge-conditional",
        "not-recommend": "badge-not-recommend",
    }.get(recommendation, "badge-status")


def badge_label(recommendation):
    return {
        "recommend": "推荐",
        "conditional": "视条件推荐",
        "not-recommend": "不推荐",
    }.get(recommendation, recommendation)


def cost_badge_class(cost_level):
    return {
        "free": "cost-free",
        "low": "cost-low",
        "medium": "cost-medium",
        "high": "cost-high",
    }.get(cost_level, "cost-medium")


def render_pkg_sections(sections):
    """Render package/market sections with appropriate formatting."""
    def section_html(s):
        heading = s.get("heading", "")
        body = s.get("body", "")

        if "提示词" in heading or "Prompt" in heading:
            return f'''<h2>{heading}</h2>
<div class="prompt-block">
  <button type="button" class="prompt-copy" onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent.trim())">复制</button>
  <pre>{body}</pre>
</div>'''

        if "工具组合" in heading or "选型" in heading:
            # Split into value/top tiers if both are present
            match = re.match(r'^(.*?)高性价比[/／]免费[：:]\s*(.+?)\s*顶配[：:]\s*(.+)$', body, re.DOTALL)
            if not match:
                match = re.match(r'^(.*?)高性价比[：:]\s*(.+?)\s*顶配[：:]\s*(.+)$', body, re.DOTALL)
            if match:
                value_text = match.group(2).strip()
                top_text = match.group(3).strip()
                return f'''<h2>{heading}</h2>
<div class="tool-choice-grid">
  <div class="tool-choice-card tool-choice-value">
    <div class="tool-choice-label">高性价比 / 免费</div>
    <p>{value_text}</p>
  </div>
  <div class="tool-choice-card tool-choice-top">
    <div class="tool-choice-label">顶配</div>
    <p>{top_text}</p>
  </div>
</div>'''
            return f'<h2>{heading}</h2>\n<p>{body}</p>'

        if any(k in heading for k in ["工作流", "执行", "步骤", "流程"]):
            # Split by Chinese/Arabic numbered list markers
            raw_steps = re.split(r'\s*(?:\d+[\.、）\)])+\s*', body)
            steps = [step.strip(' ;；，,') for step in raw_steps if step.strip(' ;；，,')]
            if len(steps) > 1:
                steps_html = "\n".join(
                    f'<li class="workflow-step"><span class="workflow-step-num">{i+1:02d}</span><span>{step}</span></li>'
                    for i, step in enumerate(steps)
                )
                return f'''<h2>{heading}</h2>
<ol class="workflow-steps">
{steps_html}
</ol>'''
            return f'<h2>{heading}</h2>\n<p>{body}</p>'

        if any(k in heading for k in ["坑", "雷", "风险", "不适合", "注意"]):
            return f'''<h2>{heading}</h2>
<div class="risk-block">
  <div class="risk-block-title">注意</div>
  <p>{body}</p>
</div>'''

        return f'<h2>{heading}</h2>\n<p>{body}</p>'

    return "\n\n".join(section_html(s) for s in sections)


def score_block_html(score, label, max_score=10):
    return f'''<div class="score-block">
  <span class="score-number">{score}</span>
  <span class="score-max">/{max_score}</span>
</div>
<span class="score-label">{label}</span>'''


def review_card(review):
    badge = badge_class(review["recommendation"])
    label = badge_label(review["recommendation"])
    tags_html = " ".join(f'<span class="tag">{tag}</span>' for tag in review.get("tags", [])[:3])
    return f'''<article class="card review-card" data-filterable data-category="{review['category']}" data-recommendation="{review['recommendation']}" data-scenarios="{",".join(review.get('scenarios', []))}">
  <div class="review-card-header">
    <span class="review-card-tool">{review['tool']} · {review['category']}</span>
    <span class="badge {badge}">{label}</span>
  </div>
  <h3 class="review-card-title"><a href="/reviews/{review['id']}.html">{review['title']}</a></h3>
  <p class="review-card-summary">{review['summary']}</p>
  <div class="review-card-footer">
    {tags_html}
    <span class="tag">{review.get('readTime', '')}</span>
  </div>
</article>'''


def guide_card(guide):
    tags_html = " ".join(f'<span class="tag">{tag}</span>' for tag in guide.get("tags", [])[:3])
    return f'''<article class="card guide-card" data-filterable data-scenarios="{",".join(guide.get('scenarios', []))}" data-tools="{",".join(guide.get('tools', []))}" data-level="{guide.get('level', '')}">
  <div class="guide-card-steps">{guide['steps']} 步 · {guide.get('estimatedMinutes', 0)} 分钟 · {guide.get('level', '')}</div>
  <h3 class="guide-card-title"><a href="/guides/{guide['id']}.html">{guide['title']}</a></h3>
  <p class="guide-card-result">产出：{guide['result']}</p>
  <p class="guide-card-desc">{guide['summary']}</p>
  <div class="guide-card-meta">
    {tags_html}
    <span>{guide.get('readTime', '')}</span>
  </div>
</article>'''


def hero_3d_card(review, index, total):
    badge = badge_class(review["recommendation"])
    label = badge_label(review["recommendation"])
    tags_html = " ".join(f'<span class="tag">{tag}</span>' for tag in review.get("tags", [])[:3])
    return f'''<article class="hero-3d-card" data-hero-card-index="{index}">
  <a href="/reviews/{review['id']}.html" class="hero-3d-card-link" aria-label="{review['title']}"></a>
  <div class="hero-3d-card-header">
    <span class="hero-3d-card-tool">{review['tool']} · {review['category']}</span>
    <span class="badge {badge}">{label}</span>
  </div>
  <h3 class="hero-3d-card-title">{review['title']}</h3>
  <p class="hero-3d-card-summary">{review['summary']}</p>
  <div class="hero-3d-card-score">
    {score_block_html(review['overallScore'], '综合评分')}
  </div>
  <div class="hero-3d-card-footer">
    {tags_html}
    <span class="tag">{review.get('readTime', '')}</span>
  </div>
</article>'''


def wall_3d_card_review(review):
    badge = badge_class(review["recommendation"])
    label = badge_label(review["recommendation"])
    return f'''<article class="wall-3d-card wall-3d-card-review">
  <a href="/reviews/{review['id']}.html" class="wall-3d-card-link" aria-label="{review['title']}"></a>
  <div class="wall-3d-card-header">
    <span class="wall-3d-card-tool">{review['tool']} · {review['category']}</span>
    <span class="badge {badge}">{label}</span>
  </div>
  <h3 class="wall-3d-card-title">{review['title']}</h3>
  <p class="wall-3d-card-summary">{review['summary']}</p>
  <div class="wall-3d-card-footer">
    <span class="wall-3d-card-score"><strong>{review['overallScore']}</strong>/10</span>
    <span class="tag">{review.get('readTime', '')}</span>
  </div>
</article>'''


def wall_3d_card_guide(guide):
    return f'''<article class="wall-3d-card wall-3d-card-guide">
  <a href="/guides/{guide['id']}.html" class="wall-3d-card-link" aria-label="{guide['title']}"></a>
  <div class="wall-3d-card-header">
    <span class="wall-3d-card-tool">{guide['steps']} 步 · {guide.get('estimatedMinutes', 0)} 分钟</span>
    <span class="badge badge-status">{guide.get('level', '')}</span>
  </div>
  <h3 class="wall-3d-card-title">{guide['title']}</h3>
  <p class="wall-3d-card-summary">{guide['summary']}</p>
  <div class="wall-3d-card-footer">
    <span class="wall-3d-card-result">产出：{guide['result']}</span>
    <span class="tag">{guide.get('readTime', '')}</span>
  </div>
</article>'''


def render_home(content):
    site = content["site"]
    featured_review = next((r for r in content["reviews"] if r.get("featured")), content["reviews"][0])
    hero_reviews = [featured_review] + [r for r in content["reviews"] if r["id"] != featured_review["id"]][:4]
    recent_reviews = content["reviews"][:6]
    featured_guides = content["guides"][:6]

    hero_cards_html = "\n".join(hero_3d_card(r, i, len(hero_reviews)) for i, r in enumerate(hero_reviews))
    hero_dots_html = "\n".join(f'<button type="button" class="hero-3d-dot{" active" if i == 0 else ""}" data-hero-dot="{i}" aria-label="切换到第 {i+1} 张卡片"></button>' for i in range(len(hero_reviews)))

    reviews_wall_html = "\n".join(wall_3d_card_review(r) for r in recent_reviews)
    reviews_wall_html += "\n" + "\n".join(wall_3d_card_review(r) for r in recent_reviews)

    guides_wall_html = "\n".join(wall_3d_card_guide(g) for g in featured_guides)
    guides_wall_html += "\n" + "\n".join(wall_3d_card_guide(g) for g in featured_guides)

    body = f'''<section class="hero">
  <div class="container hero-grid">
    <div>
      <div class="hero-label">本周重点评测</div>
      <h1 class="text-display hero-title">{site['tagline']}</h1>
      <p class="hero-description">{site['description']}</p>
      <div class="hero-actions">
        <a href="/reviews" class="btn btn-primary">浏览评测</a>
        <a href="/guides" class="btn btn-secondary">查看方案</a>
      </div>
    </div>
    <div class="hero-3d-carousel" id="hero-3d-carousel">
      <div class="hero-3d-stage" id="hero-3d-stage" style="--count:{len(hero_reviews)};">
        {hero_cards_html}
      </div>
      <div class="hero-3d-dots">
        {hero_dots_html}
      </div>
    </div>
  </div>
</section>

<section class="ifer-intro-section" id="ifer-intro">
  <div class="container ifer-intro-grid">
    <div class="ifer-video-frame">
      <video class="ifer-video" autoplay loop muted playsinline preload="metadata" aria-label="艾弗 Ifer 动态形象">
        <source src="/assets/ifer/ifer-3d.mp4" type="video/mp4">
      </video>
      <span class="ifer-video-pulse" aria-hidden="true"></span>
    </div>
    <div class="ifer-intro-info">
      <span class="ifer-kicker">YOUR AI AGENT COMPANION</span>
      <h2 class="ifer-name">艾弗 <span class="ifer-name-en">Ifer</span></h2>
      <p class="ifer-role">AI 智能体伙伴</p>
      <p class="ifer-desc">基于 I.F. Labs 真实测试知识库，直接给结论：哪个工具值得用、怎么搭工作流、Prompt 怎么写。不啰嗦，不模糊。</p>
      <div class="ifer-cta-row">
        <button type="button" class="btn btn-primary" data-ifer-open>与艾弗对话</button>
        <span class="ifer-cta-hint">基于 I.F. Labs 知识库 · 免费</span>
      </div>
    </div>
  </div>
</section>

<section class="proof-strip">
  <div class="container proof-strip-inner">
    <div class="proof-item">
      <span class="proof-item-value">{len(content['reviews'])}</span>
      <span class="proof-item-label">篇深度评测</span>
    </div>
    <div class="proof-item">
      <span class="proof-item-value">{len(content['guides'])}</span>
      <span class="proof-item-label">个可复用方案</span>
    </div>
    <div class="proof-item">
      <span class="proof-item-value">{len(content['tools'])}</span>
      <span class="proof-item-label">款工具入库</span>
    </div>
    <div class="proof-item">
      <span class="proof-item-value">8.4</span>
      <span class="proof-item-label">平均推荐分</span>
    </div>
  </div>
</section>

<section class="section wall-3d-section" id="reviews-wall-section">
  <div class="container">
    <div class="content-narrow content-narrow-left mb-4">
      <p class="section-title-lg mb-2">最新评测</p>
    </div>
  </div>
  <div class="wall-3d-viewport wall-3d-viewport-reviews">
    <div class="wall-3d-track" data-wall="reviews">
      {reviews_wall_html}
    </div>
  </div>
  <div class="container">
    <div class="text-center mt-4">
      <a href="/reviews" class="btn btn-secondary">查看全部评测</a>
    </div>
  </div>
</section>

<section class="section wall-3d-section" style="background-color: var(--color-paper-dark);" id="guides-wall-section">
  <div class="container">
    <div class="content-narrow content-narrow-left mb-4">
      <p class="section-title-lg mb-2">精选方案</p>
    </div>
  </div>
  <div class="wall-3d-viewport wall-3d-viewport-guides">
    <div class="wall-3d-track" data-wall="guides" data-direction="reverse">
      {guides_wall_html}
    </div>
  </div>
  <div class="container">
    <div class="text-center mt-4">
      <a href="/guides" class="btn btn-secondary">查看全部方案</a>
    </div>
  </div>
</section>

<section class="section newsletter-section">
  <div class="container">
    <div class="newsletter-grid">
      <div>
        <h2 class="text-h1 newsletter-title">每周雷达</h2>
        <p class="newsletter-desc">一份关于 AI 工具的简短周报：我们测了什么、结论是什么、你应该关注什么。无噪音，每周一发送。</p>
      </div>
      <form class="newsletter-form" onsubmit="return false;">
        <input type="email" class="newsletter-input" placeholder="your@email.com" required>
        <button type="submit" class="btn btn-signal">订阅</button>
      </form>
    </div>
  </div>
</section>'''

    return base_layout(site, content["navigation"], site["tagline"], site["description"], body, "/")


def render_reviews_archive(content):
    site = content["site"]
    categories = content["categories"]["review"]
    reviews_html = "\n".join(review_card(r) for r in content["reviews"])
    category_filters = "\n".join(
        f'<button class="filter-chip" data-filter="category" data-value="{cat}">{cat}</button>'
        for cat in categories
    )
    recommendation_filters = '''<button class="filter-chip active" data-filter="recommendation" data-value="recommend" data-group="rec">推荐</button>
<button class="filter-chip" data-filter="recommendation" data-value="conditional" data-group="rec">视条件</button>
<button class="filter-chip" data-filter="recommendation" data-value="not-recommend" data-group="rec">不推荐</button>'''

    body = f'''<header class="archive-header">
  <div class="container">
    <p class="section-label mb-2">Reviews</p>
    <h1 class="text-display archive-title">评测</h1>
    <p class="archive-description">每篇评测基于同一套评分维度，回答一个核心问题：这款工具是否值得成为你工作流的一部分。</p>
    <div class="archive-stats">
      <span>{len(content['reviews'])} 篇评测</span>
      <span>{len(categories)} 个分类</span>
      <span>每月更新</span>
    </div>
  </div>
</header>

<section class="section-sm">
  <div class="container">
    <div class="filters">
      <button class="filter-chip active" data-filter="category" data-value="all" data-group="cat">全部</button>
      {category_filters}
    </div>
    <div class="filters">
      {recommendation_filters}
    </div>
    <div class="content-grid content-grid-3" style="margin-top: var(--space-4);">
      {reviews_html}
    </div>
    <div id="filter-empty-state" class="text-center mt-4" style="display: none;">
      <p class="text-body">没有符合条件的评测。</p>
    </div>
  </div>
</section>'''

    return base_layout(site, content["navigation"], "评测", "AI 工具深度评测，基于真实测试和明确结论。", body, "/reviews")


def render_review_detail(content, review):
    site = content["site"]
    badge = badge_class(review["recommendation"])
    label = badge_label(review["recommendation"])

    scores_rows = "\n".join(
        f'''<tr>
  <td>{s['dimension']} <span style="color: var(--color-text-muted); font-size: var(--text-mono);">({s['weight']}%)</span></td>
  <td><strong>{s['score']}</strong></td>
  <td>{s['note']}</td>
</tr>'''
        for s in review["scores"]
    )

    suitable_html = "\n".join(f'<li>{item}</li>' for item in review.get("suitableFor", []))
    not_suitable_html = "\n".join(f'<li>{item}</li>' for item in review.get("notSuitableFor", []))
    tags_html = " ".join(f'<span class="tag">{tag}</span>' for tag in review.get("tags", []))
    scenarios_html = " ".join(f'<span class="tag">{s}</span>' for s in review.get("scenarios", []))

    conclusion_class = "conclusion-positive" if review["recommendation"] == "recommend" else (
        "conclusion-negative" if review["recommendation"] == "not-recommend" else "conclusion-caution"
    )

    sections_html = "\n\n".join(
        f'<h3>{s["heading"]}</h3>\n<p>{s["body"]}</p>'
        for s in review.get("sections", [])
    )

    body = f'''<article class="detail-header">
  <div class="container content-table">
    <div class="detail-breadcrumb">
      <a href="/">首页</a> / <a href="/reviews">评测</a> / {review['category']}
    </div>
    <div class="detail-score-box mb-3">
      {score_block_html(review['overallScore'], '综合评分')}
      <span class="badge {badge}">{label}</span>
    </div>
    <h1 class="text-display detail-title">{review['title']}</h1>
    <p class="detail-summary">{review['summary']}</p>
    <div class="metadata-row detail-meta">
      <span>工具：{review['tool']} {review.get('version', '')}</span>
      <span>分类：{review['category']}</span>
      <span>测试：{review['testedAt']}</span>
      <span>更新：{review['updatedAt']}</span>
      <span>阅读：{review.get('readTime', '')}</span>
    </div>
    <div class="detail-meta">
      {tags_html}
      {scenarios_html}
    </div>
  </div>
</article>

<div class="article-content">
  <div class="container content-table">
    <section class="{conclusion_class} conclusion mb-4">
      <h2 class="text-h3 mb-1">一句话结论</h2>
      <p class="mb-0"><strong>{label}</strong>：{review['summary']}</p>
    </section>

    <h2>评分维度</h2>
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>维度</th>
            <th>得分</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          {scores_rows}
        </tbody>
      </table>
    </div>

    <h2>适合谁</h2>
    <ul>
      {suitable_html}
    </ul>

    <h2>不适合谁</h2>
    <ul>
      {not_suitable_html}
    </ul>

    <h2>详细分析</h2>
    {sections_html}

    <h2>相关方案</h2>
    <p>查看使用 {review['tool']} 的 <a href="/guides" class="link">可复用工作流</a>。</p>
  </div>
</div>'''

    return base_layout(site, content["navigation"], review["title"], review["summary"], body, "/reviews")


def render_guides_archive(content):
    site = content["site"]
    scenarios = sorted(set(s for g in content["guides"] for s in g.get("scenarios", [])))
    guides_html = "\n".join(guide_card(g) for g in content["guides"])
    scenario_filters = "\n".join(
        f'<button class="filter-chip" data-filter="scenarios" data-value="{s}">{s}</button>'
        for s in scenarios
    )

    body = f'''<header class="archive-header">
  <div class="container">
    <p class="section-label mb-2">Guides</p>
    <h1 class="text-display archive-title">方案</h1>
    <p class="archive-description">把 AI 工具串成可执行的工作流。每个方案包含步骤、时间、产出物和适用角色。</p>
    <div class="archive-stats">
      <span>{len(content['guides'])} 个方案</span>
      <span>{len(scenarios)} 个场景</span>
      <span>持续更新</span>
    </div>
  </div>
</header>

<section class="section-sm">
  <div class="container">
    <div class="filters">
      <button class="filter-chip active" data-filter="scenarios" data-value="all" data-group="scene">全部场景</button>
      {scenario_filters}
    </div>
    <div class="content-grid content-grid-3" style="margin-top: var(--space-4);">
      {guides_html}
    </div>
    <div id="filter-empty-state" class="text-center mt-4" style="display: none;">
      <p class="text-body">没有符合条件的方案。</p>
    </div>
  </div>
</section>'''

    return base_layout(site, content["navigation"], "方案", "AI 工具可复用工作流，包含步骤、模板和检查清单。", body, "/guides")


def render_guide_detail(content, guide):
    site = content["site"]
    tools_html = " ".join(f'<span class="tag">{tool}</span>' for tool in guide.get("tools", []))
    scenarios_html = " ".join(f'<span class="tag">{s}</span>' for s in guide.get("scenarios", []))
    outputs_html = "\n".join(f'<li>{item}</li>' for item in guide.get("outputs", []))
    roles_html = "\n".join(f'<li>{item}</li>' for item in guide.get("roles", []))

    # Render sections from content
    steps_html = "\n\n".join(
        f'''<div class="step">
  <span class="step-number">步骤 {idx + 1}</span>
  <h3 class="step-title">{s["heading"]}</h3>
  <p class="step-purpose">{s["body"]}</p>
</div>'''
        for idx, s in enumerate(guide.get("sections", []))
    )

    body = f'''<article class="detail-header">
  <div class="container content-table">
    <div class="detail-breadcrumb">
      <a href="/">首页</a> / <a href="/guides">方案</a> / {guide.get('scenarios', ['通用'])[0]}
    </div>
    <span class="badge badge-status mb-2">{guide.get('level', 'beginner')} · {guide['steps']} 步 · {guide.get('estimatedMinutes', 0)} 分钟</span>
    <h1 class="text-display detail-title">{guide['title']}</h1>
    <p class="detail-summary">{guide['summary']}</p>
    <div class="metadata-row detail-meta">
      <span>产出：{guide['result']}</span>
      <span>发布：{guide['publishedAt']}</span>
      <span>更新：{guide['updatedAt']}</span>
      <span>阅读：{guide.get('readTime', '')}</span>
    </div>
    <div class="detail-meta">
      {tools_html}
      {scenarios_html}
    </div>
  </div>
</article>

<div class="article-content">
  <div class="container content-table">
    <section class="conclusion conclusion-positive mb-4">
      <h2 class="text-h3 mb-1">方案目标</h2>
      <p class="mb-0">{guide['result']}</p>
    </section>

    <h2>适用角色</h2>
    <ul>
      {roles_html}
    </ul>

    <h2>你将获得</h2>
    <ul>
      {outputs_html}
    </ul>

    <h2>执行步骤</h2>
    {steps_html}

    <h2>工具与场景</h2>
    <p>本方案主要使用 {', '.join(guide.get('tools', []))}，适用于 {', '.join(guide.get('scenarios', []))} 场景。</p>
  </div>
</div>'''

    return base_layout(site, content["navigation"], guide["title"], guide["summary"], body, "/guides")


def render_library(content):
    site = content["site"]
    tools_html = "\n".join(
        f'''<article class="card review-card" data-filterable data-category="{",".join(tool.get('categories', []))}">
  <div class="review-card-header">
    <span class="review-card-tool">{tool['vendor']}</span>
    <span class="badge badge-status">{tool.get('status', 'active')}</span>
  </div>
  <h3 class="review-card-title"><a href="/library/{tool['id']}.html">{tool['name']}</a></h3>
  <p class="review-card-summary">{tool['shortDescription']}</p>
  <div class="review-card-footer">
    {' '.join(f'<span class="tag">{c}</span>' for c in tool.get('categories', []))}
    <span class="tag">{tool.get('pricingSummary', '')}</span>
  </div>
</article>'''
        for tool in content["tools"]
    )

    categories = sorted(set(c for t in content["tools"] for c in t.get("categories", [])))
    category_filters = "\n".join(
        f'<button class="filter-chip" data-filter="category" data-value="{cat}">{cat}</button>'
        for cat in categories
    )

    body = f'''<header class="archive-header">
  <div class="container">
    <p class="section-label mb-2">Library</p>
    <h1 class="text-display archive-title">工具库</h1>
    <p class="archive-description">已验证的 AI 工具档案，包含价格、平台、适用场景和最新核验时间。</p>
    <div class="archive-stats">
      <span>{len(content['tools'])} 款工具</span>
      <span>{len(categories)} 个分类</span>
      <span>持续更新</span>
    </div>
  </div>
</header>

<section class="section-sm">
  <div class="container">
    <div class="filters">
      <button class="filter-chip active" data-filter="category" data-value="all" data-group="cat">全部</button>
      {category_filters}
    </div>
    <div class="content-grid content-grid-3" style="margin-top: var(--space-4);">
      {tools_html}
    </div>
    <div id="filter-empty-state" class="text-center mt-4" style="display: none;">
      <p class="text-body">没有符合条件的工具。</p>
    </div>
  </div>
</section>'''

    return base_layout(site, content["navigation"], "工具库", "AI 工具档案库，包含价格、平台和适用场景。", body, "/library")


def render_tool_detail(content, tool):
    site = content["site"]
    categories_html = " ".join(f'<span class="tag">{c}</span>' for c in tool.get("categories", []))
    use_cases_html = "\n".join(f'<li>{item}</li>' for item in tool.get("useCases", []))
    platforms_html = " ".join(f'<span class="tag">{p}</span>' for p in tool.get("platforms", []))

    related_reviews = [r for r in content["reviews"] if r.get("toolSlug") == tool["id"]]
    related_guides = [g for g in content["guides"] if tool["name"] in g.get("tools", [])]

    reviews_links = "\n".join(f'<li><a href="/reviews/{r['id']}.html" class="link">{r['title']}</a></li>' for r in related_reviews) or '<li>暂无相关评测</li>'
    guides_links = "\n".join(f'<li><a href="/guides/{g['id']}.html" class="link">{g['title']}</a></li>' for g in related_guides) or '<li>暂无相关方案</li>'

    body = f'''<article class="detail-header">
  <div class="container content-table">
    <div class="detail-breadcrumb">
      <a href="/">首页</a> / <a href="/library">工具库</a> / {tool['name']}
    </div>
    <span class="badge badge-status mb-2">{tool.get('status', 'active')} · 核验于 {tool.get('lastVerifiedAt', '')}</span>
    <h1 class="text-display detail-title">{tool['name']}</h1>
    <p class="detail-summary">{tool['shortDescription']}</p>
    <div class="metadata-row detail-meta">
      <span>厂商：{tool['vendor']}</span>
      <span>定价：{tool.get('pricingSummary', '')}</span>
      <span>语言：{', '.join(tool.get('languages', []))}</span>
      <span>地区：{tool.get('regionAvailability', '')}</span>
    </div>
    <div class="detail-meta">
      {categories_html}
      {platforms_html}
    </div>
  </div>
</article>

<div class="article-content">
  <div class="container content-table">
    <h2>适用场景</h2>
    <ul>
      {use_cases_html}
    </ul>

    <h2>价格与平台</h2>
    <div class="table-wrapper">
      <table class="table">
        <tbody>
          <tr><th>定价模式</th><td>{tool.get('pricingModel', '-')}</td></tr>
          <tr><th>价格</th><td>{tool.get('pricingSummary', '-')}</td></tr>
          <tr><th>支持平台</th><td>{', '.join(tool.get('platforms', []))}</td></tr>
          <tr><th>官网</th><td><a href="{tool.get('officialUrl', '#')}" class="link" target="_blank" rel="noopener">{tool.get('officialUrl', '-')}</a></td></tr>
        </tbody>
      </table>
    </div>

    <h2>相关评测</h2>
    <ul>
      {reviews_links}
    </ul>

    <h2>相关方案</h2>
    <ul>
      {guides_links}
    </ul>
  </div>
</div>'''

    return base_layout(site, content["navigation"], tool["name"], tool["shortDescription"], body, "/library")


def render_compare(content):
    site = content["site"]
    # Compare all chat model reviews as an example
    chat_reviews = [r for r in content["reviews"] if r["category"] == "聊天模型"]
    headers = "\n".join(f'<th>{r["tool"]}</th>' for r in chat_reviews)
    score_cells = "\n".join(f'<td><strong>{r["overallScore"]}</strong></td>' for r in chat_reviews)
    rec_cells = "\n".join(f'<td><span class="badge {badge_class(r["recommendation"])}">{badge_label(r["recommendation"])}</span></td>' for r in chat_reviews)
    price_cells = "\n".join(f'<td>见官网</td>' for _ in chat_reviews)

    body = f'''<header class="archive-header">
  <div class="container">
    <p class="section-label mb-2">Compare</p>
    <h1 class="text-display archive-title">对比</h1>
    <p class="archive-description">同维度横向比较，快速看清不同工具在同一工作场景下的取舍。</p>
  </div>
</header>

<section class="section">
  <div class="container content-table">
    <h2 class="text-h2 mb-3">聊天模型对比</h2>
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>维度</th>
            {headers}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>综合评分</td>
            {score_cells}
          </tr>
          <tr>
            <td>推荐结论</td>
            {rec_cells}
          </tr>
          <tr>
            <td>价格</td>
            {price_cells}
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-small" style="color: var(--color-text-secondary); margin-top: var(--space-2);">对比数据基于最新评测，具体价格请以各工具官网为准。</p>
  </div>
</section>'''

    return base_layout(site, content["navigation"], "对比", "AI 工具横向对比，同一维度看清取舍。", body, "/compare")


def render_about(content):
    site = content["site"]
    body = f'''<header class="archive-header">
  <div class="container">
    <p class="section-label mb-2">About</p>
    <h1 class="text-display archive-title">关于 I.F. Labs</h1>
    <p class="archive-description">一个以真实测试、明确结论和可复用工作流为核心的 AI 工具决策与生产力实验室。</p>
  </div>
</header>

<div class="article-content">
  <div class="container content-narrow">
    <h2 id="mission">我们做什么</h2>
    <p>AI 工具更新太快，功能列表越来越长，但真正的问题是：它能不能解决你的具体工作问题？I.F. Labs 通过真实测试、结构化评分和可执行方案，把"试试这个"变成"这个适合你，因为……"。</p>

    <h2 id="methodology">评测方法</h2>
    <p>每款工具都在真实任务中测试，不使用官方 Demo 或营销材料。我们记录输出质量、可靠性、易用性、效率和性价比五个维度，并给出明确推荐结论。</p>

    <h2 id="criteria">评分标准</h2>
    <ul>
      <li><strong>输出质量</strong>：结果是否可用、自然、符合预期</li>
      <li><strong>可靠性</strong>：结果是否稳定、事实是否可信</li>
      <li><strong>易用性</strong>：上手成本和交互体验</li>
      <li><strong>效率</strong>：完成任务所需时间和步骤</li>
      <li><strong>性价比</strong>：价格与价值的匹配度</li>
    </ul>

    <h2 id="team">团队与更新</h2>
    <p>I.F. Labs 由一群长期使用 AI 工具的内容、产品和研究人员维护。评测和方案会定期更新，标注测试和更新时间，确保结论不过期。</p>

    <h2 id="newsletter">联系我们</h2>
    <p>订阅每周雷达，或通过邮件与我们联系：hello@iflabs.ai</p>
    <form class="newsletter-form" onsubmit="return false;">
      <input type="email" class="newsletter-input" placeholder="your@email.com" required>
      <button type="submit" class="btn btn-signal">订阅</button>
    </form>
  </div>
</div>'''

    return base_layout(site, content["navigation"], "关于", "了解 I.F. Labs 的评测方法、评分标准和团队。", body, "/about")


def render_search(content):
    site = content["site"]
    body = f'''<header class="archive-header">
  <div class="container">
    <p class="section-label mb-2">Search</p>
    <h1 class="text-display archive-title">搜索</h1>
    <p class="archive-description">搜索评测、方案和工具库。</p>
  </div>
</header>

<section class="section">
  <div class="container content-narrow">
    <input type="text" class="search-input" id="search-input" placeholder="输入工具名、场景或关键词……" autocomplete="off">
    <div class="search-results" id="search-results">
      <p class="text-small" style="color: var(--color-text-secondary);">输入关键词开始搜索</p>
    </div>
  </div>
</section>'''

    return base_layout(site, content["navigation"], "搜索", "搜索 I.F. Labs 的评测、方案和工具库。", body, "/search")


def package_card(pkg):
    cost_class = cost_badge_class(pkg.get("costLevel", "medium"))
    tools = pkg.get("tools", [])
    seen = set(tools)
    tags_html = " ".join(f'<span class="tag">{tag}</span>' for tag in pkg.get("tags", []) if tag not in seen and not seen.add(tag))
    tools_html = " ".join(f'<span class="tag">{tool}</span>' for tool in tools)
    return f'''<article class="package-card" data-filterable data-scenarios="{",".join(pkg.get('scenarios', []))}" data-cost="{pkg.get('costLevel', '')}" data-tools="{",".join(pkg.get('tools', []))}">
  <div class="package-card-header">
    <span class="package-card-number">{pkg['pkgNumber']}</span>
    <span class="cost-badge {cost_class}">{pkg.get('costLabel', '')}</span>
  </div>
  <h3 class="package-card-title"><a href="/packages/{pkg['id']}.html" target="_blank" rel="noopener">{pkg['title']}</a></h3>
  <p class="package-card-problem">{pkg['problem']}</p>
  <p class="package-card-goal">目标：{pkg['goal']}</p>
  <div class="package-card-footer">
    {tools_html}
    {tags_html}
    <span class="tag">{pkg.get('estimatedMinutes', 0)} 分钟</span>
  </div>
  <div class="package-card-risk">{pkg.get('riskHint', '')}</div>
  <a href="/packages/{pkg['id']}.html" class="btn btn-primary package-card-cta" target="_blank" rel="noopener">查看完整方案</a>
</article>'''


def market_card(mp):
    cost_class = cost_badge_class(mp.get("costLevel", "medium"))
    avatar_initials = "".join([c for c in mp.get("author", "") if "\u4e00" <= c <= "\u9fff"])[-2:] or mp.get("author", "")[:2]
    tools = mp.get("tools", [])
    seen = set(tools)
    tags_html = " ".join(f'<span class="tag">{tag}</span>' for tag in mp.get("tags", []) if tag not in seen and not seen.add(tag))
    return f'''<article class="market-card" data-filterable data-scenarios="{",".join(mp.get('scenarios', []))}" data-cost="{mp.get('costLevel', '')}" data-tools="{",".join(mp.get('tools', []))}">
  <div class="market-card-header">
    <div class="market-card-avatar">{avatar_initials}</div>
    <div>
      <div class="market-card-author">{mp['author']} · {mp.get('authorTitle', '')}</div>
      <div class="metadata-row">
        <span>{mp.get('publishedAt', '')}</span>
        <span class="cost-badge {cost_class}">{mp.get('costLabel', '')}</span>
      </div>
    </div>
  </div>
  <h3 class="market-card-title"><a href="/market/{mp['id']}.html" target="_blank" rel="noopener">{mp['title']}</a></h3>
  <p class="market-card-problem">{mp['problem']}</p>
  <div class="market-card-footer">
    {' '.join(f'<span class="tag">{tool}</span>' for tool in mp.get('tools', []))}
    {tags_html}
    <span class="tag">{mp.get('estimatedMinutes', 0)} 分钟</span>
  </div>
  <a href="/market/{mp['id']}.html" class="btn btn-secondary market-card-cta" target="_blank" rel="noopener">查看完整方案</a>
  <div class="market-card-actions">
    <button type="button" class="js-like" data-id="{mp['id']}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      <span>❤ 点赞 ({mp.get('likes', 0)})</span>
    </button>
    <button type="button" class="js-favorite" data-id="{mp['id']}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
      <span>☆ 收藏 ({mp.get('favorites', 0)})</span>
    </button>
  </div>
</article>'''


def assistant_modal_html():
    return f'''<div class="modal-overlay" id="assistant-modal" aria-hidden="true">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="assistant-modal-title">
    <div class="modal-header">
      <h2 class="modal-title" id="assistant-modal-title">智能方案助手</h2>
      <button type="button" class="modal-close" id="assistant-modal-close" aria-label="关闭">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-grid">
        <div>
          <div class="form-group">
            <label class="form-label">你要解决什么问题？</label>
            <textarea class="form-textarea assistant-textarea" id="assistant-problem" placeholder="例如：每周要把一小时访谈录音整理成周报..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">当前使用场景？</label>
            <input type="text" class="form-input" id="assistant-scenario" placeholder="例如：团队协作、学生研究、内容创作">
          </div>
          <div class="form-group">
            <label class="form-label">预算或成本限制？</label>
            <select class="form-select" id="assistant-budget">
              <option value="free">尽量免费</option>
              <option value="low">低付费（月均 ¥150 以内）</option>
              <option value="medium">中付费（月均 ¥300 以内）</option>
              <option value="high">不敏感，优先效果</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">希望产出什么结果？</label>
            <input type="text" class="form-input" id="assistant-output" placeholder="例如：可直接发送的周报文档">
          </div>
          <button type="button" class="btn btn-signal" id="assistant-generate">生成我的方案</button>
        </div>
        <div class="modal-output" id="assistant-output-panel">
          <div class="modal-output-title">推荐方案</div>
          <p class="text-small" style="color: var(--color-text-secondary);">填写左侧信息并点击生成，即可获得工具组合、提示词和执行步骤。</p>
        </div>
      </div>
    </div>
  </div>
</div>'''


def render_packages(content):
    site = content["site"]
    packages = content.get("packages", [])
    packages_html = "\n".join(package_card(p) for p in packages)

    scenarios = sorted(set(s for p in packages for s in p.get("scenarios", [])))
    tools = sorted(set(t for p in packages for t in p.get("tools", [])))

    scenario_filters = "\n".join(f'<button class="filter-chip" data-filter="scenarios" data-value="{s}">{s}</button>' for s in scenarios)
    cost_filters = '''<button class="filter-chip" data-filter="cost" data-value="free">免费</button>
<button class="filter-chip" data-filter="cost" data-value="low">低付费</button>
<button class="filter-chip" data-filter="cost" data-value="medium">中付费</button>
<button class="filter-chip" data-filter="cost" data-value="high">高付费</button>'''
    tool_filters = "\n".join(f'<button class="filter-chip" data-filter="tools" data-value="{t}">{t}</button>' for t in tools)

    body = f'''<section class="packages-hero">
  <div class="container">
    <div class="packages-layout">
      <div>
        <p class="section-label mb-2" style="color: rgba(247,247,244,0.6);">Packages</p>
        <h1 class="text-display" style="margin-bottom: var(--space-3);">AI 速用包</h1>
        <p class="packages-hero-description">针对具体业务问题的开箱即用 AI 落地包：工具组合选型 + 高质量提示词 + 完整工作流 + 分步执行。</p>
        <div class="hero-actions">
          <button type="button" class="btn btn-signal" id="open-assistant">生成我的方案</button>
          <a href="/market" class="btn btn-secondary" style="border-color: rgba(247,247,244,0.3); color: var(--color-paper);">去方案集市</a>
        </div>
      </div>
      <div class="assistant-panel">
        <div class="assistant-panel-title">智能方案助手</div>
        <p class="assistant-panel-desc">输入你的需求、场景和预算约束，自动生成高性价比的定制解决方案。</p>
        <button type="button" class="btn btn-signal" id="open-assistant-panel" style="width: 100%;">开始生成</button>
      </div>
    </div>
  </div>
</section>

<section class="section-sm">
  <div class="container">
    <div class="tab-nav">
      <a href="/packages" class="tab-link active">官方预制包</a>
      <button type="button" class="tab-link" id="open-assistant-tab">智能方案助手</button>
      <a href="/market" class="tab-link">方案集市</a>
    </div>
    <div class="filters">
      <button class="filter-chip active" data-filter="scenarios" data-value="all" data-group="scene">全部场景</button>
      {scenario_filters}
    </div>
    <div class="filters">
      <button class="filter-chip active" data-filter="cost" data-value="all" data-group="cost">全部成本</button>
      {cost_filters}
    </div>
    <div class="filters">
      <button class="filter-chip active" data-filter="tools" data-value="all" data-group="tools">全部工具</button>
      {tool_filters}
    </div>
    <div class="content-grid content-grid-3" style="margin-top: var(--space-4);">
      {packages_html}
    </div>
    <div id="filter-empty-state" class="text-center mt-4" style="display: none;">
      <p class="text-body">没有符合条件的速用包。</p>
    </div>
  </div>
</section>

{assistant_modal_html()}'''

    return base_layout(site, content["navigation"], "AI 速用包", "针对具体业务问题的开箱即用 AI 落地包。", body, "/packages")


def render_package_detail(content, pkg):
    site = content["site"]
    cost_class = cost_badge_class(pkg.get("costLevel", "medium"))
    scenarios_html = " ".join(f'<span class="tag">{s}</span>' for s in pkg.get("scenarios", []))
    tools_html = " ".join(f'<span class="tag">{tool}</span>' for tool in pkg.get("tools", []))
    audience_html = " ".join(f'<span class="tag">{a}</span>' for a in pkg.get("audience", []))

    sections_html = render_pkg_sections(pkg.get("sections", []))

    body = f'''<section class="package-detail-hero">
  <div class="container content-table">
    <div class="detail-breadcrumb" style="color: rgba(247,247,244,0.6);">
      <a href="/" style="color: rgba(247,247,244,0.6);">首页</a> / <a href="/packages" style="color: rgba(247,247,244,0.6);">AI 速用包</a>
    </div>
    <div class="package-detail-meta">
      <span>{pkg['pkgNumber']}</span>
      <span class="cost-badge {cost_class}">{pkg.get('costLabel', '')}</span>
      <span>{pkg.get('estimatedMinutes', 0)} 分钟</span>
    </div>
    <h1 class="text-display detail-title">{pkg['title']}</h1>
    <p class="package-detail-subtitle">{pkg['problem']} → {pkg['goal']}</p>
    <div class="detail-meta" style="margin-top: var(--space-3);">
      {scenarios_html}
      {tools_html}
      {audience_html}
    </div>
  </div>
</section>

<div class="article-content">
  <div class="container content-table">
    <div class="recommendation-block">
      推荐结论：{pkg['goal']}
    </div>
    {sections_html}
    <div class="mt-4">
      <button type="button" class="btn btn-primary" id="open-assistant-detail">让智能方案助手帮我定制</button>
    </div>
  </div>
</div>

{assistant_modal_html()}'''

    return base_layout(site, content["navigation"], pkg["title"], pkg["problem"], body, "/packages")


def render_market(content):
    site = content["site"]
    market_packages = content.get("marketPackages", [])
    market_html = "\n".join(market_card(mp) for mp in market_packages)

    scenarios = sorted(set(s for p in market_packages for s in p.get("scenarios", [])))
    tools = sorted(set(t for p in market_packages for t in p.get("tools", [])))

    scenario_filters = "\n".join(f'<button class="filter-chip" data-filter="scenarios" data-value="{s}">{s}</button>' for s in scenarios)
    cost_filters = '''<button class="filter-chip" data-filter="cost" data-value="free">免费</button>
<button class="filter-chip" data-filter="cost" data-value="low">低付费</button>
<button class="filter-chip" data-filter="cost" data-value="medium">中付费</button>'''
    tool_filters = "\n".join(f'<button class="filter-chip" data-filter="tools" data-value="{t}">{t}</button>' for t in tools)

    leaderboard_html = "\n".join(
        f'''<div class="leaderboard-item">
  <span class="leaderboard-rank">{i+1}</span>
  <div class="leaderboard-info">
    <div class="leaderboard-name"><a href="/market/{mp['id']}.html" class="link">{mp['title']}</a></div>
    <div class="leaderboard-meta">{mp['author']} · {mp.get('costLabel', '')}</div>
  </div>
  <span class="leaderboard-heat">{mp.get('likes', 0)}</span>
</div>'''
        for i, mp in enumerate(sorted(market_packages, key=lambda x: x.get("likes", 0), reverse=True)[:5])
    )

    body = f'''<header class="archive-header">
  <div class="container">
    <div class="market-header">
      <div>
        <p class="section-label mb-2">Market</p>
        <h1 class="text-display archive-title">方案集市</h1>
        <p class="archive-description">来自真实使用经验的工具组合、提示词、工作流和避雷帖。</p>
      </div>
      <a href="/market/submit.html" class="btn btn-primary">发布我的方案包</a>
    </div>
  </div>
</header>

<section class="section-sm">
  <div class="container">
    <div class="packages-layout">
      <div>
        <div class="filters">
          <button class="filter-chip active" data-filter="scenarios" data-value="all" data-group="scene">全部场景</button>
          {scenario_filters}
        </div>
        <div class="filters">
          <button class="filter-chip active" data-filter="cost" data-value="all" data-group="cost">全部成本</button>
          {cost_filters}
        </div>
        <div class="filters">
          <button class="filter-chip active" data-filter="tools" data-value="all" data-group="tools">全部工具</button>
          {tool_filters}
        </div>
        <div class="content-grid content-grid-3" style="margin-top: var(--space-4);">
          {market_html}
        </div>
        <div id="filter-empty-state" class="text-center mt-4" style="display: none;">
          <p class="text-body">没有符合条件的方案。</p>
        </div>
      </div>
      <aside>
        <div class="leaderboard">
          <div class="leaderboard-title">本周复用榜</div>
          {leaderboard_html}
        </div>
      </aside>
    </div>
  </div>
</section>'''

    return base_layout(site, content["navigation"], "方案集市", "用户分享的可复用 AI 方案市场。", body, "/market")


def render_market_detail(content, mp):
    site = content["site"]
    cost_class = cost_badge_class(mp.get("costLevel", "medium"))
    avatar_initials = "".join([c for c in mp.get("author", "") if "\u4e00" <= c <= "\u9fff"])[-2:] or mp.get("author", "")[:2]
    scenarios_html = " ".join(f'<span class="tag">{s}</span>' for s in mp.get("scenarios", []))
    tools_html = " ".join(f'<span class="tag">{tool}</span>' for tool in mp.get("tools", []))
    audience_html = " ".join(f'<span class="tag">{a}</span>' for a in mp.get("audience", []))

    sections_html = render_pkg_sections(mp.get("sections", []))

    body = f'''<article class="detail-header">
  <div class="container content-table">
    <div class="detail-breadcrumb">
      <a href="/">首页</a> / <a href="/market">方案集市</a>
    </div>
    <div class="market-card-header mb-3">
      <div class="market-card-avatar">{avatar_initials}</div>
      <div>
        <div class="market-card-author">{mp['author']} · {mp.get('authorTitle', '')}</div>
        <div class="metadata-row">
          <span>{mp.get('publishedAt', '')}</span>
          <span class="cost-badge {cost_class}">{mp.get('costLabel', '')}</span>
          <span>{mp.get('estimatedMinutes', 0)} 分钟</span>
        </div>
      </div>
    </div>
    <h1 class="text-display detail-title">{mp['title']}</h1>
    <p class="detail-summary">{mp['problem']}</p>
    <div class="detail-meta">
      {scenarios_html}
      {tools_html}
      {audience_html}
    </div>
  </div>
</article>

<div class="article-content">
  <div class="container content-table">
    {sections_html}
    <div class="market-card-actions mt-4">
      <button type="button" class="btn btn-primary js-like" data-id="{mp['id']}">❤ 点赞 ({mp.get('likes', 0)})</button>
      <button type="button" class="btn btn-secondary js-favorite" data-id="{mp['id']}">☆ 收藏 ({mp.get('favorites', 0)})</button>
    </div>
  </div>
</div>'''

    return base_layout(site, content["navigation"], mp["title"], mp["problem"], body, "/market")


def render_market_submit(content):
    site = content["site"]
    scenarios = sorted(set(s for p in content.get("marketPackages", []) for s in p.get("scenarios", [])))
    scenario_options = "\n".join(f'<option value="{s}">{s}</option>' for s in scenarios)
    tools = sorted(set(t for p in content.get("packages", []) for t in p.get("tools", [])))
    tools += sorted(set(t for p in content.get("marketPackages", []) for t in p.get("tools", [])))
    tool_options = "\n".join(f'<option value="{t}">{t}</option>' for t in sorted(set(tools)))

    body = f'''<header class="archive-header">
  <div class="container">
    <p class="section-label mb-2">Submit</p>
    <h1 class="text-display archive-title">发布我的方案包</h1>
    <p class="archive-description">把你的实战经验沉淀成可复用资产。提交后需经审核，通过后在方案集市展示。</p>
  </div>
</header>

<section class="section">
  <div class="container content-narrow">
    <form id="market-submit-form" onsubmit="return false;">
      <div class="form-group">
        <label class="form-label">方案包名称</label>
        <input type="text" class="form-input" placeholder="例如：客户访谈跟进方案" required>
      </div>
      <div class="form-group">
        <label class="form-label">解决什么问题</label>
        <textarea class="form-textarea" placeholder="描述具体业务场景和痛点" required></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">适用人群</label>
        <input type="text" class="form-input" placeholder="例如：销售、客户成功">
      </div>
      <div class="form-group">
        <label class="form-label">使用工具</label>
        <select class="form-select" multiple>
          {tool_options}
        </select>
        <p class="form-hint">按住 Ctrl/Cmd 可多选</p>
      </div>
      <div class="form-group">
        <label class="form-label">高质量提示词</label>
        <textarea class="form-textarea" placeholder="粘贴你验证过的提示词" required></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">详细工作流与执行步骤</label>
        <textarea class="form-textarea" placeholder="按步骤描述操作流程" required></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">成本说明</label>
        <input type="text" class="form-input" placeholder="例如：免费、低付费">
      </div>
      <div class="form-group">
        <label class="form-label">避雷经验</label>
        <textarea class="form-textarea" placeholder="分享踩过的坑和注意事项"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">参考链接</label>
        <input type="url" class="form-input" placeholder="https://">
      </div>
      <button type="submit" class="btn btn-primary">提交审核</button>
    </form>
  </div>
</section>'''

    return base_layout(site, content["navigation"], "发布方案包", "把你的实战经验沉淀成可复用资产。", body, "/market")


def generate_search_index(content):
    items = []
    for review in content["reviews"]:
        items.append({
            "title": review["title"],
            "summary": review["summary"],
            "url": f"/reviews/{review['id']}.html",
            "type": "评测",
            "date": review.get("updatedAt"),
            "tags": review.get("tags", []),
            "scenarios": review.get("scenarios", []),
        })
    for guide in content["guides"]:
        items.append({
            "title": guide["title"],
            "summary": guide["summary"],
            "url": f"/guides/{guide['id']}.html",
            "type": "方案",
            "date": guide.get("updatedAt"),
            "tags": guide.get("tags", []),
            "scenarios": guide.get("scenarios", []),
        })
    for tool in content["tools"]:
        items.append({
            "title": tool["name"],
            "summary": tool["shortDescription"],
            "url": f"/library/{tool['id']}.html",
            "type": "工具",
            "date": tool.get("lastVerifiedAt"),
            "tags": tool.get("categories", []),
            "scenarios": tool.get("useCases", []),
        })
    for pkg in content.get("packages", []):
        items.append({
            "title": pkg["title"],
            "summary": pkg["problem"],
            "url": f"/packages/{pkg['id']}.html",
            "type": "速用包",
            "date": None,
            "tags": pkg.get("tags", []),
            "scenarios": pkg.get("scenarios", []),
        })
    for mp in content.get("marketPackages", []):
        items.append({
            "title": mp["title"],
            "summary": mp["problem"],
            "url": f"/market/{mp['id']}.html",
            "type": "集市方案",
            "date": mp.get("publishedAt"),
            "tags": mp.get("tags", []),
            "scenarios": mp.get("scenarios", []),
        })
    return items


def generate_assistant_scenarios(content):
    return [
        {
            "keywords": s["keywords"],
            "title": s["title"],
            "recommendation": s["recommendation"],
            "tools": s["tools"],
            "prompt": s["prompt"],
            "workflow": s["workflow"],
            "costEstimate": s["costEstimate"],
            "risks": s["risks"],
            "fallback": s["fallback"]
        }
        for s in content.get("assistantScenarios", [])
    ]


def write_file(path, html):
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)


def main():
    content = load_content()
    ensure_dirs()
    copy_assets()

    write_file(OUTPUT_DIR / "index.html", render_home(content))
    write_file(OUTPUT_DIR / "reviews" / "index.html", render_reviews_archive(content))
    write_file(OUTPUT_DIR / "guides" / "index.html", render_guides_archive(content))
    write_file(OUTPUT_DIR / "packages" / "index.html", render_packages(content))
    write_file(OUTPUT_DIR / "market" / "index.html", render_market(content))
    write_file(OUTPUT_DIR / "market" / "submit.html", render_market_submit(content))
    write_file(OUTPUT_DIR / "library" / "index.html", render_library(content))
    write_file(OUTPUT_DIR / "compare" / "index.html", render_compare(content))
    write_file(OUTPUT_DIR / "about" / "index.html", render_about(content))
    write_file(OUTPUT_DIR / "search" / "index.html", render_search(content))

    for review in content["reviews"]:
        write_file(OUTPUT_DIR / "reviews" / f"{review['id']}.html", render_review_detail(content, review))

    for guide in content["guides"]:
        write_file(OUTPUT_DIR / "guides" / f"{guide['id']}.html", render_guide_detail(content, guide))

    for pkg in content.get("packages", []):
        write_file(OUTPUT_DIR / "packages" / f"{pkg['id']}.html", render_package_detail(content, pkg))

    for mp in content.get("marketPackages", []):
        write_file(OUTPUT_DIR / "market" / f"{mp['id']}.html", render_market_detail(content, mp))

    for tool in content["tools"]:
        write_file(OUTPUT_DIR / "library" / f"{tool['id']}.html", render_tool_detail(content, tool))

    search_index = generate_search_index(content)
    with open(OUTPUT_DIR / "data" / "search-index.json", "w", encoding="utf-8") as f:
        json.dump(search_index, f, ensure_ascii=False, indent=2)

    assistant_scenarios = generate_assistant_scenarios(content)
    with open(OUTPUT_DIR / "data" / "assistant-scenarios.json", "w", encoding="utf-8") as f:
        json.dump(assistant_scenarios, f, ensure_ascii=False, indent=2)

    print(f"Generated site in {OUTPUT_DIR}")
    print(f"  Pages: {len(list(OUTPUT_DIR.glob('**/*.html')))}")
    print(f"  Search index: {len(search_index)} items")


if __name__ == "__main__":
    main()

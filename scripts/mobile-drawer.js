/**
 * Swipe Symbaroum - Mobile Drawer
 * Slide-up drawer for mobile character sheet interaction
 */

import { DetailsSection } from './sections/details-section.js';
import { CombatSection } from './sections/combat-section.js';
import { PowersSection } from './sections/powers-section.js';
import { InventorySection } from './sections/inventory-section.js';

const i18n = (key) => game.i18n.localize(key);

export class SymbaroumMobileDrawer {
  static instance = null;

  static init() {
    if (!SymbaroumMobileDrawer.instance) {
      SymbaroumMobileDrawer.instance = new SymbaroumMobileDrawer();
    }
    return SymbaroumMobileDrawer.instance;
  }

  constructor() {
    this.actor = null;
    this.isOpen = false;
    this.currentTabIndex = 0;
    this.sections = [];

    // Touch state
    this._touchStartY = 0;
    this._touchCurrentY = 0;
    this._isDragging = false;

    this._buildDOM();
  }

  // ─── DOM Construction ──────────────────────────────────────────────────────

  _buildDOM() {
    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'ssym-backdrop';
    this.backdrop.addEventListener('click', () => this.close());

    // Drawer container
    this.drawer = document.createElement('div');
    this.drawer.className = 'ssym-drawer';

    // Handle
    const handle = document.createElement('div');
    handle.className = 'ssym-handle';
    handle.innerHTML = '<div class="ssym-handle-bar"></div>';
    this._bindHandleDrag(handle);

    // Header
    this.headerEl = document.createElement('div');
    this.headerEl.className = 'ssym-header';

    // Tabs
    this.tabsEl = document.createElement('div');
    this.tabsEl.className = 'ssym-tabs';

    // Sections container
    this.sectionsEl = document.createElement('div');
    this.sectionsEl.className = 'ssym-sections';

    // Assemble
    this.drawer.appendChild(handle);
    this.drawer.appendChild(this.headerEl);
    this.drawer.appendChild(this.tabsEl);
    this.drawer.appendChild(this.sectionsEl);

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.drawer);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  open(actor) {
    if (!actor) return;

    this.actor = actor;
    this.sections = [
      new DetailsSection(actor, this),
      new CombatSection(actor, this),
      new PowersSection(actor, this),
      new InventorySection(actor, this)
    ];

    this._renderHeader();
    this._renderTabs();
    this._switchTab(this.currentTabIndex);

    requestAnimationFrame(() => {
      this.backdrop.classList.add('open');
      this.drawer.classList.add('open');
      this.isOpen = true;
    });
  }

  close() {
    this.backdrop.classList.remove('open');
    this.drawer.classList.remove('open');
    this.isOpen = false;
    this.drawer.style.transform = '';
  }

  refresh(changes) {
    if (!this.actor || !this.isOpen) return;

    // Always refresh header (HP/corruption might have changed)
    this._renderHeader();

    // Re-render current section if structural changes occurred
    const isStructural = changes?.items || changes?.system?.attributes;
    if (isStructural) {
      this.renderCurrentSection();
    }
  }

  renderCurrentSection() {
    const section = this.sections[this.currentTabIndex];
    if (section) {
      // Update actor reference in case it changed
      section.actor = this.actor;
      section.render(this.sectionsEl);
    }
  }

  // ─── Header ────────────────────────────────────────────────────────────────

  _renderHeader() {
    const a = this.actor;
    const sys = a.system;

    // Toughness calculations
    const tVal = Number(sys.health?.toughness?.value ?? 0);
    const tMax = Math.max(1, Number(sys.health?.toughness?.max ?? 1));
    const tThreshold = Number(sys.health?.toughness?.threshold ?? Math.ceil(tMax / 2));
    const tPct = Math.min(100, Math.max(0, (tVal / tMax) * 100));
    const tThreshPct = Math.min(100, (tThreshold / tMax) * 100);

    // Corruption calculations
    const cTemp = Number(sys.health?.corruption?.temporary ?? 0);
    const cPerm = Number(sys.health?.corruption?.permanent ?? 0);
    const cLong = Number(sys.health?.corruption?.longterm ?? 0);
    const cVal = cTemp + cPerm + cLong;
    const cThreshold = Number(sys.health?.corruption?.threshold ?? 1);
    const cMax = Math.max(1, Number(sys.health?.corruption?.max ?? 1));
    const cPct = Math.min(100, Math.max(0, (cVal / cMax) * 100));

    // Toughness bar color based on percentage
    let tColor = '#4CAF50'; // Green
    if (tPct < 50) tColor = '#FF9800'; // Orange
    if (tPct < 25) tColor = '#F44336'; // Red

    this.headerEl.innerHTML = `
      <div class="ssym-header-top">
        <div class="ssym-avatar-wrap">
          <img class="ssym-avatar" src="${a.img}" alt="${a.name}" />
        </div>
        <div class="ssym-info">
          <div class="ssym-name">${a.name}</div>
          <div class="ssym-badges">
            ${sys.bio?.race ? `<span class="ssym-badge">${sys.bio.race}</span>` : ''}
            ${sys.bio?.occupation ? `<span class="ssym-badge">${sys.bio.occupation}</span>` : ''}
            ${sys.bio?.shadow ? `<span class="ssym-badge ssym-badge-shadow" title="${i18n('SWIPE_SYM.Shadow')}"><i class="fas fa-moon"></i> ${sys.bio.shadow}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="ssym-bars">
        <div class="ssym-bar-group" data-action="edit-toughness">
          <div class="ssym-bar-label">
            <span class="ssym-bar-title"><i class="fas fa-heart"></i> ${i18n('SWIPE_SYM.Toughness')}</span>
            <span class="ssym-bar-threshold-badge" title="${i18n('SWIPE_SYM.PainThreshold')}">◆ Limiar: <strong>${tThreshold}</strong></span>
            <span class="ssym-bar-value">${tVal} / ${tMax}</span>
          </div>
          <div class="ssym-bar-track">
            <div class="ssym-bar-fill ssym-toughness-fill" style="width: ${tPct}%; background: ${tColor};"></div>
            <div class="ssym-threshold-marker" style="left: ${tThreshPct}%;" title="${i18n('SWIPE_SYM.PainThreshold')}: ${tThreshold}"></div>
          </div>
        </div>

        <div class="ssym-bar-group" data-action="edit-corruption">
          <div class="ssym-bar-label">
            <span class="ssym-bar-title"><i class="fas fa-skull"></i> ${i18n('SWIPE_SYM.Corruption')}</span>
            <span class="ssym-bar-threshold-badge" title="${i18n('SWIPE_SYM.CorruptionThreshold')}">◆ Limiar: <strong>${cThreshold}</strong></span>
            <span class="ssym-bar-value">${cVal} / ${cMax}</span>
          </div>
          <div class="ssym-bar-track">
            <div class="ssym-bar-fill ssym-corruption-fill" style="width: ${cPct}%;"></div>
            ${cPct >= (cThreshold / cMax * 100) ? '<div class="ssym-bar-warning"></div>' : ''}
          </div>
          <div class="ssym-corruption-detail">
            <span>${i18n('SWIPE_SYM.Temporary')}: ${cTemp}</span>
            <span>${i18n('SWIPE_SYM.Longterm')}: ${cLong}</span>
            <span>${i18n('SWIPE_SYM.Permanent')}: ${cPerm}</span>
          </div>
        </div>
      </div>
    `;

    // Bind toughness edit
    this.headerEl.querySelector('[data-action="edit-toughness"]')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openToughnessDialog();
      });

    // Bind corruption edit
    this.headerEl.querySelector('[data-action="edit-corruption"]')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openCorruptionDialog();
      });
  }

  // ─── Tabs ──────────────────────────────────────────────────────────────────

  _renderTabs() {
    this.tabsEl.innerHTML = '';

    this.sections.forEach((section, index) => {
      const btn = document.createElement('button');
      btn.className = 'ssym-tab' + (index === this.currentTabIndex ? ' active' : '');
      btn.innerHTML = `<i class="${section.icon}"></i><span>${section.label}</span>`;
      btn.addEventListener('click', () => this._switchTab(index));
      this.tabsEl.appendChild(btn);
    });
  }

  _switchTab(index) {
    this.currentTabIndex = index;

    // Update tab active state
    this.tabsEl.querySelectorAll('.ssym-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });

    // Render section
    this.renderCurrentSection();
  }

  // ─── Handle Drag ───────────────────────────────────────────────────────────

  _bindHandleDrag(handle) {
    handle.addEventListener('touchstart', (e) => {
      this._touchStartY = e.touches[0].clientY;
      this._isDragging = true;
      this.drawer.style.transition = 'none';
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
      if (!this._isDragging) return;
      this._touchCurrentY = e.touches[0].clientY;
      const deltaY = this._touchCurrentY - this._touchStartY;

      // Only allow dragging down
      if (deltaY > 0) {
        this.drawer.style.transform = `translateY(${deltaY}px)`;
      }
    }, { passive: true });

    handle.addEventListener('touchend', () => {
      this._isDragging = false;
      this.drawer.style.transition = '';
      const deltaY = this._touchCurrentY - this._touchStartY;

      if (deltaY > 100) {
        // Swiped down enough — close
        this.close();
      } else {
        // Snap back
        this.drawer.style.transform = '';
      }
      this._touchStartY = 0;
      this._touchCurrentY = 0;
    }, { passive: true });
  }

  // ─── Dialogs ───────────────────────────────────────────────────────────────

  _openToughnessDialog() {
    const currentVal = Number(this.actor.system.health?.toughness?.value ?? 0);
    const maxVal = Number(this.actor.system.health?.toughness?.max ?? 0);

    const content = `
      <div class="ssym-dialog">
        <div class="ssym-dialog-current">
          ${i18n('SWIPE_SYM.Toughness')}: <strong>${currentVal}</strong> / ${maxVal}
        </div>
        <div class="ssym-dialog-buttons">
          <button type="button" class="ssym-delta-btn" data-delta="-5">-5</button>
          <button type="button" class="ssym-delta-btn" data-delta="-1">-1</button>
          <button type="button" class="ssym-delta-btn ssym-delta-pos" data-delta="+1">+1</button>
          <button type="button" class="ssym-delta-btn ssym-delta-pos" data-delta="+5">+5</button>
        </div>
        <div class="ssym-dialog-input">
          <label>Set to:</label>
          <input type="number" id="ssym-tough-val" value="${currentVal}" min="0" max="${maxVal}" />
        </div>
      </div>
    `;

    new Dialog({
      title: `${this.actor.name}: ${i18n('SWIPE_SYM.EditToughness')}`,
      content,
      buttons: {
        apply: {
          icon: '<i class="fas fa-check"></i>',
          label: i18n('SWIPE_SYM.Apply'),
          callback: (html) => {
            const val = Math.max(0, Math.min(maxVal, Number(html.find('#ssym-tough-val').val())));
            this.actor.update({ 'system.health.toughness.value': val });
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: i18n('SWIPE_SYM.Close')
        }
      },
      default: 'apply',
      render: (html) => {
        const win = html[0]?.closest('.window-app') || html[0]?.closest('dialog') || html[0]?.parentElement;
        if (win) {
          win.style.zIndex = '10020';
        }
        html.find('.ssym-delta-btn').on('click', (e) => {
          const delta = Number(e.currentTarget.dataset.delta);
          const input = html.find('#ssym-tough-val');
          const newVal = Math.max(0, Math.min(maxVal, Number(input.val()) + delta));
          input.val(newVal);
        });
      }
    }).render(true);
  }

  _openCorruptionDialog() {
    const corr = this.actor.system.health?.corruption ?? {};
    const temp = Number(corr.temporary ?? 0);
    const perm = Number(corr.permanent ?? 0);
    const longterm = Number(corr.longterm ?? 0);

    const content = `
      <div class="ssym-dialog">
        <div class="ssym-dialog-current">
          ${i18n('SWIPE_SYM.Corruption')}: <strong>${temp + perm + longterm}</strong> / ${corr.max ?? 0}
        </div>
        <div class="ssym-dialog-grid">
          <div class="ssym-dialog-field">
            <label>${i18n('SWIPE_SYM.Temporary')}</label>
            <div class="ssym-dialog-buttons-sm">
              <button type="button" class="ssym-delta-btn" data-target="temp" data-delta="-1">-1</button>
              <input type="number" id="ssym-corr-temp" value="${temp}" min="0" />
              <button type="button" class="ssym-delta-btn ssym-delta-pos" data-target="temp" data-delta="+1">+1</button>
            </div>
          </div>
          <div class="ssym-dialog-field">
            <label>${i18n('SWIPE_SYM.Longterm')}</label>
            <div class="ssym-dialog-buttons-sm">
              <button type="button" class="ssym-delta-btn" data-target="long" data-delta="-1">-1</button>
              <input type="number" id="ssym-corr-long" value="${longterm}" min="0" />
              <button type="button" class="ssym-delta-btn ssym-delta-pos" data-target="long" data-delta="+1">+1</button>
            </div>
          </div>
          <div class="ssym-dialog-field">
            <label>${i18n('SWIPE_SYM.Permanent')}</label>
            <div class="ssym-dialog-buttons-sm">
              <button type="button" class="ssym-delta-btn" data-target="perm" data-delta="-1">-1</button>
              <input type="number" id="ssym-corr-perm" value="${perm}" min="0" />
              <button type="button" class="ssym-delta-btn ssym-delta-pos" data-target="perm" data-delta="+1">+1</button>
            </div>
          </div>
        </div>
      </div>
    `;

    new Dialog({
      title: `${this.actor.name}: ${i18n('SWIPE_SYM.EditCorruption')}`,
      content,
      buttons: {
        apply: {
          icon: '<i class="fas fa-check"></i>',
          label: i18n('SWIPE_SYM.Apply'),
          callback: (html) => {
            this.actor.update({
              'system.health.corruption.temporary': Math.max(0, Number(html.find('#ssym-corr-temp').val())),
              'system.health.corruption.longterm': Math.max(0, Number(html.find('#ssym-corr-long').val())),
              'system.health.corruption.permanent': Math.max(0, Number(html.find('#ssym-corr-perm').val()))
            });
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: i18n('SWIPE_SYM.Close')
        }
      },
      default: 'apply',
      render: (html) => {
        const win = html[0]?.closest('.window-app') || html[0]?.closest('dialog') || html[0]?.parentElement;
        if (win) {
          win.style.zIndex = '10020';
        }
        html.find('.ssym-delta-btn').on('click', (e) => {
          const delta = Number(e.currentTarget.dataset.delta);
          const target = e.currentTarget.dataset.target;
          const inputId = target === 'temp' ? '#ssym-corr-temp' : target === 'long' ? '#ssym-corr-long' : '#ssym-corr-perm';
          const input = html.find(inputId);
          input.val(Math.max(0, Number(input.val()) + delta));
        });
      }
    }).render(true);
  }
}

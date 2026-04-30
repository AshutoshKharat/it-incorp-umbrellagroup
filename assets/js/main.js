/**
 * main.js
 * Thinkbix — lightweight JS for UI interactions
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── THEME TOGGLE ────────────────────────────────────────────
    const html      = document.documentElement;
    const toggleBtn = document.getElementById('themeToggle');

    // Sync button state with whatever the inline script already applied
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    // Ensure attribute is set (fallback if inline script missed)
    if (!html.hasAttribute('data-theme')) {
        const saved = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        html.setAttribute('data-theme', saved);
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }

    // ── DISABLE RIGHT-CLICK + COPY ────────────────────────────────
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('copy',        function (e) { e.preventDefault(); });
    document.addEventListener('cut',         function (e) { e.preventDefault(); });
    document.addEventListener('selectstart', function (e) { e.preventDefault(); });
    document.addEventListener('dragstart',   function (e) { e.preventDefault(); });

    // ── MOBILE NAV CLOSE ────────────────────────────────────────
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link:not(.dropdown-toggle)');
    const navCollapse = document.getElementById('mainNav');

    if (navCollapse) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                if (bsCollapse) bsCollapse.hide();
            });
        });
    }

    // ── DESKTOP DROPDOWN HOVER + PROXIMITY ─────────────────────
    const desktopNavMedia = window.matchMedia('(min-width: 992px)');
    const navbarDropdownItems = document.querySelectorAll('#mainNav .navbar-nav .nav-item.dropdown');

    if (navbarDropdownItems.length) {
        let pointerX = -1;
        let pointerY = -1;
        const closeTimers = new WeakMap();

        const clearCloseTimer = (item) => {
            const timerId = closeTimers.get(item);
            if (timerId) {
                clearTimeout(timerId);
                closeTimers.delete(item);
            }
        };

        const getInteractiveRect = (item) => {
            const toggle = item.querySelector(':scope > .dropdown-toggle');
            const menu = item.querySelector(':scope > .dropdown-menu');
            if (!toggle || !menu) return null;

            const toggleRect = toggle.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();
            const proximityPadding = 26;

            return {
                left: Math.min(toggleRect.left, menuRect.left) - proximityPadding,
                right: Math.max(toggleRect.right, menuRect.right) + proximityPadding,
                top: Math.min(toggleRect.top, menuRect.top) - proximityPadding,
                bottom: Math.max(toggleRect.bottom, menuRect.bottom) + proximityPadding
            };
        };

        const isPointerNearDropdown = (item) => {
            if (pointerX < 0 || pointerY < 0) return false;

            const bounds = getInteractiveRect(item);
            if (!bounds) return false;

            return (
                pointerX >= bounds.left &&
                pointerX <= bounds.right &&
                pointerY >= bounds.top &&
                pointerY <= bounds.bottom
            );
        };

        const hideDropdown = (item) => {
            const toggle = item.querySelector(':scope > .dropdown-toggle');
            if (!toggle) return;

            const dropdown = bootstrap.Dropdown.getOrCreateInstance(toggle);
            dropdown.hide();
        };

        const showDropdown = (item) => {
            if (!desktopNavMedia.matches) return;

            const toggle = item.querySelector(':scope > .dropdown-toggle');
            if (!toggle) return;

            navbarDropdownItems.forEach((otherItem) => {
                if (otherItem !== item) {
                    clearCloseTimer(otherItem);
                    hideDropdown(otherItem);
                }
            });

            clearCloseTimer(item);
            const dropdown = bootstrap.Dropdown.getOrCreateInstance(toggle);
            dropdown.show();
        };

        const scheduleHideDropdown = (item) => {
            clearCloseTimer(item);

            const timerId = window.setTimeout(() => {
                if (!desktopNavMedia.matches) return;

                if (isPointerNearDropdown(item)) {
                    scheduleHideDropdown(item);
                    return;
                }

                hideDropdown(item);
            }, 140);

            closeTimers.set(item, timerId);
        };

        document.addEventListener('pointermove', (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;
        }, { passive: true });

        navbarDropdownItems.forEach((item) => {
            const toggle = item.querySelector(':scope > .dropdown-toggle');
            const menu = item.querySelector(':scope > .dropdown-menu');
            if (!toggle || !menu) return;

            item.addEventListener('mouseenter', () => {
                showDropdown(item);
            });

            item.addEventListener('mouseleave', () => {
                scheduleHideDropdown(item);
            });

            menu.addEventListener('mouseenter', () => {
                clearCloseTimer(item);
                showDropdown(item);
            });

            menu.addEventListener('mouseleave', () => {
                scheduleHideDropdown(item);
            });
        });

        desktopNavMedia.addEventListener('change', (event) => {
            if (event.matches) return;

            navbarDropdownItems.forEach((item) => {
                clearCloseTimer(item);
                hideDropdown(item);
            });
        });
    }

    // ── SUBSIDIARY DROPDOWN TABS ───────────────────────────────
    const subsidiaryDropdown = document.querySelector('.subsidiary-dropdown');
    const subsidiaryToggle = document.querySelector('.dropdown-mega > .dropdown-toggle');
    const subsidiaryParent = subsidiaryToggle ? subsidiaryToggle.closest('.dropdown') : null;

    // Reset accidental persisted/open state on refresh.
    if (subsidiaryDropdown && subsidiaryToggle && subsidiaryParent) {
        subsidiaryDropdown.classList.remove('show');
        subsidiaryParent.classList.remove('show');
        subsidiaryToggle.setAttribute('aria-expanded', 'false');
    }

    if (subsidiaryDropdown) {
        const tabs = subsidiaryDropdown.querySelectorAll('.subsidiary-tab');
        const panels = subsidiaryDropdown.querySelectorAll('.subsidiary-panel');

        const collapsePanelAccordions = (panel) => {
            if (!panel) return;

            const collapses = panel.querySelectorAll('.accordion-collapse');
            collapses.forEach((collapseEl) => {
                const collapse = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
                collapse.hide();
            });
        };

        const activateSubsidiaryPanel = (targetKey) => {
            let activePanel = null;

            tabs.forEach((tab) => {
                const isTarget = tab.dataset.subsidiaryTarget === targetKey;
                tab.classList.toggle('is-active', isTarget);
                tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
            });

            panels.forEach((panel) => {
                const isTargetPanel = panel.dataset.subsidiaryPanel === targetKey;
                panel.classList.toggle('is-active', isTargetPanel);
                if (isTargetPanel) activePanel = panel;
            });

            // Reset accordion state on panel switch; user opens desired group manually.
            collapsePanelAccordions(activePanel);
        };

        // Keep mega dropdown open while user interacts with internal tab panel.
        subsidiaryDropdown.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        tabs.forEach((tab) => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                activateSubsidiaryPanel(tab.dataset.subsidiaryTarget);
            });
        });
    }

    // Subtle scroll-in animation for service cards
    if ('IntersectionObserver' in window) {
        const cards = document.querySelectorAll('.service-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(24px)';
            card.style.transition = `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`;
            observer.observe(card);
        });
    }

});

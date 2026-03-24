// Core JavaScript for the portfolio UI
document.addEventListener("DOMContentLoaded", () => {

    // Dynamic navbar styling when scrolling
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = '1rem 5%';
            navbar.style.background = 'rgba(5, 8, 14, 0.9)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        } else {
            navbar.style.padding = '1.5rem 5%';
            navbar.style.background = 'rgba(5, 8, 14, 0.7)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Smooth scrolling for navigation anchors
    document.querySelectorAll('.navbar a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
            }
        });
    });

    // Close modal with Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => {
                m.classList.remove('active');
            });
            document.body.style.overflow = '';
        }
    });

    // -----------------------------------------------------------------------
    // Dynamic Portfolio Rendering
    // Fetches data/projects.json and builds cards, modals, and nav dropdown.
    // NOTE: This requires serving the page via a local HTTP server (not file://)
    //       because browsers block fetch() on local file:// URLs.
    //       Use: python -m http.server 8080
    // -----------------------------------------------------------------------
    fetch('data/projects.json')
        .then(res => {
            if (!res.ok) throw new Error(`Could not load projects.json: ${res.status}`);
            return res.json();
        })
        .then(projects => {
            renderPortfolio(projects);
        })
        .catch(err => {
            console.error('[Portfolio Agent] Failed to load project data:', err);
        });
});

// ---------------------------------------------------------------------------
// Rendering Functions
// ---------------------------------------------------------------------------

/**
 * Orchestrates rendering of all portfolio elements from the projects array.
 * @param {Array} projects - Array of project objects from projects.json
 */
function renderPortfolio(projects) {
    renderCards(projects);
    renderModals(projects);
    renderNavDropdown(projects);
    initDynamicInteractions();
}

/**
 * Renders portfolio cards into the #portfolio-grid-container element.
 */
function renderCards(projects) {
    const grid = document.getElementById('portfolio-grid-container');
    if (!grid) return;

    grid.innerHTML = projects.map(p => {
        const tagsHtml = p.tags.map(t => `<span class="tech-tag">${escHtml(t)}</span>`).join(' ');
        return `
        <div class="portfolio-card glass-panel reveal"
             onclick="openModal('${escHtml(p.id)}')"
             role="button"
             tabindex="0"
             id="card-${escHtml(p.id)}">
            <div class="portfolio-content">
                <h3><i class="${escHtml(p.icon)}"></i> ${escHtml(p.title)}</h3>
                <p>${escHtml(p.shortDescription)}</p>
                <div class="card-footer-row">
                    <span>${tagsHtml}</span>
                    <span class="card-cta">View Details <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        </div>`;
    }).join('');
}

/**
 * Renders modal overlays for each project into the #modals-container element.
 */
function renderModals(projects) {
    const container = document.getElementById('modals-container');
    if (!container) return;

    container.innerHTML = projects.map(p => {
        const modalTagsHtml = p.modalTags.map(t => `<span class="tech-tag">${escHtml(t)}</span>`).join('');
        const featuresHtml = p.features.map(f =>
            `<li><i class="fas fa-check-circle"></i> ${escHtml(f)}</li>`
        ).join('');

        const mediaHtml = p.screenshotUrl
            ? `<img src="${escHtml(p.screenshotUrl)}" alt="${escHtml(p.title)} preview" class="modal-screenshot" />`
            : `<div class="modal-video-placeholder">
                <div class="video-placeholder-inner">
                    <i class="fas fa-play-circle"></i>
                    <span>Demo coming soon</span>
                    <small>Screenshot or recording will appear here</small>
                </div>
               </div>`;

        return `
        <div id="${escHtml(p.id)}" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="${escHtml(p.id)}-title">
            <div class="modal-box glass-panel">
                <button class="modal-close" onclick="closeModal('${escHtml(p.id)}')" aria-label="Close">&times;</button>
                <div class="modal-header">
                    <span class="modal-icon"><i class="${escHtml(p.icon)}"></i></span>
                    <div>
                        <h2 id="${escHtml(p.id)}-title">${escHtml(p.title)}</h2>
                        <div class="modal-tags">${modalTagsHtml}</div>
                    </div>
                </div>
                <div class="modal-media">${mediaHtml}</div>
                <div class="modal-body">
                    <p class="modal-description">${escHtml(p.fullDescription)}</p>
                    <h4>Key Features</h4>
                    <ul class="modal-features">${featuresHtml}</ul>
                    <div class="modal-actions">
                        <a href="${escHtml(p.githubUrl)}" target="_blank" class="btn-primary">
                            <i class="fab fa-github"></i> View on GitHub
                        </a>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

/**
 * Populates the Portfolio nav dropdown with links that open modals.
 */
function renderNavDropdown(projects) {
    const dropdown = document.getElementById('nav-portfolio-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = projects.map(p => `
        <li>
            <a href="#" onclick="openModal('${escHtml(p.id)}'); return false;">
                <i class="${escHtml(p.icon)}"></i> ${escHtml(p.navLabel)}
            </a>
        </li>`
    ).join('');
}

/**
 * Attaches event listeners that require the dynamic content to exist in the DOM first.
 * Must be called AFTER renderCards and renderModals.
 */
function initDynamicInteractions() {
    // Run Intersection Observer on newly added .reveal elements
    const revealOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, revealOptions);

    document.querySelectorAll('.reveal:not(.active)').forEach(el => revealObserver.observe(el));

    // Close modal when clicking the backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Keyboard accessibility for portfolio cards (Enter or Space opens modal)
    document.querySelectorAll('.portfolio-card[role="button"]').forEach(card => {
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

// ---------------------------------------------------------------------------
// Global modal functions (called from onclick attributes in rendered HTML)
// ---------------------------------------------------------------------------

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    const portfolioSection = document.getElementById('portfolio');
    if (portfolioSection) {
        window.scrollTo({ top: portfolioSection.offsetTop - 80, behavior: 'smooth' });
    }

    setTimeout(() => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }, 200);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Escapes HTML special characters to prevent XSS when injecting text into the DOM.
 */
function escHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Core JavaScript for the portfolio UI
document.addEventListener("DOMContentLoaded", () => {
    
    // Smooth scrolling for navigation anchors
    document.querySelectorAll('.navbar a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            // Close any open modal first
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                window.scrollTo({
                    top: target.offsetTop - 80, // Accounts for sticky navbar
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer to trigger scroll-in animations
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    };

    const revealOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

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

    // Close modal when clicking the backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
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

    // Keyboard accessibility for portfolio cards (Enter key opens modal)
    document.querySelectorAll('.portfolio-card[role="button"]').forEach(card => {
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
});

// Global modal functions (called from onclick attributes)
function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    // Scroll to portfolio section first (smooth), then open modal
    const portfolioSection = document.getElementById('portfolio');
    if (portfolioSection) {
        window.scrollTo({ top: portfolioSection.offsetTop - 80, behavior: 'smooth' });
    }

    // Small delay so the scroll starts before the modal locks scrolling
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

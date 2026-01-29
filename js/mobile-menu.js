// ============================================
// MOBILE MENU - VIEWPORT-AWARE IMPLEMENTATION
// ============================================
// This script only affects mobile viewports (<= 768px)
// Desktop functionality remains completely untouched

(function () {
    'use strict';

    console.log('📱 Mobile menu script loaded');

    // Only initialize on mobile viewports
    function isMobile() {
        return window.innerWidth <= 768;
    }

    function initMobileMenu() {
        if (!isMobile()) {
            console.log('Desktop viewport detected - mobile menu disabled');
            return;
        }

        console.log('Mobile viewport detected - initializing mobile menu');

        // Get elements
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.querySelector('.sidebar-overlay');
        const navItems = document.querySelectorAll('.nav-item');

        console.log('Elements found:', {
            btn: !!mobileMenuBtn,
            sidebar: !!sidebar,
            overlay: !!sidebarOverlay,
            navItems: navItems.length
        });

        if (!mobileMenuBtn || !sidebar || !sidebarOverlay) {
            console.error('❌ Mobile menu elements not found');
            return;
        }

        // Open sidebar
        function openSidebar() {
            console.log('📂 Opening mobile sidebar');
            sidebar.classList.add('mobile-active');
            sidebarOverlay.classList.add('mobile-active');
        }

        // Close sidebar
        function closeSidebar() {
            console.log('📁 Closing mobile sidebar');
            sidebar.classList.remove('mobile-active');
            sidebarOverlay.classList.remove('mobile-active');
        }

        // Toggle sidebar
        function toggleSidebar(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Toggle mobile sidebar');

            if (sidebar.classList.contains('mobile-active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        }

        // Attach event listeners
        mobileMenuBtn.addEventListener('click', toggleSidebar);
        mobileMenuBtn.addEventListener('touchstart', toggleSidebar, { passive: false });

        sidebarOverlay.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('touchstart', closeSidebar, { passive: false });

        navItems.forEach(item => {
            item.addEventListener('click', closeSidebar);
            item.addEventListener('touchstart', closeSidebar, { passive: false });
        });

        console.log('✅ Mobile menu initialized successfully');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }

    // Re-initialize on window resize (if switching from desktop to mobile)
    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            console.log('Window resized - checking viewport');
            initMobileMenu();
        }, 250);
    });

})();

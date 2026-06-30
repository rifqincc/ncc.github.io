function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const target = document.getElementById(tabId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    currentActiveTab = tabId;
    try { sessionStorage.setItem('activeTab', tabId); } catch(e) {}

    if (tabId === 'tab-settings') {
        document.getElementById('setting-hpp-limit').value = appSettings.hpp_limit;
        setOverheadType(appSettings.overhead_type);
        if (appSettings.overhead_type === 'nominal') {
            document.getElementById('setting-overhead').value = appSettings.overhead_value.toString();
            formatRupiahInput(document.getElementById('setting-overhead'));
        } else {
            document.getElementById('setting-overhead').value = appSettings.overhead_value.toString();
        }
        updateOverheadStatusBadge();
        loadTheme();
    }
    if (tabId === 'tab-bahan-baku') { bbCurrentPage = 1; loadBahanBaku(); }
    if (tabId === 'tab-hpp') { loadDropdownBahanBaku('baru'); }
    if (tabId === 'tab-direktori' || tabId === 'tab-hpp' || tabId === 'tab-dashboard') loadDirektori();
    if (tabId === 'tab-hpp') renderTableSummary();
    if (tabId === 'tab-data-penjualan') {
        loadDataPenjualan();
        renderTablePenjualanInput();
    }
    if (tabId === 'tab-dashboard') {
        setTimeout(updateDashboardEngineering, 500);
    }
    if (tabId === 'tab-discount-calculator') {
        populateDiscountDropdowns();
    }
}

// ---------- LOGO SEBAGAI LINK KE HOME ----------
document.addEventListener('DOMContentLoaded', function() {
    const brandLink = document.getElementById('brand-link');
    if (brandLink) {
        brandLink.addEventListener('click', function(e) {
            if (document.getElementById('login-overlay').classList.contains('hidden') === false) return;
            switchTab('tab-direktori');
            const mobileMenuList = document.getElementById('mobile-menu-list');
            if (mobileMenuList) {
                const btns = mobileMenuList.querySelectorAll('.btn-tab-mobile');
                btns.forEach(btn => {
                    btn.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'text-[#FF3B30]', 'font-bold');
                    if (btn.innerText.includes('Directory Menu')) {
                        btn.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'text-[#FF3B30]', 'font-bold');
                    }
                });
            }
            const mobileMenu = document.getElementById('mobile-menu');
            if (!mobileMenu.classList.contains('translate-x-full')) {
                toggleMobileMenu();
            }
        });
    }
});

// ===== MENCEGAH REFRESH SAAT KEMBALI KE TAB =====
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        const savedTab = sessionStorage.getItem('activeTab');
        if (savedTab && document.getElementById(savedTab)) {
            switchTab(savedTab);
        }
        const savedScroll = sessionStorage.getItem('scrollPosition');
        if (savedScroll) {
            window.scrollTo(0, parseInt(savedScroll));
        }
    }
});
window.addEventListener('pagehide', function() {
    try {
        sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    } catch(e) {}
});


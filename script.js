// ===== FUNGSI TOGGLE SIDEBAR =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isHidden = sidebar.classList.contains('-translate-x-full');
    if (isHidden) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Di dalam updateUIByRole, ganti pembuatan navbar dengan sidebar
function updateUIByRole() {
    const isLoggedIn = !!currentUser;
    const role = currentUser?.role || 'guest';
    
    const allTabs = ['tab-dashboard', 'tab-direktori', 'tab-hpp', 'tab-bahan-baku', 'tab-kategori', 'tab-data-penjualan', 'tab-discount-calculator', 'tab-settings'];
    const tabMap = {
        staff: ['tab-dashboard', 'tab-direktori', 'tab-hpp', 'tab-settings'],
        admin: ['tab-dashboard', 'tab-direktori', 'tab-hpp', 'tab-bahan-baku', 'tab-settings'],
        senior_bar: ['tab-dashboard', 'tab-direktori', 'tab-hpp', 'tab-bahan-baku', 'tab-kategori', 'tab-data-penjualan', 'tab-discount-calculator', 'tab-settings'],
        head_bar: ['tab-dashboard', 'tab-direktori', 'tab-hpp', 'tab-bahan-baku', 'tab-kategori', 'tab-data-penjualan', 'tab-discount-calculator', 'tab-settings']
    };
    const allowed = tabMap[role] || tabMap.staff;
    
    const homeTab = 'tab-direktori';
    const activeTab = allowed.includes(homeTab) ? homeTab : allowed[0];
    currentActiveTab = activeTab;
    
    // Sembunyikan semua tab
    allTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.classList.remove('active'); }
    });
    allowed.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.remove('hidden'); }
    });
    const firstEl = document.getElementById(activeTab);
    if (firstEl) { firstEl.classList.add('active'); }

    // Buat sidebar nav
    const sidebarNav = document.getElementById('sidebar-nav');
    const tabNames = {
        'tab-dashboard': '📈 Dashboard',
        'tab-direktori': '📑 Directory Menu',
        'tab-hpp': '📊 HPP & Summary',
        'tab-bahan-baku': '📦 Bahan Baku',
        'tab-kategori': '🏷️ Kategori',
        'tab-data-penjualan': '📋 Data Penjualan',
        'tab-discount-calculator': '🧮 Discount Calculator',
        'tab-settings': '⚙️ Settings'
    };
    sidebarNav.innerHTML = '';
    allowed.forEach(id => {
        const btn = document.createElement('div');
        btn.className = `sidebar-nav-item ${id === activeTab ? 'active' : ''}`;
        btn.innerText = tabNames[id] || id;
        btn.onclick = () => { switchTab(id); if (window.innerWidth < 1024) toggleSidebar(); };
        sidebarNav.appendChild(btn);
    });

    // Update user status di sidebar
    const userStatus = document.getElementById('user-status-sidebar');
    if (isLoggedIn) {
        userStatus.innerHTML = `🌟 ${role.toUpperCase()}`;
        userStatus.className = 'text-xs font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-3 py-1.5 rounded-full inline-block border border-[#FF3B30]/20';
    } else {
        userStatus.innerHTML = '👤 Guest';
        userStatus.className = 'text-xs font-bold text-gray-400 bg-gray-700 px-3 py-1.5 rounded-full inline-block border border-gray-600';
    }

    // ... sisanya tetap sama (load data, dll)
}

async function inisialisasiAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
        await fetchUserRoleAndSettings(session.user);
    } else {
        currentUser = null;
        showLoginScreen();
        await loadAppSettings();
    }
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            await fetchUserRoleAndSettings(session.user);
        } else {
            currentUser = null;
            showLoginScreen();
            await loadAppSettings();
        }
    });
}
async function fetchUserRoleAndSettings(user) {
    showLoading();
    const { data: roleData, error: roleErr } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
    let role = 'staff';
    if (roleErr || !roleData) {
        await supabaseClient.from('user_roles').insert([{ user_id: user.id, role: 'staff' }]);
        role = 'staff';
    } else {
        role = roleData.role;
    }
    currentUser = { id: user.id, email: user.email, role };
    await loadAppSettings();
    updateUIByRole();
    hideLoginScreen();
    hideLoading();
}

// ---------- SETTINGS ----------
async function loadAppSettings() {
    try {
        const { data, error } = await supabaseClient.from('app_settings').select('key, value');
        if (error) return;
        const map = {};
        data.forEach(row => { map[row.key] = row.value; });
        appSettings.hpp_limit = parseFloat(map.hpp_limit) || 35;
        appSettings.overhead_type = map.overhead_type || 'nominal';
        appSettings.overhead_value = parseFloat(map.overhead_value) || 0;
    } catch (e) {}
}
async function simpanSettings() {
    if (!hasRole('head_bar')) {
        showToast('Hanya Head/Executive yang dapat mengubah pengaturan.', 'error');
        return;
    }
    const limitVal = parseFloat(document.getElementById('setting-hpp-limit').value);
    const ovhType = document.getElementById('setting-overhead-type').value;
    const inputOvh = document.getElementById('setting-overhead').value;
    const overheadVal = ovhType === 'nominal' ? getNilaiAsli(inputOvh) : (parseFloat(inputOvh) || 0);
    if (!limitVal || limitVal <= 0 || limitVal > 100) {
        showToast('Masukkan persentase HPP limit yang valid (1-100).', 'error');
        return;
    }
    if (ovhType === 'persen' && overheadVal > 100) {
        showToast('Persentase overhead tidak boleh lebih dari 100%.', 'error');
        return;
    }
    const btn = document.getElementById('btn-simpan-settings');
    const btnText = document.getElementById('btn-simpan-settings-text');
    if (btn) { btn.disabled = true; btn.classList.add('opacity-60', 'cursor-not-allowed'); }
    if (btnText) btnText.innerHTML = '<span class="btn-mini-spinner"></span>Menyimpan...';
    showLoading();
    const updates = [
        { key: 'hpp_limit', value: String(limitVal) },
        { key: 'overhead_type', value: ovhType },
        { key: 'overhead_value', value: String(overheadVal) }
    ];
    let gagalUpdate = false, errMsg = '';
    for (const u of updates) {
        const { error, data } = await supabaseClient
            .from('app_settings')
            .update({ value: u.value, updated_at: new Date() })
            .eq('key', u.key)
            .select();
        if (error) { gagalUpdate = true; errMsg = error.message; break; }
        if (!data || data.length === 0) {
            gagalUpdate = true;
            errMsg = `Baris dengan key "${u.key}" belum ada di tabel app_settings.`;
            break;
        }
    }
    hideLoading();
    if (btn) { btn.disabled = false; btn.classList.remove('opacity-60', 'cursor-not-allowed'); }
    if (btnText) btnText.innerHTML = '💾 Simpan Pengaturan';
    if (gagalUpdate) {
        showToast('Gagal menyimpan pengaturan: ' + errMsg, 'error');
        return;
    }
    await loadAppSettings();
    updateUIByRole();
    showToast('Pengaturan berhasil disimpan.', 'success');
}

// ---------- LOGIN/LOGOUT ----------
async function loginAdmin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-submit-login');
    if (!email || !password) return alert("Masukkan email dan password!");
    btn.innerText = "Memverifikasi...";
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    btn.innerText = "Masuk";
    if (error) alert("Gagal Login: " + error.message);
}
async function logoutAdmin() {
    if (!confirm("Apakah Anda yakin ingin keluar?")) return;
    showLoading();
    await supabaseClient.auth.signOut();
    hideLoading();
}

// ---------- UI UPDATE ----------
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

    const mobileMenuList = document.getElementById('mobile-menu-list');
    mobileMenuList.innerHTML = '';
    const statusDiv = document.createElement('div');
    statusDiv.className = 'flex flex-col gap-3 pb-5 mb-3 border-b border-gray-100 dark:border-gray-700';
    const statusSpan = document.createElement('span');
    statusSpan.className = 'text-sm font-bold text-[#FF3B30] bg-[#FF3B30]/10 border border-[#FF3B30]/20 px-3 py-2 rounded-lg text-center shadow-inner';
    statusSpan.innerText = isLoggedIn ? `🌟 ${role.toUpperCase()} (${currentUser.email})` : '👤 Guest';
    statusDiv.appendChild(statusSpan);
    if (isLoggedIn) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'bg-[#FF3B30] text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:shadow-lg transition-shadow text-center';
        logoutBtn.innerText = 'Logout Admin';
        logoutBtn.onclick = () => { toggleMobileMenu(); logoutAdmin(); };
        statusDiv.appendChild(logoutBtn);
    }
    mobileMenuList.appendChild(statusDiv);

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
    allowed.forEach(id => {
        const btn = document.createElement('button');
        btn.className = `btn-tab-mobile text-gray-600 dark:text-gray-300 font-semibold text-left py-3 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${id === activeTab ? 'bg-blue-50 dark:bg-blue-900/20 text-[#FF3B30] font-bold' : ''}`;
        btn.innerText = tabNames[id] || id;
        btn.onclick = () => { switchTab(id); toggleMobileMenu(); };
        mobileMenuList.appendChild(btn);
    });

    document.querySelectorAll('.role-admin').forEach(el => el.classList.toggle('hidden', !hasRole('admin')));
    document.querySelectorAll('.role-senior').forEach(el => el.classList.toggle('hidden', !hasRole('senior_bar')));
    document.querySelectorAll('.role-head').forEach(el => el.classList.toggle('hidden', !hasRole('head_bar')));

    const msg = document.getElementById('settings-readonly-msg');
    if (msg) {
        if (isLoggedIn && !hasRole('head_bar')) {
            msg.classList.remove('hidden');
        } else {
            msg.classList.add('hidden');
        }
    }

    document.getElementById('setting-hpp-limit').value = appSettings.hpp_limit;
    setOverheadType(appSettings.overhead_type);
    if (appSettings.overhead_type === 'nominal') {
        document.getElementById('setting-overhead').value = appSettings.overhead_value.toString();
        formatRupiahInput(document.getElementById('setting-overhead'));
    } else {
        document.getElementById('setting-overhead').value = appSettings.overhead_value.toString();
    }
    updateOverheadStatusBadge();

    initBulanTahunDropdowns();
    loadMenuDropdownPenjualan();
    populateKategoriFilterPenjualan();
    populateDiscountDropdowns();
    loadKategoriDB();

    const savedTab = sessionStorage.getItem('activeTab');
    if (savedTab && allowed.includes(savedTab)) {
        switchTab(savedTab);
    } else {
        switchTab(activeTab);
    }

    if (document.getElementById('tab-bahan-baku').classList.contains('active')) {
        bbCurrentPage = 1;
        loadBahanBaku();
    }
    if (document.getElementById('tab-hpp').classList.contains('active')) {
        loadDropdownBahanBaku('baru');
    }
    loadDirektori();
}

// ---------- SWITCH TAB ----------

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(angka);
function formatRupiahInput(element) {
    let val = element.value.replace(/[^,\d]/g, '').toString();
    let split = val.split(',');
    let sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    let ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    if (ribuan) {
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }
    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    element.value = rupiah;
}
function getNilaiAsli(stringInput) {
    return parseFloat(String(stringInput).replace(/[^0-9]/g, '')) || 0;
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) { alert(message); return; }
    const styles = { success: 'bg-emerald-600 border-emerald-800', error: 'bg-red-600 border-red-800', info: 'bg-blue-600 border-blue-800' };
    const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast-item ${styles[type] || styles.success} text-white px-5 py-4 rounded-xl shadow-2xl border-b-4 flex items-start gap-3 max-w-sm`;
    toast.innerHTML = `<span class="text-xl leading-none">${icons[type] || icons.success}</span><span class="text-sm font-semibold leading-snug pt-0.5">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('toast-out'); setTimeout(() => toast.remove(), 300); }, 3800);
}
function toggleOverheadInputStyle() {
    const type = document.getElementById('setting-overhead-type').value;
    const symbol = document.getElementById('overhead-addon-symbol');
    const input = document.getElementById('setting-overhead');
    const helper = document.getElementById('overhead-helper-text');
    document.querySelectorAll('.overhead-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    if (type === 'persen') {
        symbol.innerText = '%';
        input.placeholder = 'ex: 5';
        if (helper) helper.innerText = 'Contoh: jika diisi 5, maka HPP bahan akan ditambah 5% dari nilainya sebagai biaya overhead.';
    } else {
        symbol.innerText = 'Rp';
        input.placeholder = '0';
        if (helper) helper.innerText = 'Nilai ini akan ditambahkan secara tetap (flat) ke HPP setiap porsi resep.';
    }
}
function setOverheadType(type) {
    document.getElementById('setting-overhead-type').value = type;
    toggleOverheadInputStyle();
}
function updateOverheadStatusBadge() {
    const badge = document.getElementById('overhead-status-badge');
    if (!badge) return;
    if (appSettings.overhead_value > 0) {
        const display = appSettings.overhead_type === 'persen'
            ? `${appSettings.overhead_value}% / porsi`
            : `${formatRp(appSettings.overhead_value)} / porsi`;
        badge.innerHTML = `✅ Tersimpan: ${display}`;
        badge.className = 'text-xs font-bold px-3 py-1.5 rounded-full border bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-sm whitespace-nowrap';
    } else {
        badge.innerHTML = `⚪ Belum diatur`;
        badge.className = 'text-xs font-bold px-3 py-1.5 rounded-full border bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 shadow-sm whitespace-nowrap';
    }
}
function handleOverheadInputFormatting(element) {
    const type = document.getElementById('setting-overhead-type').value;
    if (type === 'nominal') formatRupiahInput(element);
}
function showLoading() { document.getElementById('loading-overlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading-overlay').classList.add('hidden'); }
function showSummaryModal(isSuccess, title, successCount, failCount) {
    document.getElementById('summary-icon').innerText = isSuccess ? '✅' : '⚠️';
    document.getElementById('summary-title').innerText = title;
    document.getElementById('summary-success').innerText = successCount;
    document.getElementById('summary-fail').innerText = failCount;
    document.getElementById('modal-summary').classList.remove('hidden');
}
function getCardGradient(str) {
    const gradients = ['from-slate-800 to-slate-900', 'from-blue-800 to-indigo-900', 'from-emerald-800 to-teal-900', 'from-rose-800 to-pink-900', 'from-amber-800 to-orange-900', 'from-purple-800 to-fuchsia-900', 'from-cyan-800 to-blue-900', 'from-red-800 to-rose-900', 'from-lime-800 to-green-900'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
}
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-overlay');
    if (menu.classList.contains('translate-x-full')) {
        menu.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        menu.classList.add('translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}
function toggleKebabMenu(event, menuId) {
    event.stopPropagation();
    const targetMenu = document.getElementById(menuId);
    const isHidden = targetMenu.classList.contains('hidden');
    document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
    if (isHidden) targetMenu.classList.remove('hidden');
}

// ---------- LOGIN ----------
function showLoginScreen() {
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('login-overlay').style.opacity = '1';
    document.getElementById('app-wrapper').classList.add('hidden');
}
function hideLoginScreen() {
    document.getElementById('login-overlay').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
    }, 300);
}
function hasRole(minRole) {
    if (!currentUser) return false;
    const hierarchy = { staff: 1, admin: 2, senior_bar: 3, head_bar: 4 };
    return (hierarchy[currentUser.role] || 0) >= (hierarchy[minRole] || 0);
}

// ---------- AUTH ----------

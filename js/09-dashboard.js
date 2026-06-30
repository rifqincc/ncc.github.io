// ==================== DASHBOARD ====================
function renderDashboardAnalitika() {
    if (!document.getElementById('dash-total-menu')) return;
    const countMenu = cachedResepSummaryData.length;
    const countBB = bahanBakuList.length;
    let totalSumHpp = 0, criticalCount = 0;
    cachedResepSummaryData.forEach(m => {
        totalSumHpp += m.hppPersen;
        if (m.hppPersen > appSettings.hpp_limit) criticalCount++;
    });
    const avgHpp = countMenu > 0 ? (totalSumHpp / countMenu) : 0;
    document.getElementById('dash-total-menu').innerText = countMenu;
    document.getElementById('dash-total-bb').innerText = countBB;
    document.getElementById('dash-avg-hpp').innerText = avgHpp.toFixed(1) + '%';
    document.getElementById('dash-alert-hpp').innerText = criticalCount;
    const topMarginBody = document.getElementById('dash-top-margin');
    let marginSorted = [...cachedResepSummaryData].sort((a, b) => b.margin - a.margin).slice(0, 5);
    topMarginBody.innerHTML = '';
    if (marginSorted.length === 0) topMarginBody.innerHTML = `<tr><td class="text-center p-4 italic text-gray-400 dark:text-gray-500">Data menu belum siap.</td></tr>`;
    marginSorted.forEach(m => {
        let marginColor = '';
        if (m.margin < 0) marginColor = 'text-red-600';
        else if (m.margin > 0) marginColor = 'text-emerald-600';
        else marginColor = 'text-gray-900 dark:text-gray-100';
        topMarginBody.innerHTML += `
            <tr class="py-2 flex justify-between items-center text-sm">
                <td class="font-bold text-gray-700 dark:text-gray-300">${m.nama}</td>
                <td class="font-black ${marginColor} text-right">${formatRp(m.margin)} <span class="text-xs font-normal text-gray-400 dark:text-gray-500">profit</span></td>
            </tr>
        `;
    });
    const criticalBody = document.getElementById('dash-critical-hpp');
    let criticalSorted = cachedResepSummaryData.filter(m => m.hppPersen > appSettings.hpp_limit).sort((a, b) => b.hppPersen - a.hppPersen);
    criticalBody.innerHTML = '';
    if (criticalSorted.length === 0) {
        criticalBody.innerHTML = `<tr><td class="p-4 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">✨ Selamat! Seluruh resep terkendali aman di bawah threshold ${appSettings.hpp_limit}%.</td></tr>`;
    } else {
        criticalSorted.forEach(m => {
            let hppColor = '';
            if (m.hppPersen > appSettings.hpp_limit) hppColor = 'text-red-600';
            else if (m.hppPersen < appSettings.hpp_limit) hppColor = 'text-emerald-600';
            else hppColor = 'text-gray-900 dark:text-gray-100';
            criticalBody.innerHTML += `
                <tr class="py-2 flex justify-between items-center text-sm">
                    <td class="font-bold text-gray-700 dark:text-gray-300">${m.nama}</td>
                    <td class="font-black ${hppColor} text-right">${m.hppPersen.toFixed(1)}% <span class="text-xs font-normal text-gray-400 dark:text-gray-500">HPP</span></td>
                </tr>
            `;
        });
    }
}

// ==================== AKSI HAPUS RESEP ====================
async function aksiHapusResep(id, nama) {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    if (confirm(`Yakin hapus resep "${nama}"?`)) {
        showLoading();
        await supabaseClient.from('resep').delete().eq('id', id);
        hideLoading();
        loadDirektori();
    }
}


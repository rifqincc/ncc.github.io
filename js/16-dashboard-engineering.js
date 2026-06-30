// ==================== DASHBOARD ENGINEERING ====================
async function updateDashboardEngineering() {
    const bulan = document.getElementById('dash-filter-bulan').value;
    const tahun = document.getElementById('dash-filter-tahun').value;
    if (!bulan || !tahun) {
        document.getElementById('dash-engineering-container').innerHTML = '<p class="text-gray-400 dark:text-gray-500 text-center py-10">Pilih bulan dan tahun untuk melihat data engineering.</p>';
        return;
    }
    const { data: penjualanData, error } = await supabaseClient
        .from('penjualan')
        .select('resep_id, qty, harga_jual')
        .eq('bulan', parseInt(bulan))
        .eq('tahun', parseInt(tahun));
    if (error) {
        console.error('Error ambil penjualan:', error);
        return;
    }
    const salesMap = {};
    penjualanData.forEach(p => {
        if (!salesMap[p.resep_id]) salesMap[p.resep_id] = { qty: 0, totalHarga: 0 };
        salesMap[p.resep_id].qty += p.qty;
        salesMap[p.resep_id].totalHarga += p.qty * p.harga_jual;
    });
    const menus = cachedResepSummaryData;
    const kategoriMap = {};
    menus.forEach(menu => {
        const kat = menu.kategori || 'Uncategorized';
        if (!kategoriMap[kat]) kategoriMap[kat] = [];
        kategoriMap[kat].push(menu);
    });
    const avgSalesPerKat = {};
    Object.keys(kategoriMap).forEach(kat => {
        const menusInKat = kategoriMap[kat];
        const totalQty = menusInKat.reduce((sum, m) => sum + (salesMap[m.id]?.qty || 0), 0);
        const countSold = menusInKat.filter(m => salesMap[m.id] && salesMap[m.id].qty > 0).length;
        avgSalesPerKat[kat] = countSold > 0 ? totalQty / countSold : 0;
    });
    const container = document.getElementById('dash-engineering-container');
    container.innerHTML = '';
    if (Object.keys(kategoriMap).length === 0) {
        container.innerHTML = '<p class="text-gray-400 dark:text-gray-500 text-center py-10">Belum ada kategori.</p>';
        return;
    }
    Object.keys(kategoriMap).sort().forEach(kat => {
        const menusInKat = kategoriMap[kat];
        const avg = avgSalesPerKat[kat] || 0;
        let html = `<div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h4 class="font-bold text-lg text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <span class="bg-[#FF3B30] text-white px-3 py-1 rounded-full text-sm">${kat}</span>
                <span class="text-sm font-normal text-gray-500 dark:text-gray-400">Rata-rata penjualan: ${avg.toFixed(1)} porsi</span>
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        `;
        menusInKat.forEach(menu => {
            const sales = salesMap[menu.id];
            const qty = sales?.qty || 0;
            const isEngineering = (qty < avg * 0.5) && avg > 0;
            const totalRevenue = sales?.totalHarga || 0;
            let marginColorEng = '';
            if (menu.margin < 0) marginColorEng = 'text-red-600 dark:text-red-400';
            else if (menu.margin > 0) marginColorEng = 'text-emerald-600 dark:text-emerald-400';
            else marginColorEng = 'text-gray-900 dark:text-gray-100';
            let hppColorEng = '';
            if (menu.hppPersen > appSettings.hpp_limit) hppColorEng = 'text-red-500 dark:text-red-400';
            else if (menu.hppPersen < appSettings.hpp_limit) hppColorEng = 'text-emerald-600 dark:text-emerald-400';
            else hppColorEng = 'text-gray-900 dark:text-gray-100';
            html += `
                <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border ${isEngineering ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : 'border-gray-100 dark:border-gray-700'}">
                    <div class="flex justify-between items-start">
                        <span class="font-bold text-gray-700 dark:text-gray-300">${menu.nama}</span>
                        ${isEngineering ? '<span class="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">🔧 Engineering</span>' : ''}
                    </div>
                    <div class="mt-2 space-y-1 text-sm">
                        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Qty Terjual</span><span class="font-bold">${qty}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Total Revenue</span><span class="font-bold">${formatRp(totalRevenue)}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Margin / Porsi</span><span class="font-bold ${marginColorEng}">${formatRp(menu.margin)}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">% HPP</span><span class="font-bold ${hppColorEng}">${menu.hppPersen.toFixed(1)}%</span></div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
        container.innerHTML += html;
    });
}


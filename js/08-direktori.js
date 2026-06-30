// ==================== LOAD DIREKTORI ====================
async function loadDirektori() {
    await loadAppSettings();
    const { data: bbData } = await supabaseClient.from('bahan_baku').select('*');
    if (bbData) bahanBakuList = bbData;
    const { data, error } = await supabaseClient.from('resep').select(`id, nama, kategori, sub_kategori, harga_jual, yield, resep_detail (qty, bahan_baku_id, bahan_baku (nama, satuan, harga))`);
    if (error) return;
    cachedResepSummaryData = data.map(menu => {
        let totalBiayaBahan = 0, komposisiHTML = '';
        (menu.resep_detail || []).forEach(det => {
            if (det.bahan_baku) {
                totalBiayaBahan += det.qty * det.bahan_baku.harga;
                komposisiHTML += `<li class="flex justify-between items-start text-[15px] py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0"><span class="text-gray-600 dark:text-gray-400 font-medium pr-4 break-words w-2/3 leading-snug">- ${det.bahan_baku.nama}</span> <span class="font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap text-right w-1/3">${det.qty} ${det.bahan_baku.satuan}</span></li>`;
            }
        });
        const currentYield = menu.yield || 1;
        const costPerPorsiBase = (totalBiayaBahan / currentYield);
        const overhead = appSettings.overhead_type === 'persen' 
            ? (costPerPorsiBase * (appSettings.overhead_value / 100)) 
            : appSettings.overhead_value;
        const hppPerPorsi = costPerPorsiBase + overhead;
        return {
            ...menu,
            yield: currentYield,
            totalCost: hppPerPorsi,
            margin: menu.harga_jual - hppPerPorsi,
            hppPersen: menu.harga_jual > 0 ? (hppPerPorsi / menu.harga_jual) * 100 : 0,
            komposisiHTML,
            overhead: overhead,
            overheadType: appSettings.overhead_type,
            overheadValue: appSettings.overhead_value
        };
    });
    renderCatalogDirektori();
    renderTableSummary();
    renderDashboardAnalitika();
    if (document.getElementById('tab-dashboard').classList.contains('active')) {
        updateDashboardEngineering();
    }
    if (document.getElementById('tab-data-penjualan').classList.contains('active')) {
        renderTablePenjualanInput();
    }
    if (document.getElementById('tab-discount-calculator').classList.contains('active')) {
        if (discountResults.length === 0) {
            document.getElementById('discount-table-body').innerHTML = `<tr><td colspan="10" class="text-center p-8 text-gray-400 dark:text-gray-500 italic">Klik tombol Calculate untuk melihat hasil simulasi</td></tr>`;
        }
    }
}

// ==================== RENDER DIRECTORY ====================
function renderCatalogDirektori() {
    let processedData = [...cachedResepSummaryData];
    const searchKey = document.getElementById('search-resep').value.toLowerCase();
    const filterKat = document.getElementById('filter-kategori-direktori').value;
    if (filterKat !== 'all') processedData = processedData.filter(m => m.kategori === filterKat);
    if (searchKey) processedData = processedData.filter(m => m.nama.toLowerCase().includes(searchKey) || (m.kategori && m.kategori.toLowerCase().includes(searchKey)) || (m.sub_kategori && m.sub_kategori.toLowerCase().includes(searchKey)));
    const wrapper = document.getElementById('recipe-wrapper');
    wrapper.innerHTML = '';
    if (processedData.length === 0) { wrapper.innerHTML = `<div class="w-full text-center py-20 text-gray-400 dark:text-gray-500 italic">Data resep menu kosong atau tidak ditemukan.</div>`; return; }
    const groupedData = {};
    processedData.forEach(menu => {
        const kat = menu.kategori && menu.kategori !== '-' ? menu.kategori.toUpperCase() : 'UNCATEGORIZED';
        const sub = menu.sub_kategori && menu.sub_kategori !== '-' ? menu.sub_kategori : 'Uncategorized';
        if (!groupedData[kat]) groupedData[kat] = {};
        if (!groupedData[kat][sub]) groupedData[kat][sub] = [];
        groupedData[kat][sub].push(menu);
    });
    const canEdit = hasRole('senior_bar');
    Object.keys(groupedData).sort().forEach(kat => {
        let html = `<div class="mb-12"><h2 class="text-3xl font-black text-gray-800 dark:text-white mb-6 border-b-4 border-[#FF3B30] inline-block pr-8 pb-1 tracking-tight uppercase">${kat}</h2>`;
        Object.keys(groupedData[kat]).sort().forEach(sub => {
            const cardBgColor = getCardGradient(sub);
            html += `<div class="mb-10"><h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-5 flex items-center"><span class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm">${sub}</span></h3><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">`;
            groupedData[kat][sub].forEach(menu => {
                let hppColor = '';
                if (menu.hppPersen > appSettings.hpp_limit) hppColor = 'text-red-600';
                else if (menu.hppPersen < appSettings.hpp_limit) hppColor = 'text-emerald-600';
                else hppColor = 'text-gray-900 dark:text-gray-100';

                let marginColor = '';
                if (menu.margin < 0) marginColor = 'text-red-600';
                else if (menu.margin > 0) marginColor = 'text-emerald-600';
                else marginColor = 'text-gray-900 dark:text-gray-100';

                let ovhText = '';
                if (menu.overheadValue > 0) {
                    if (menu.overheadType === 'persen') {
                        ovhText = `<div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">+ Overhead: ${menu.overheadValue}% dari HPP bahan</div>`;
                    } else {
                        ovhText = `<div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">+ Overhead: ${formatRp(menu.overhead)}</div>`;
                    }
                }
                html += `
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible relative hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col">
                        ${canEdit ? `<div class="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="toggleKebabMenu(event, 'drop-r-${menu.id}')" class="kebab-btn bg-white/90 dark:bg-gray-700/90 backdrop-blur hover:bg-white dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 w-8 h-8 rounded-lg font-bold shadow-md border border-gray-200 dark:border-gray-600">⋮</button>
                            <div id="drop-r-${menu.id}" class="dropdown-menu hidden absolute right-0 mt-1 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 w-36 py-2 text-sm text-gray-700 dark:text-gray-300 z-30">
                                <button onclick="bukaModalEditResep(${JSON.stringify(menu).replace(/"/g, '&quot;')})" class="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold text-blue-600 dark:text-blue-400">📝 Edit</button>
                                <button onclick="duplikasiResepCard(${menu.id}, '${menu.nama.replace(/'/g, "\\'")}')" class="w-full text-left px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/30 font-bold text-amber-600 dark:text-amber-400">📋 Duplicate</button>
                                <button onclick="aksiHapusResep(${menu.id}, '${menu.nama}')" class="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold text-red-600 dark:text-red-400 border-t border-gray-100 dark:border-gray-700">🗑️ Hapus</button>
                            </div>
                        </div>` : ''}
                        <div class="bg-gradient-to-br ${cardBgColor} text-white p-5 rounded-t-2xl">
                            <h3 class="text-xl font-black tracking-wide leading-tight break-words">${menu.nama}</h3>
                            <div class="text-xs font-semibold bg-white/20 px-3 py-1 rounded backdrop-blur inline-block mt-2">YIELD: ${menu.yield}</div>
                        </div>
                        <div class="p-5 md:p-6 flex-grow flex flex-col">
                            <ul class="mb-5 h-72 md:h-80 overflow-y-auto custom-scrollbar flex-grow pr-2">${menu.komposisiHTML || '<li class="text-sm text-gray-400 dark:text-gray-500 italic">Tanpa komposisi</li>'}</ul>
                            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-[15px] space-y-2 border border-gray-100 dark:border-gray-600 mt-auto">
                                <div class="flex justify-between items-center"><span class="text-gray-500 dark:text-gray-400 font-medium">Harga Jual:</span><span class="font-bold text-blue-600 dark:text-blue-400">${formatRp(menu.harga_jual)}</span></div>
                                <div class="flex justify-between items-start border-t border-gray-200 dark:border-gray-600 pt-2">
                                    <span class="text-gray-500 dark:text-gray-400 font-medium">HPP / Porsi:</span>
                                    <div class="text-right">
                                        <span class="font-bold text-gray-800 dark:text-gray-200 block">${formatRp(menu.totalCost)}</span>
                                        ${ovhText}
                                    </div>
                                </div>
                                <div class="flex justify-between items-center border-t border-gray-200 dark:border-gray-600 pt-2"><span class="text-gray-500 dark:text-gray-400 font-medium">Margin:</span><span class="font-bold ${marginColor}">${formatRp(menu.margin)}</span></div>
                                <div class="flex justify-between items-center"><span class="text-gray-500 dark:text-gray-400 font-medium">% HPP:</span><span class="font-black text-lg ${hppColor}">${menu.hppPersen.toFixed(2)}%</span></div>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`;
        });
        html += `</div>`;
        wrapper.innerHTML += html;
    });
}

// ==================== SUMMARY TABLE ====================
function renderTableSummary() {
    const tbody = document.getElementById('table-summary-body');
    if (!tbody) return;
    let sData = [...cachedResepSummaryData];
    const searchVal = document.getElementById('search-summary').value.toLowerCase();
    const filterKat = document.getElementById('filter-summary-kat').value;
    if (searchVal) sData = sData.filter(m => m.nama.toLowerCase().includes(searchVal));
    if (filterKat !== 'all') sData = sData.filter(m => m.kategori === filterKat);
    sData.sort((a, b) => {
        let valA = a[summarySortKey] !== undefined ? a[summarySortKey] : '';
        let valB = b[summarySortKey] !== undefined ? b[summarySortKey] : '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return summarySortAsc ? -1 : 1;
        if (valA > valB) return summarySortAsc ? 1 : -1;
        return 0;
    });
    tbody.innerHTML = '';
    if (sData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center p-8 text-gray-400 dark:text-gray-500 italic">Tidak ada resep data summary.</td></tr>`;
        return;
    }
    const canEditResep = hasRole('senior_bar');
    const thCheckbox = document.getElementById('th-checkbox-summary');
    const btnMassal = document.getElementById('btn-delete-massal');
    if (thCheckbox) {
        if (canEditResep) thCheckbox.classList.remove('hidden');
        else thCheckbox.classList.add('hidden');
    }
    if (btnMassal) {
        if (canEditResep) btnMassal.classList.remove('hidden');
        else btnMassal.classList.add('hidden');
    }
    sData.forEach(m => {
        let textHppColor = '';
        if (m.hppPersen > appSettings.hpp_limit) textHppColor = 'text-red-600 dark:text-red-400 font-black';
        else if (m.hppPersen < appSettings.hpp_limit) textHppColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
        else textHppColor = 'text-gray-900 dark:text-gray-100 font-bold';

        let marginColorSummary = '';
        if (m.margin < 0) marginColorSummary = 'text-red-500 dark:text-red-400';
        else if (m.margin > 0) marginColorSummary = 'text-emerald-600 dark:text-emerald-400';
        else marginColorSummary = 'text-gray-900 dark:text-gray-100';

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';
        let html = '';
        if (canEditResep) {
            html += `<td class="p-4 w-8 text-center"><input type="checkbox" class="summary-checkbox rounded border-gray-300 text-[#FF3B30] focus:ring-[#FF3B30]" value="${m.id}" /></td>`;
        }
        html += `
            <td class="p-4 font-bold text-gray-800 dark:text-gray-200">${m.nama}</td>
            <td class="p-4 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span class="bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 px-2 py-1 rounded-md">${m.kategori}</span></td>
            <td class="p-4 text-gray-500 dark:text-gray-400 text-xs">${m.sub_kategori}</td>
            <td class="p-4 text-right font-semibold text-blue-600 dark:text-blue-400">${formatRp(m.harga_jual)}</td>
            <td class="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">${formatRp(m.totalCost)}</td>
            <td class="p-4 text-center ${textHppColor}">${m.hppPersen.toFixed(1)}%</td>
            <td class="p-4 text-right font-bold ${marginColorSummary}">${formatRp(m.margin)}</td>
        `;
        html += `<td class="p-4 text-center"><div class="relative inline-block">`;
        if (canEditResep) {
            html += `
                <button onclick="toggleKebabMenu(event, 'drop-summary-${m.id}')" class="kebab-btn bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 w-8 h-8 rounded-lg font-bold shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">⋮</button>
                <div id="drop-summary-${m.id}" class="dropdown-menu hidden absolute right-0 mt-1 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 w-36 py-2 text-sm text-gray-700 dark:text-gray-300 z-[70] overflow-hidden" style="top:100%;">
                    <button onclick="infoResepCard(${m.id})" class="w-full block text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold text-blue-600 dark:text-blue-400">ℹ️ Info</button>
                    <button onclick="bukaModalEditResep(${JSON.stringify(m).replace(/"/g, '&quot;')})" class="w-full block text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold text-blue-600 dark:text-blue-400 border-t border-gray-100 dark:border-gray-700">📝 Edit</button>
                    <button onclick="aksiHapusResep(${m.id}, '${m.nama}')" class="w-full block text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold text-red-600 dark:text-red-400 border-t border-gray-100 dark:border-gray-700 mt-1">🗑️ Hapus</button>
                </div>
            `;
        } else {
            html += `
                <button onclick="toggleKebabMenu(event, 'drop-summary-${m.id}')" class="kebab-btn bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 w-8 h-8 rounded-lg font-bold shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">⋮</button>
                <div id="drop-summary-${m.id}" class="dropdown-menu hidden absolute right-0 mt-1 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 w-36 py-2 text-sm text-gray-700 dark:text-gray-300 z-[70] overflow-hidden" style="top:100%;">
                    <button onclick="infoResepCard(${m.id})" class="w-full block text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold text-blue-600 dark:text-blue-400">ℹ️ Info</button>
                </div>
            `;
        }
        html += `</div></td>`;
        row.innerHTML = html;
        tbody.appendChild(row);
    });
    document.querySelectorAll('#summary-table .sortable').forEach(th => {
        const key = th.dataset.sort;
        const icon = th.querySelector('.sort-icon');
        if (key === summarySortKey) {
            icon.textContent = summarySortAsc ? '▲' : '▼';
        } else {
            icon.textContent = '▽';
        }
    });
    const selectAll = document.getElementById('select-all-summary');
    if (selectAll) selectAll.checked = false;
}

function infoResepCard(id) {
    const menu = cachedResepSummaryData.find(m => m.id === id);
    if (!menu) return alert('Data tidak ditemukan');
    document.getElementById('info-resep-nama').innerText = menu.nama;
    let ovhText = '';
    if (menu.overheadValue > 0) {
        ovhText = menu.overheadType === 'persen' 
            ? `<p><strong>Overhead:</strong> ${menu.overheadValue}% dari HPP bahan</p>` 
            : `<p><strong>Overhead:</strong> ${formatRp(menu.overhead)}</p>`;
    }
    let marginColorInfo = '';
    if (menu.margin < 0) marginColorInfo = 'text-red-600';
    else if (menu.margin > 0) marginColorInfo = 'text-emerald-600';
    else marginColorInfo = 'text-gray-900 dark:text-gray-100';
    let hppColorInfo = '';
    if (menu.hppPersen > appSettings.hpp_limit) hppColorInfo = 'text-red-600';
    else if (menu.hppPersen < appSettings.hpp_limit) hppColorInfo = 'text-emerald-600';
    else hppColorInfo = 'text-gray-900 dark:text-gray-100';
    let detailHtml = `
        <p><strong>Kategori:</strong> ${menu.kategori}</p>
        <p><strong>Sub Kategori:</strong> ${menu.sub_kategori}</p>
        <p><strong>Harga Jual:</strong> <span class="text-blue-600 dark:text-blue-400 font-bold">${formatRp(menu.harga_jual)}</span></p>
        <p><strong>Yield (Porsi):</strong> ${menu.yield}</p>
        <p><strong>HPP / Porsi:</strong> ${formatRp(menu.totalCost)}</p>
        ${ovhText}
        <p><strong>Margin:</strong> <span class="font-bold ${marginColorInfo}">${formatRp(menu.margin)}</span></p>
        <p><strong>% HPP:</strong> <span class="font-bold ${hppColorInfo}">${menu.hppPersen.toFixed(1)}%</span></p>
        <hr class="my-3" />
        <p class="font-bold">Komposisi Bahan:</p>
        <ul class="list-disc pl-5 space-y-1">${menu.komposisiHTML || '<li class="text-gray-400 italic">Tidak ada</li>'}</ul>
    `;
    document.getElementById('info-resep-detail').innerHTML = detailHtml;
    document.getElementById('modal-info-resep').classList.remove('hidden');
}

function toggleSelectAllSummary() {
    const checked = document.getElementById('select-all-summary').checked;
    document.querySelectorAll('.summary-checkbox').forEach(cb => cb.checked = checked);
}

async function hapusMassalResep() {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    const checkboxes = document.querySelectorAll('.summary-checkbox:checked');
    if (checkboxes.length === 0) return alert('Pilih minimal satu menu yang akan dihapus.');
    const ids = Array.from(checkboxes).map(cb => cb.value);
    const namaMenus = ids.map(id => {
        const menu = cachedResepSummaryData.find(m => m.id == id);
        return menu ? menu.nama : id;
    }).join('\n- ');
    if (!confirm(`Anda yakin akan menghapus ${ids.length} menu berikut?\n- ${namaMenus}\n\nTindakan ini tidak dapat dibatalkan.`)) return;
    showLoading();
    const { error } = await supabaseClient.from('resep').delete().in('id', ids);
    hideLoading();
    if (error) {
        alert('Gagal menghapus beberapa menu. Mungkin ada yang terkait dengan data lain.');
    } else {
        alert('Berhasil menghapus menu terpilih.');
        loadDirektori();
    }
}
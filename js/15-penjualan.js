// ==================== PENJUALAN ====================
function initBulanTahunDropdowns() {
    const bulanSelects = ['jual-bulan', 'filter-data-bulan', 'dash-filter-bulan'];
    const bulanNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    bulanSelects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '<option value="">Pilih Bulan</option>';
        bulanNames.forEach((name, i) => {
            el.innerHTML += `<option value="${i+1}">${name}</option>`;
        });
        if (id === 'jual-bulan') {
            el.value = new Date().getMonth() + 1;
        }
    });
    const tahunSelects = ['jual-tahun', 'filter-data-tahun', 'dash-filter-tahun'];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 10}, (_, i) => currentYear - i);
    tahunSelects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '<option value="">Pilih Tahun</option>';
        years.forEach(y => {
            el.innerHTML += `<option value="${y}">${y}</option>`;
        });
        if (id === 'jual-tahun' || id === 'dash-filter-tahun') el.value = currentYear;
    });
}
async function loadMenuDropdownPenjualan() {
    const { data, error } = await supabaseClient.from('resep').select('id, nama, harga_jual').order('nama');
    if (error) return;
    const selects = ['filter-data-menu'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '<option value="all">Semua Menu</option>';
        data.forEach(m => {
            el.innerHTML += `<option value="${m.id}">${m.nama}</option>`;
        });
    });
}
function renderTablePenjualanInput() {
    const tbody = document.getElementById('table-penjualan-input-body');
    if (!tbody) return;
    const filterKat = document.getElementById('jual-filter-kategori').value;
    // Jika kategori "all" atau belum dipilih, tampilkan pesan
    if (filterKat === 'all' || filterKat === '') {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-400 dark:text-gray-500 italic">Pilih kategori terlebih dahulu untuk menampilkan menu.</td></tr>`;
        return;
    }
    let menus = cachedResepSummaryData.filter(m => m.kategori === filterKat);
    if (menus.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-400 dark:text-gray-500 italic">Tidak ada menu untuk kategori ini.</td></tr>`;
        return;
    }
    const grouped = {};
    menus.forEach(menu => {
        const sub = menu.sub_kategori || 'Uncategorized';
        if (!grouped[sub]) grouped[sub] = [];
        grouped[sub].push(menu);
    });
    menus.forEach(menu => {
        if (!penjualanInputData[menu.id]) {
            penjualanInputData[menu.id] = { qty: '', harga_jual: menu.harga_jual || 0 };
        }
    });
    tbody.innerHTML = '';
    Object.keys(grouped).sort().forEach(sub => {
        tbody.innerHTML += `<tr class="bg-gray-50 dark:bg-gray-700/50"><td colspan="5" class="p-2 font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-600">📂 ${sub}</td></tr>`;
        grouped[sub].forEach(menu => {
            const data = penjualanInputData[menu.id] || { qty: '', harga_jual: menu.harga_jual || 0 };
            tbody.innerHTML += `
                <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors">
                    <td class="p-3 font-semibold text-gray-700 dark:text-gray-300">${menu.nama}</td>
                    <td class="p-3 text-gray-600 dark:text-gray-400 text-sm">${menu.kategori}</td>
                    <td class="p-3 text-gray-500 dark:text-gray-400 text-sm">${menu.sub_kategori || '-'}</td>
                    <td class="p-3 text-center">
                        <input type="number" min="0" step="1" value="${data.qty}" 
                            class="w-24 p-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-sm focus:ring-2 focus:ring-[#FF3B30] outline-none dark:bg-gray-700 dark:text-white"
                            oninput="updatePenjualanInput(${menu.id}, 'qty', this.value)" />
                    </td>
                    <td class="p-3 text-right">
                        <div class="flex justify-end items-center gap-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">Rp</span>
                            <input type="text" value="${data.harga_jual ? new Intl.NumberFormat('id-ID').format(data.harga_jual) : ''}" 
                                class="w-32 p-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-right text-sm focus:ring-2 focus:ring-[#FF3B30] outline-none dark:bg-gray-700 dark:text-white"
                                oninput="formatRupiahInput(this); updatePenjualanInput(${menu.id}, 'harga', this.value)" />
                        </div>
                    </td>
                </tr>
            `;
        });
    });
}
function updatePenjualanInput(id, field, value) {
    if (!penjualanInputData[id]) {
        const menu = cachedResepSummaryData.find(m => m.id === id);
        penjualanInputData[id] = { qty: '', harga_jual: menu ? menu.harga_jual : 0 };
    }
    if (field === 'qty') {
        penjualanInputData[id].qty = value;
    } else {
        penjualanInputData[id].harga_jual = getNilaiAsli(value);
    }
}
async function simpanPenjualanMassal() {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    const bulan = parseInt(document.getElementById('jual-bulan').value);
    const tahun = parseInt(document.getElementById('jual-tahun').value);
    if (!bulan || !tahun) {
        return alert('Pilih bulan dan tahun terlebih dahulu!');
    }
    const dataToInsert = [];
    for (const [id, data] of Object.entries(penjualanInputData)) {
        const qty = parseInt(data.qty) || 0;
        const harga = data.harga_jual || 0;
        if (qty > 0 && harga > 0) {
            dataToInsert.push({
                resep_id: parseInt(id),
                bulan: bulan,
                tahun: tahun,
                qty: qty,
                harga_jual: harga
            });
        }
    }
    if (dataToInsert.length === 0) {
        return alert('Tidak ada data penjualan yang valid (Qty > 0 dan Harga > 0).');
    }
    const { data: existing } = await supabaseClient
        .from('penjualan')
        .select('resep_id')
        .eq('bulan', bulan)
        .eq('tahun', tahun);
    const existingIds = new Set(existing ? existing.map(e => e.resep_id) : []);
    const conflictIds = dataToInsert.filter(d => existingIds.has(d.resep_id)).map(d => d.resep_id);
    if (conflictIds.length > 0) {
        const conflictMenus = cachedResepSummaryData
            .filter(m => conflictIds.includes(m.id))
            .map(m => m.nama)
            .join(', ');
        if (!confirm(`Data penjualan untuk bulan ${bulan}/${tahun} sudah ada untuk menu: ${conflictMenus}.\n\nSimpan akan menimpa data yang sudah ada. Lanjutkan?`)) {
            return;
        }
        await supabaseClient
            .from('penjualan')
            .delete()
            .eq('bulan', bulan)
            .eq('tahun', tahun)
            .in('resep_id', conflictIds);
    }
    showLoading();
    const { error } = await supabaseClient.from('penjualan').insert(dataToInsert);
    hideLoading();
    if (error) {
        alert('Gagal menyimpan penjualan: ' + error.message);
    } else {
        alert(`Berhasil menyimpan ${dataToInsert.length} data penjualan!`);
        for (const id of Object.keys(penjualanInputData)) {
            penjualanInputData[id].qty = '';
        }
        renderTablePenjualanInput();
        loadDataPenjualan();
    }
}
function downloadTemplatePenjualan() {
    const ws = XLSX.utils.json_to_sheet([
        { "Nama Menu": "Iced Choco Banana", "Kategori": "Beverage", "Sub Kategori": "Non-Coffee", "Qty Terjual": 150, "Harga Jual": 28000 },
        { "Nama Menu": "Cappuccino", "Kategori": "Beverage", "Sub Kategori": "Coffee", "Qty Terjual": 200, "Harga Jual": 32000 }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Penjualan");
    XLSX.writeFile(wb, "Template_Penjualan.xlsx");
}
function initiateImportPenjualan(event) {
    fileImportTertunda = event.target.files[0];
    if (!fileImportTertunda) return;
    jenisImportTertunda = 'penjualan';
    document.getElementById('modal-import-option').classList.remove('hidden');
}
function eksekusiImportPenjualan(mode) {
    if (!hasRole('senior_bar')) { hideLoading(); alert('Akses ditolak.'); batalImport(); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            if (rows.length === 0) { hideLoading(); alert("Data Excel kosong!"); batalImport(); return; }
            const { data: menus } = await supabaseClient.from('resep').select('id, nama, kategori, sub_kategori');
            const menuMap = {};
            menus.forEach(m => {
                menuMap[m.nama.toLowerCase().trim()] = m.id;
            });
            const dataToInsert = [];
            let skipped = 0;
            rows.forEach(r => {
                const namaMenu = String(r["Nama Menu"] || "").trim();
                const qty = parseInt(r["Qty Terjual"] || 0);
                const harga = parseFloat(r["Harga Jual"] || 0);
                if (!namaMenu || qty <= 0 || harga <= 0) { skipped++; return; }
                const menuId = menuMap[namaMenu.toLowerCase()];
                if (!menuId) { skipped++; return; }
                const bulan = parseInt(document.getElementById('jual-bulan').value);
                const tahun = parseInt(document.getElementById('jual-tahun').value);
                if (!bulan || !tahun) {
                    alert('Pilih bulan dan tahun terlebih dahulu sebelum import!');
                    throw new Error('Bulan/tahun tidak dipilih');
                }
                dataToInsert.push({
                    resep_id: menuId,
                    bulan: bulan,
                    tahun: tahun,
                    qty: qty,
                    harga_jual: harga
                });
            });
            if (dataToInsert.length === 0) {
                hideLoading();
                alert(`Tidak ada data valid untuk diimport. ${skipped} baris dilewati.`);
                batalImport();
                return;
            }
            const bulan = parseInt(document.getElementById('jual-bulan').value);
            const tahun = parseInt(document.getElementById('jual-tahun').value);
            const { data: existing } = await supabaseClient
                .from('penjualan')
                .select('resep_id')
                .eq('bulan', bulan)
                .eq('tahun', tahun);
            const existingIds = new Set(existing ? existing.map(e => e.resep_id) : []);
            const conflictIds = dataToInsert.filter(d => existingIds.has(d.resep_id)).map(d => d.resep_id);
            if (conflictIds.length > 0) {
                if (!confirm(`Data penjualan untuk bulan ${bulan}/${tahun} sudah ada untuk beberapa menu.\n\nSimpan akan menimpa data yang sudah ada. Lanjutkan?`)) {
                    hideLoading();
                    batalImport();
                    return;
                }
                await supabaseClient
                    .from('penjualan')
                    .delete()
                    .eq('bulan', bulan)
                    .eq('tahun', tahun)
                    .in('resep_id', conflictIds);
            }
            const { error } = await supabaseClient.from('penjualan').insert(dataToInsert);
            hideLoading();
            batalImport();
            if (error) {
                alert('Gagal import penjualan: ' + error.message);
            } else {
                alert(`Berhasil import ${dataToInsert.length} data penjualan. ${skipped} baris dilewati.`);
                loadDataPenjualan();
                renderTablePenjualanInput();
            }
        } catch (err) {
            hideLoading();
            alert("Gagal mengolah file Excel: " + err.message);
            batalImport();
        }
    };
    reader.readAsArrayBuffer(fileImportTertunda);
}
function exportPenjualanToExcel() {
    const bulan = document.getElementById('filter-data-bulan').value;
    const tahun = document.getElementById('filter-data-tahun').value;
    const menuId = document.getElementById('filter-data-menu').value;
    let query = supabaseClient
        .from('penjualan')
        .select(`
            id,
            bulan,
            tahun,
            qty,
            harga_jual,
            resep:resep_id (id, nama, kategori, sub_kategori)
        `);
    if (bulan && bulan !== 'all') query = query.eq('bulan', parseInt(bulan));
    if (tahun && tahun !== 'all') query = query.eq('tahun', parseInt(tahun));
    if (menuId && menuId !== 'all') query = query.eq('resep_id', parseInt(menuId));
    query.then(({ data, error }) => {
        if (error) { alert('Gagal export: ' + error.message); return; }
        if (!data || data.length === 0) { alert('Tidak ada data untuk diexport.'); return; }
        const exportData = data.map(row => ({
            "Menu": row.resep?.nama || 'Menu dihapus',
            "Kategori": row.resep?.kategori || '-',
            "Sub Kategori": row.resep?.sub_kategori || '-',
            "Bulan": ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][row.bulan - 1] || row.bulan,
            "Tahun": row.tahun,
            "Qty Terjual": row.qty,
            "Harga Jual": row.harga_jual,
            "Total": row.qty * row.harga_jual
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Penjualan");
        XLSX.writeFile(wb, `Penjualan_${bulan || 'all'}_${tahun || 'all'}.xlsx`);
    });
}
async function loadDataPenjualan() {
    const bulan = document.getElementById('filter-data-bulan').value;
    const tahun = document.getElementById('filter-data-tahun').value;
    const menuId = document.getElementById('filter-data-menu').value;
    let query = supabaseClient
        .from('penjualan')
        .select(`
            id,
            bulan,
            tahun,
            qty,
            harga_jual,
            resep:resep_id (id, nama, kategori, sub_kategori, harga_jual as harga_jual_resep)
        `);
    if (bulan && bulan !== 'all') query = query.eq('bulan', parseInt(bulan));
    if (tahun && tahun !== 'all') query = query.eq('tahun', parseInt(tahun));
    if (menuId && menuId !== 'all') query = query.eq('resep_id', parseInt(menuId));
    const { data, error } = await query.order('tahun', { ascending: false }).order('bulan', { ascending: false });
    if (error) { console.error('Error load penjualan:', error); return; }
    const tbody = document.getElementById('table-penjualan-body');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center p-8 text-gray-400 dark:text-gray-500 italic">Tidak ada data penjualan.</td></tr>`;
        return;
    }
    const canDelete = hasRole('senior_bar');
    const thCheck = document.querySelector('#table-penjualan thead th:first-child');
    if (thCheck) {
        if (canDelete) thCheck.classList.remove('hidden');
        else thCheck.classList.add('hidden');
    }
    data.forEach(row => {
        const menu = row.resep;
        const total = row.qty * row.harga_jual;
        const bulanName = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][row.bulan - 1] || row.bulan;
        let html = '<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">';
        if (canDelete) {
            html += `<td class="p-4 w-8 text-center"><input type="checkbox" class="penjualan-checkbox rounded border-gray-300 text-[#FF3B30] focus:ring-[#FF3B30]" value="${row.id}" /></td>`;
        }
        html += `
            <td class="p-4 font-bold text-gray-800 dark:text-gray-200">${menu?.nama || 'Menu dihapus'}</td>
            <td class="p-4 text-gray-600 dark:text-gray-400">${menu?.kategori || '-'}</td>
            <td class="p-4">${bulanName}</td>
            <td class="p-4">${row.tahun}</td>
            <td class="p-4 text-right font-semibold">${row.qty}</td>
            <td class="p-4 text-right font-semibold text-blue-600 dark:text-blue-400">${formatRp(row.harga_jual)}</td>
            <td class="p-4 text-right font-bold text-gray-800 dark:text-gray-200">${formatRp(total)}</td>
            <td class="p-4 text-center">
        `;
        if (canDelete) {
            html += `<button onclick="hapusPenjualan(${row.id})" class="text-red-500 dark:text-red-400 hover:text-red-700 font-bold text-lg">✕</button>`;
        } else {
            html += `<span class="text-gray-300">-</span>`;
        }
        html += `</td></tr>`;
        tbody.innerHTML += html;
    });
    const btnMassal = document.querySelector('[onclick="hapusPenjualanTerpilih()"]');
    if (btnMassal) {
        if (canDelete) btnMassal.classList.remove('hidden');
        else btnMassal.classList.add('hidden');
    }
}
async function hapusPenjualan(id) {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    if (!confirm('Hapus data penjualan ini?')) return;
    showLoading();
    const { error } = await supabaseClient.from('penjualan').delete().eq('id', id);
    hideLoading();
    if (error) alert('Gagal hapus.');
    else loadDataPenjualan();
}
async function hapusPenjualanTerpilih() {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    const checkboxes = document.querySelectorAll('.penjualan-checkbox:checked');
    if (checkboxes.length === 0) return alert('Pilih data yang akan dihapus.');
    const ids = Array.from(checkboxes).map(cb => cb.value);
    if (!confirm(`Hapus ${ids.length} data penjualan?`)) return;
    showLoading();
    const { error } = await supabaseClient.from('penjualan').delete().in('id', ids);
    hideLoading();
    if (error) alert('Gagal hapus massal.');
    else loadDataPenjualan();
}
function toggleSelectAllPenjualan() {
    const checked = document.getElementById('select-all-penjualan').checked;
    document.querySelectorAll('.penjualan-checkbox').forEach(cb => cb.checked = checked);
}


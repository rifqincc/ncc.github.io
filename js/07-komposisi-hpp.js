// ==================== DROPDOWN BAHAN BAKU ====================
async function loadDropdownBahanBaku(targetElement) {
    const { data } = await supabaseClient.from('bahan_baku').select('*').order('nama');
    bahanBakuList = data || [];
    const prefix = targetElement === 'edit' ? 'edit-r-' : 'r-';
    const ul = document.getElementById(prefix + 'dropdown-list');
    ul.innerHTML = '';
    if (bahanBakuList.length === 0) {
        ul.innerHTML = '<li class="p-4 text-gray-400 dark:text-gray-500 text-sm italic text-center">Belum ada bahan di database</li>';
    } else {
        bahanBakuList.forEach(bb => {
            ul.innerHTML += `<li class="p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm bb-item flex justify-between items-center transition-colors" onclick="pilihBahanBaku('${targetElement}', '${bb.id}', '${bb.nama.replace(/'/g, "\\'")}', ${bb.harga}, '${bb.satuan}')"><div class="font-bold text-gray-700 dark:text-gray-300">${bb.nama}</div><div class="text-xs font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-2.5 py-1 rounded-md">${formatRp(bb.harga)} <span class="text-gray-500 dark:text-gray-400 font-normal">/ ${bb.satuan}</span></div></li>`;
        });
    }
}
function bukaDropdownBB(mode) {
    const prefix = mode === 'edit' ? 'edit-r-' : 'r-';
    document.getElementById(prefix + 'dropdown-list').classList.remove('hidden');
    filterDropdownBB(mode);
}
function filterDropdownBB(mode) {
    const prefix = mode === 'edit' ? 'edit-r-' : 'r-';
    const inputVal = document.getElementById(prefix + 'pilih-bb').value.toLowerCase();
    const ul = document.getElementById(prefix + 'dropdown-list');
    const items = ul.getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        if (items[i].classList.contains('bb-item')) {
            const txt = items[i].textContent || items[i].innerText;
            items[i].style.display = txt.toLowerCase().indexOf(inputVal) > -1 ? "" : "none";
        }
    }
}
function pilihBahanBaku(mode, id, nama, harga, satuan) {
    const prefix = mode === 'edit' ? 'edit-r-' : 'r-';
    document.getElementById(prefix + 'pilih-bb').value = nama;
    document.getElementById(prefix + 'bb-selected-id').value = id;
    document.getElementById(prefix + 'bb-selected-nama').value = nama;
    document.getElementById(prefix + 'bb-selected-harga').value = harga;
    document.getElementById(prefix + 'bb-selected-satuan').value = satuan;
    document.getElementById(prefix + 'dropdown-list').classList.add('hidden');
}

// ==================== KOMPOSISI ====================
function addTempKomposisi(mode) {
    const prefix = mode === 'edit' ? 'edit-r-' : 'r-';
    const id = document.getElementById(prefix + 'bb-selected-id').value;
    const nama = document.getElementById(prefix + 'bb-selected-nama').value;
    const harga = parseFloat(document.getElementById(prefix + 'bb-selected-harga').value);
    const satuan = document.getElementById(prefix + 'bb-selected-satuan').value;
    const qty = parseFloat(document.getElementById(prefix + 'qty-bb').value);
    if (!id || !qty) return alert("Pilih bahan dari dropdown dan isi Qty!");
    const dataArr = mode === 'edit' ? tempKomposisiEdit : tempKomposisiBaru;
    if (dataArr.some(item => item.bahan_baku_id == id)) return alert("Bahan sudah masuk daftar!");
    dataArr.push({ bahan_baku_id: id, nama: nama, satuan: satuan, qty: qty, subtotal: harga * qty });
    document.getElementById(prefix + 'pilih-bb').value = '';
    document.getElementById(prefix + 'bb-selected-id').value = '';
    document.getElementById(prefix + 'qty-bb').value = '';
    renderKomposisi(mode);
}
function removeTempKomposisi(mode, index) {
    if (mode === 'edit') tempKomposisiEdit.splice(index, 1);
    else tempKomposisiBaru.splice(index, 1);
    renderKomposisi(mode);
}
function renderKomposisi(mode) {
    const prefix = mode === 'edit' ? 'edit-' : '';
    const dataArr = mode === 'edit' ? tempKomposisiEdit : tempKomposisiBaru;
    const tbody = document.getElementById(prefix + 'temp-komposisi-list');
    tbody.innerHTML = '';
    dataArr.forEach((item, idx) => {
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="p-3 font-semibold text-gray-700 dark:text-gray-300">${item.nama}</td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <input type="number" step="any" value="${item.qty}" class="w-20 p-1 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-sm outline-none focus:ring-2 focus:ring-[#FF3B30] dark:bg-gray-700 dark:text-white" oninput="directUpdateQtyKomposisi('${mode}', ${idx}, this.value)" />
                        <span class="text-xs font-bold text-gray-400 dark:text-gray-500">${item.satuan}</span>
                    </div>
                </td>
                <td class="p-3 text-[#FF3B30] font-bold text-right" id="${prefix}subtotal-cell-${idx}">${formatRp(item.subtotal)}</td>
                <td class="p-3 text-center"><button onclick="removeTempKomposisi('${mode}', ${idx})" class="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors font-bold text-lg leading-none">×</button></td>
            </tr>
        `;
    });
    updateKalkulasiHPP(mode);
}
function directUpdateQtyKomposisi(mode, idx, value) {
    const dataArr = mode === 'edit' ? tempKomposisiEdit : tempKomposisiBaru;
    const currentQty = parseFloat(value) || 0;
    if (dataArr[idx]) {
        const matchingBB = bahanBakuList.find(b => b.id == dataArr[idx].bahan_baku_id);
        const baseHarga = matchingBB ? matchingBB.harga : (dataArr[idx].subtotal / (dataArr[idx].qty || 1));
        dataArr[idx].qty = currentQty;
        dataArr[idx].subtotal = baseHarga * currentQty;
        const prefix = mode === 'edit' ? 'edit-' : '';
        const subtotalCell = document.getElementById(`${prefix}subtotal-cell-${idx}`);
        if (subtotalCell) subtotalCell.innerText = formatRp(dataArr[idx].subtotal);
        updateKalkulasiHPP(mode);
    }
}
function updateKalkulasiHPP(mode) {
    const prefix = mode === 'edit' ? 'edit-r-' : 'r-';
    const dataArr = mode === 'edit' ? tempKomposisiEdit : tempKomposisiBaru;
    const elHargaJual = document.getElementById(prefix + 'harga-jual');
    const elYield = document.getElementById(prefix + 'yield');
    if (elHargaJual && !elHargaJual.hasAttribute('data-bound')) { elHargaJual.addEventListener('input', () => updateKalkulasiHPP(mode)); elHargaJual.setAttribute('data-bound', 'true'); }
    if (elYield && !elYield.hasAttribute('data-bound')) { elYield.addEventListener('input', () => updateKalkulasiHPP(mode)); elYield.setAttribute('data-bound', 'true'); }
    const hargaJual = getNilaiAsli(elHargaJual.value);
    const yieldPorsi = parseFloat(elYield.value) || 1;
    const totalBahanPokok = dataArr.reduce((sum, item) => sum + item.subtotal, 0);
    const costPerPorsiBase = (totalBahanPokok / yieldPorsi);
    const overhead = appSettings.overhead_type === 'persen' 
        ? (costPerPorsiBase * (appSettings.overhead_value / 100)) 
        : appSettings.overhead_value;
    const hppPerPorsi = costPerPorsiBase + overhead;
    const marginValue = hargaJual - hppPerPorsi;
    const hppValue = hargaJual > 0 ? (hppPerPorsi / hargaJual) * 100 : 0;
    document.getElementById(prefix + 'total-cost').innerText = formatRp(hppPerPorsi);
    if (mode !== 'edit') document.getElementById(prefix + 'target-jual').innerText = formatRp(hargaJual);
    const elMargin = document.getElementById(prefix + 'margin');
    elMargin.innerText = formatRp(marginValue);
    if (marginValue < 0) elMargin.className = 'font-bold text-red-500';
    else if (marginValue > 0) elMargin.className = 'font-bold text-emerald-500';
    else elMargin.className = 'font-bold text-gray-900 dark:text-gray-100';

    const elHPP = document.getElementById(prefix + 'persentase');
    elHPP.innerText = hppValue.toFixed(2) + '%';
    if (hppValue > appSettings.hpp_limit) elHPP.className = 'font-black text-lg text-red-500';
    else if (hppValue < appSettings.hpp_limit) elHPP.className = 'font-black text-lg text-emerald-500';
    else elHPP.className = 'font-black text-lg text-gray-900 dark:text-gray-100';
}
async function simpanResepFinal() {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    let nama = document.getElementById('r-nama').value.trim();
    let kategori = document.getElementById('r-kategori').value;
    let sub = document.getElementById('r-sub').value;
    const harga_jual = getNilaiAsli(document.getElementById('r-harga-jual').value);
    const yield_porsi = parseFloat(document.getElementById('r-yield').value) || 1;
    if (!kategori || kategori === '') kategori = 'Uncategorized';
    if (!sub || sub === '') sub = 'Uncategorized';
    if (!nama || tempKomposisiBaru.length === 0) return alert("Lengkapi data menu dan minimal 1 resep bahan!");
    showLoading();
    const { data: resepData, error: resepErr } = await supabaseClient.from('resep').insert([{ nama, kategori, sub_kategori: sub, harga_jual, yield: yield_porsi }]).select();
    if (resepErr) { hideLoading(); return alert("Gagal menyimpan resep baru."); }
    const { error: detailErr } = await supabaseClient.from('resep_detail').insert(tempKomposisiBaru.map(item => ({ resep_id: resepData[0].id, bahan_baku_id: item.bahan_baku_id, qty: item.qty })));
    hideLoading();
    if (!detailErr) {
        alert("Resep Berhasil Disimpan!");
        document.getElementById('r-nama').value = '';
        document.getElementById('r-kategori').value = 'Uncategorized';
        document.getElementById('r-sub').value = 'Uncategorized';
        document.getElementById('r-harga-jual').value = '';
        document.getElementById('r-yield').value = '1';
        tempKomposisiBaru = [];
        renderKomposisi('baru');
        switchTab('tab-hpp');
    }
}
async function duplikasiResepCard(id, namaMenu) {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    if (!confirm(`Apakah Anda yakin ingin menduplikasi resep "${namaMenu}"?`)) return;
    showLoading();
    try {
        const { data: mainResep, error: errResep } = await supabaseClient.from('resep').select('*').eq('id', id).single();
        if (errResep || !mainResep) throw new Error("Gagal mengunduh struktur menu master.");
        const { data: detailResep, error: errDetail } = await supabaseClient.from('resep_detail').select('*').eq('resep_id', id);
        if (errDetail) throw new Error("Gagal mengunduh komposisi bahan resep baku.");
        const cloneNama = `copy - ${mainResep.nama}`;
        const { data: insertedResep, error: errInsert } = await supabaseClient.from('resep').insert([{
            nama: cloneNama,
            kategori: mainResep.kategori,
            sub_kategori: mainResep.sub_kategori,
            harga_jual: mainResep.harga_jual,
            yield: mainResep.yield
        }]).select();
        if (errInsert || !insertedResep) throw new Error("Gagal membuat duplikasi profile resep.");
        if (detailResep && detailResep.length > 0) {
            const batchDetails = detailResep.map(d => ({
                resep_id: insertedResep[0].id,
                bahan_baku_id: d.bahan_baku_id,
                qty: d.qty
            }));
            const { error: errBatch } = await supabaseClient.from('resep_detail').insert(batchDetails);
            if (errBatch) throw new Error("Gagal mengkloning rincian gramasi bahan baku.");
        }
        alert(`Sukses! Berhasil menduplikasi menu "${cloneNama}".`);
        loadDirektori();
    } catch (err) {
        alert(err.message);
    } finally {
        hideLoading();
    }
}


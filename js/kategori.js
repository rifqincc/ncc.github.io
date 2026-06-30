import { getSupabase, listKategori, listSubKategori, assignMenuTempData, cachedResepSummaryData } from './config.js';
import { showLoading, hideLoading, closeModal, showToast } from './ui.js';
import { hasRole } from './auth.js';
import { loadDirektori } from './resep.js';

// ===== KATEGORI =====

export async function loadKategoriDB() {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('kategori_db').select('*').order('nama');
    if (!error && data) {
        listKategori.length = 0;
        listSubKategori.length = 0;
        data.forEach(d => {
            if (d.jenis === 'Kategori') listKategori.push(d);
            else if (d.jenis === 'Sub-Kategori') listSubKategori.push(d);
        });
        renderDropdownKategori();
        renderTabelManajemenKategori();
        populateFilterKategoriDirektori();
        populateKategoriFilterPenjualan();
        populateDiscountDropdowns();
    }
}

export function renderDropdownKategori() {
    const optKat = '<option value="Uncategorized">-- Pilih Kategori --</option>' + listKategori.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('');
    const optSub = '<option value="Uncategorized">-- Pilih Sub-Kategori --</option>' + listSubKategori.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('');
    ['r-kategori', 'edit-r-kategori'].forEach(id => { 
        const el = document.getElementById(id);
        if (el) el.innerHTML = optKat; 
    });
    ['r-sub', 'edit-r-sub'].forEach(id => { 
        const el = document.getElementById(id);
        if (el) el.innerHTML = optSub; 
    });
    const fSum = document.getElementById('filter-summary-kat');
    if (fSum) {
        fSum.innerHTML = '<option value="all">Semua Kategori</option>' + listKategori.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('');
    }
}

export function populateFilterKategoriDirektori() {
    const filterEl = document.getElementById('filter-kategori-direktori');
    if (!filterEl) return;
    const currentVal = filterEl.value;
    filterEl.innerHTML = '<option value="all">Semua Kategori</option>' + listKategori.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('');
    filterEl.value = currentVal;
}

export function populateKategoriFilterPenjualan() {
    const filterEl = document.getElementById('jual-filter-kategori');
    if (!filterEl) return;
    const currentVal = filterEl.value;
    filterEl.innerHTML = '<option value="all">Semua Kategori</option>' + listKategori.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('');
    filterEl.value = currentVal;
}

export function populateDiscountDropdowns() {
    const catSelect = document.getElementById('discount-category');
    const subSelect = document.getElementById('discount-subcategory');
    if (!catSelect || !subSelect) return;
    const currentCat = catSelect.value;
    catSelect.innerHTML = '<option value="all">Semua Kategori</option>' + listKategori.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('');
    catSelect.value = currentCat;
    updateDiscountSubcategory();
}

export function updateDiscountSubcategory() {
    const catSelect = document.getElementById('discount-category');
    const subSelect = document.getElementById('discount-subcategory');
    if (!catSelect || !subSelect) return;
    const selectedCat = catSelect.value;
    const currentSub = subSelect.value;
    if (selectedCat === 'all') {
        subSelect.innerHTML = '<option value="all">Semua Sub-Kategori</option>' + listSubKategori.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('');
        subSelect.disabled = false;
    } else {
        const filteredSubs = listSubKategori.filter(sub => {
            return cachedResepSummaryData.some(menu => 
                menu.kategori === selectedCat && menu.sub_kategori === sub.nama
            );
        });
        if (filteredSubs.length > 0) {
            subSelect.innerHTML = '<option value="all">Semua Sub-Kategori</option>' + filteredSubs.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('');
            subSelect.disabled = false;
        } else {
            subSelect.innerHTML = '<option value="all">Tidak ada sub-kategori</option>';
            subSelect.disabled = true;
        }
    }
    subSelect.value = currentSub;
}

export function renderTabelManajemenKategori() {
    const ulKat = document.getElementById('list-manajemen-kategori');
    const ulSub = document.getElementById('list-manajemen-sub-kategori');
    if (!ulKat || !ulSub) return;
    const canEdit = hasRole('senior_bar');
    const generateHTML = (list, jenis) => {
        if (list.length === 0) return `<li class="text-sm text-gray-400 dark:text-gray-500 italic p-3 text-center border border-dashed rounded-lg">Belum ada data</li>`;
        return list.map(k => `
            <li class="flex justify-between items-center bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-3 rounded-lg relative hover:bg-white dark:hover:bg-gray-600 transition-colors">
                <span class="font-semibold text-gray-700 dark:text-gray-300 truncate pr-4">${k.nama}</span>
                ${canEdit ? `<div class="relative">
                    <button onclick="window.toggleKebabMenu(event, 'drop-kat-${k.id}')" class="kebab-btn bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 w-8 h-8 rounded-lg font-bold shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">⋮</button>
                    <div id="drop-kat-${k.id}" class="dropdown-menu hidden absolute right-0 mt-1 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 w-44 py-2 text-sm text-gray-700 dark:text-gray-300 z-50 overflow-hidden" style="top:100%;">
                        <button onclick="window.bukaModalFormKategori('${jenis}', 'edit', ${k.id}, '${k.nama.replace(/'/g, "\\'")}')" class="w-full block text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold text-blue-600 dark:text-blue-400">📝 Edit Nama</button>
                        <button onclick="window.bukaModalAssignMenu('${jenis}', '${k.nama.replace(/'/g, "\\'")}')" class="w-full block text-left px-4 py-2 hover:bg-green-50 dark:hover:bg-green-900/30 font-bold text-green-600 dark:text-green-400 border-b border-gray-100 dark:border-gray-700">➕ Tambahkan Menu</button>
                        <button onclick="window.hapusKategoriManajemen(${k.id}, '${jenis}', '${k.nama.replace(/'/g, "\\'")}')" class="w-full block text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold text-red-600 dark:text-red-400 mt-1">🗑️ Hapus Master</button>
                    </div>
                </div>` : ''}
            </li>
        `).join('');
    };
    ulKat.innerHTML = generateHTML(listKategori, 'Kategori');
    ulSub.innerHTML = generateHTML(listSubKategori, 'Sub-Kategori');
}

export function bukaModalFormKategori(jenis, mode, id = null, oldName = '') {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    document.getElementById('kat-modal-jenis').value = jenis;
    document.getElementById('kat-modal-mode').value = mode;
    document.getElementById('kat-modal-id').value = id || '';
    document.getElementById('kat-modal-oldname').value = oldName || '';
    document.getElementById('kat-modal-label').innerText = `Nama Master ${jenis}`;
    const inputEl = document.getElementById('kat-modal-input');
    if (mode === 'tambah') {
        document.getElementById('kat-modal-title').innerText = `Tambah Master ${jenis} Baru`;
        inputEl.value = '';
    } else {
        document.getElementById('kat-modal-title').innerText = `Ubah Nama ${jenis}`;
        inputEl.value = oldName;
    }
    document.getElementById('modal-kelola-kategori').classList.remove('hidden');
}

export async function simpanKategoriManajemen() {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    const jenis = document.getElementById('kat-modal-jenis').value;
    const mode = document.getElementById('kat-modal-mode').value;
    const id = document.getElementById('kat-modal-id').value;
    const oldName = document.getElementById('kat-modal-oldname').value;
    const inputName = document.getElementById('kat-modal-input').value.trim();
    if (!inputName) return alert(`Masukkan nama ${jenis} dengan benar!`);
    showLoading();
    const supabase = getSupabase();
    if (mode === 'tambah') {
        await supabase.from('kategori_db').insert([{ jenis: jenis, nama: inputName }]);
        closeModal('modal-kelola-kategori');
        await loadKategoriDB();
        hideLoading();
        if (confirm(`Sukses! ${jenis} "${inputName}" berhasil dibuat.\n\nApakah Anda ingin langsung memindahkan menu ke dalam kelompok ini?`)) {
            bukaModalAssignMenu(jenis, inputName);
        }
    } else {
        if (inputName === oldName) { hideLoading(); closeModal('modal-kelola-kategori'); return; }
        await supabase.from('kategori_db').update({ nama: inputName }).eq('id', id);
        const fieldTarget = jenis === 'Kategori' ? 'kategori' : 'sub_kategori';
        let updatePayload = {};
        updatePayload[fieldTarget] = inputName;
        await supabase.from('resep').update(updatePayload).eq(fieldTarget, oldName);
        closeModal('modal-kelola-kategori');
        await loadKategoriDB();
        loadDirektori();
        hideLoading();
        alert(`Nama berhasil diubah! Seluruh sinkronisasi data resep aman.`);
    }
}

export async function hapusKategoriManajemen(id, jenis, nama) {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    const targetField = jenis === 'Kategori' ? 'kategori' : 'sub_kategori';
    showLoading();
    const supabase = getSupabase();
    const { data: affectedMenus } = await supabase.from('resep').select('id, nama').eq(targetField, nama);
    hideLoading();
    let msgConfirm = `Anda yakin ingin menghapus ${jenis} "${nama}" secara permanen?`;
    if (affectedMenus && affectedMenus.length > 0) {
        let menuNames = affectedMenus.map(m => `- ${m.nama}`).slice(0, 10).join('\n');
        if (affectedMenus.length > 10) menuNames += `\n... dan ${affectedMenus.length - 10} menu lainnya.`;
        msgConfirm = `PERINGATAN!\nMenghapus ${jenis} "${nama}" akan mengubah ${affectedMenus.length} menu berikut menjadi "Uncategorized":\n\n${menuNames}\n\nLanjutkan penghapusan?`;
    }
    if (confirm(msgConfirm)) {
        showLoading();
        if (affectedMenus && affectedMenus.length > 0) {
            let updatePayload = {};
            updatePayload[targetField] = 'Uncategorized';
            await supabase.from('resep').update(updatePayload).eq(targetField, nama);
        }
        await supabase.from('kategori_db').delete().eq('id', id);
        await loadKategoriDB();
        loadDirektori();
        hideLoading();
        showToast(`${jenis} "${nama}" berhasil dihapus.`, 'success');
    }
}

export async function bukaModalAssignMenu(jenis, namaTarget) {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    document.getElementById('assign-target-nama').value = namaTarget;
    document.getElementById('assign-target-jenis').value = jenis;
    document.getElementById('assign-modal-title').innerText = `Tambah Menu ke ${namaTarget}`;
    document.getElementById('assign-modal-subtitle').innerText = `Pilih menu yang akan dipindahkan ke ${jenis} ini.`;
    document.getElementById('search-assign-menu').value = '';
    showLoading();
    const supabase = getSupabase();
    const { data } = await supabase.from('resep').select('id, nama, kategori, sub_kategori').order('nama');
    hideLoading();
    assignMenuTempData.length = 0;
    if (data) assignMenuTempData.push(...data);
    renderAssignMenuList();
    document.getElementById('modal-assign-menu').classList.remove('hidden');
}

export function renderAssignMenuList() {
    const listContainer = document.getElementById('assign-menu-list');
    const searchQ = document.getElementById('search-assign-menu').value.toLowerCase();
    const jenis = document.getElementById('assign-target-jenis').value;
    const namaTarget = document.getElementById('assign-target-nama').value;
    const targetField = jenis === 'Kategori' ? 'kategori' : 'sub_kategori';
    listContainer.innerHTML = '';
    assignMenuTempData.forEach(menu => {
        if (searchQ && !menu.nama.toLowerCase().includes(searchQ)) return;
        const currentVal = menu[targetField] || 'Uncategorized';
        const isAlreadyInTarget = currentVal === namaTarget;
        const isChecked = isAlreadyInTarget ? 'checked disabled' : '';
        let badgeHTML = '';
        if (isAlreadyInTarget) {
            badgeHTML = `<span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded border border-green-200 dark:border-green-800">Sudah Masuk Kategori Ini</span>`;
        } else if (currentVal !== 'Uncategorized' && currentVal !== '-') {
            badgeHTML = `<span class="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 max-w-[120px] truncate">Saat ini: ${currentVal}</span>`;
        } else {
            badgeHTML = `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600">Uncategorized</span>`;
        }
        listContainer.innerHTML += `
            <label class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors ${isAlreadyInTarget ? 'opacity-60' : ''}">
                <div class="flex items-center gap-3">
                    <input type="checkbox" class="assign-checkbox w-5 h-5 text-[#FF3B30] rounded focus:ring-[#FF3B30]" value="${menu.id}" data-current="${currentVal}" ${isChecked}>
                    <span class="font-bold text-gray-700 dark:text-gray-300">${menu.nama}</span>
                </div>
                ${badgeHTML}
            </label>
        `;
    });
}

export function filterAssignMenu() { renderAssignMenuList(); }

export async function simpanAssignMenu() {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    const jenis = document.getElementById('assign-target-jenis').value;
    const namaTarget = document.getElementById('assign-target-nama').value;
    const targetField = jenis === 'Kategori' ? 'kategori' : 'sub_kategori';
    const checkboxes = document.querySelectorAll('.assign-checkbox:checked:not(:disabled)');
    let menusToMove = [];
    let conflictMenus = [];
    checkboxes.forEach(cb => {
        const menuId = cb.value;
        const currentVal = cb.getAttribute('data-current');
        const menuData = assignMenuTempData.find(m => m.id == menuId);
        menusToMove.push(menuId);
        if (currentVal !== 'Uncategorized' && currentVal !== '-' && currentVal !== namaTarget) {
            conflictMenus.push(`- ${menuData.nama} (Awalnya: ${currentVal})`);
        }
    });
    if (menusToMove.length === 0) return alert("Tidak ada menu baru yang dipilih untuk dipindahkan.");
    if (conflictMenus.length > 0) {
        let warnText = conflictMenus.slice(0, 10).join('\n');
        if (conflictMenus.length > 10) warnText += `\n... dan ${conflictMenus.length - 10} menu lainnya.`;
        if (!confirm(`Beberapa menu sudah memiliki ${jenis} lain sebelumnya:\n\n${warnText}\n\nYakin ingin menimpanya dan memindahkan mereka ke "${namaTarget}"?`)) return;
    }
    showLoading();
    const supabase = getSupabase();
    let updatePayload = {};
    updatePayload[targetField] = namaTarget;
    const { error } = await supabase.from('resep').update(updatePayload).in('id', menusToMove);
    hideLoading();
    if (error) { 
        showToast("Gagal memindahkan menu.", 'error'); 
    } else {
        closeModal('modal-assign-menu');
        loadDirektori();
        showToast("Update Berhasil! Menu sudah dipindahkan.", 'success');
    }
}

import { getSupabase, bahanBakuList, bbCurrentPage, bbItemsPerPage, bbSortKey, bbSortOrder } from './config.js';
import { formatRp, getNilaiAsli, formatRupiahInput } from './helpers.js';
import { showLoading, hideLoading, closeModal, showToast } from './ui.js';
import { hasRole } from './auth.js';
import { loadDirektori } from './resep.js';

// ===== BAHAN BAKU =====

export function kalkulasiHargaSatuBB(mode) {
    const prefix = mode === 'edit' ? 'edit-bb-' : 'bb-';
    const hrgBeli = getNilaiAsli(document.getElementById(prefix + 'harga-beli').value);
    const konversi = parseFloat(document.getElementById(prefix + 'konversi').value) || 1;
    const satuan = document.getElementById(prefix + 'satuan-resep').value || '-';
    document.getElementById(prefix + 'harga-final').innerText = `${formatRp(hrgBeli / (konversi > 0 ? konversi : 1))} / ${satuan}`;
}

export function sortBahanBaku(key, order) {
    bbSortKey = key; 
    bbSortOrder = order; 
    bbCurrentPage = 1;
    document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
    renderTabelBahanBaku();
}

export async function loadBahanBaku() {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('bahan_baku').select('*');
    if (!error) { 
        bahanBakuList.length = 0;
        bahanBakuList.push(...data); 
        renderTabelBahanBaku(); 
    }
}

export function updatePaginationBB() {
    bbCurrentPage = 1;
    const val = document.getElementById('bb-per-page').value;
    bbItemsPerPage = val === 'all' ? bahanBakuList.length : parseInt(val);
    renderTabelBahanBaku();
}

export function ubahHalamanBB(page) { 
    bbCurrentPage = page; 
    renderTabelBahanBaku(); 
}

export function renderTabelBahanBaku() {
    const searchQuery = document.getElementById('search-bb').value.toLowerCase();
    let filteredData = bahanBakuList.filter(item => item.nama.toLowerCase().includes(searchQuery));
    filteredData.sort((a, b) => {
        let valA = a[bbSortKey] !== null && a[bbSortKey] !== undefined ? a[bbSortKey] : '';
        let valB = b[bbSortKey] !== null && b[bbSortKey] !== undefined ? b[bbSortKey] : '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return bbSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return bbSortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    const totalData = filteredData.length;
    const isAll = document.getElementById('bb-per-page').value === 'all';
    let limit = isAll ? totalData : bbItemsPerPage;
    if (limit === 0) limit = 1;
    const totalPages = Math.ceil(totalData / limit);
    const startIndex = (bbCurrentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const pageData = filteredData.slice(startIndex, endIndex);
    const tbody = document.getElementById('table-bahan-baku');
    tbody.innerHTML = '';
    if (totalData === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-gray-400 italic">Bahan baku tidak ditemukan.</td></tr>`;
    } else {
        const canEdit = hasRole('admin');
        pageData.forEach(item => {
            tbody.innerHTML += `
            <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors relative">
                <td class="p-4 font-bold text-gray-700 dark:text-gray-300 truncate max-w-xs border-r dark:border-gray-700">${item.nama}</td>
                <td class="p-3 border-l text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">${item.satuan_beli || '-'}</td>
                <td class="p-3 border-r font-semibold text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-800/50">${item.harga_beli ? formatRp(item.harga_beli) : '-'}</td>
                <td class="p-3 text-gray-500 dark:text-gray-400">${item.nilai_konversi || 1} ${item.satuan}</td>
                <td class="p-3 text-[#FF3B30] font-black">${formatRp(item.harga)} <span class="text-xs text-gray-400 dark:text-gray-500 font-normal">/ ${item.satuan}</span></td>
                <td class="p-3 text-center border-l dark:border-gray-700 ${canEdit ? '' : 'hidden'}">
                    <div class="relative inline-block">
                        <button onclick="window.toggleKebabMenu(event, 'drop-bb-${item.id}')" class="kebab-btn bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 w-8 h-8 rounded-lg font-bold shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">⋮</button>
                        <div id="drop-bb-${item.id}" class="dropdown-menu hidden absolute right-0 mt-1 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 w-32 py-2 text-sm text-gray-700 dark:text-gray-300 z-[70] overflow-hidden" style="top:100%;">
                            <button onclick="window.bukaModalEditBB(${JSON.stringify(item).replace(/"/g, '&quot;')})" class="w-full block text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold text-blue-600 dark:text-blue-400">📝 Edit</button>
                            <button onclick="window.aksiHapusBahanBaku(${item.id}, '${item.nama}')" class="w-full block text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold text-red-600 dark:text-red-400 border-t border-gray-100 dark:border-gray-700 mt-1">🗑️ Hapus</button>
                        </div>
                    </div>
                </td>
            </tr>`;
        });
    }
    document.getElementById('bb-info-halaman').innerText = `Menampilkan ${totalData > 0 ? startIndex + 1 : 0} - ${Math.min(endIndex, totalData)} dari ${totalData} data`;
    let btnHTML = '';
    if (!isAll && totalPages > 1) {
        btnHTML += `<button onclick="window.ubahHalamanBB(${Math.max(1, bbCurrentPage - 1)})" class="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium ${bbCurrentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">Prev</button>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === bbCurrentPage || i === 1 || i === totalPages || (i >= bbCurrentPage - 1 && i <= bbCurrentPage + 1)) {
                let active = i === bbCurrentPage ? 'bg-[#FF3B30] text-white border-[#FF3B30] shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
                btnHTML += `<button onclick="window.ubahHalamanBB(${i})" class="px-3 py-1.5 border rounded-lg font-medium ${active}">${i}</button>`;
            } else if (i === 2 || i === totalPages - 1) {
                btnHTML += `<span class="px-2 text-gray-400">...</span>`;
            }
        }
        btnHTML += `<button onclick="window.ubahHalamanBB(${Math.min(totalPages, bbCurrentPage + 1)})" class="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium ${bbCurrentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">Next</button>`;
    }
    document.getElementById('bb-pagination-controls').innerHTML = btnHTML;
}

export async function tambahBahanBaku() {
    if (!hasRole('admin')) return alert('Akses ditolak.');
    const nama = document.getElementById('bb-nama').value.trim();
    const satuanBeli = document.getElementById('bb-satuan-beli').value.trim();
    const hargaBeli = getNilaiAsli(document.getElementById('bb-harga-beli').value);
    const konversi = parseFloat(document.getElementById('bb-konversi').value);
    const satuanResep = document.getElementById('bb-satuan-resep').value.trim();
    if (!nama || !satuanBeli || !hargaBeli || !konversi || !satuanResep) return alert("Lengkapi semua kolom!");
    showLoading();
    const supabase = getSupabase();
    const { error } = await supabase.from('bahan_baku').insert([{ 
        nama, 
        satuan_beli: satuanBeli, 
        harga_beli: hargaBeli, 
        nilai_konversi: konversi, 
        satuan: satuanResep, 
        harga: (hargaBeli / konversi) 
    }]);
    hideLoading();
    if (error) {
        showToast("Gagal menyimpan bahan baku!", 'error');
    } else {
        showToast("Berhasil ditambahkan!", 'success');
        ['nama', 'satuan-beli', 'harga-beli', 'konversi', 'satuan-resep'].forEach(id => document.getElementById('bb-' + id).value = '');
        kalkulasiHargaSatuBB('baru');
        loadBahanBaku();
    }
}

export async function aksiHapusBahanBaku(id, nama) {
    if (!hasRole('admin')) return alert('Akses ditolak.');
    if (confirm(`Yakin hapus "${nama}"?`)) {
        showLoading();
        const supabase = getSupabase();
        const { error } = await supabase.from('bahan_baku').delete().eq('id', id);
        hideLoading();
        if (error) {
            if (error.code === '23503') showToast(`DITOLAK: "${nama}" masih digunakan dalam resep.`, 'error');
            else showToast("Gagal hapus.", 'error');
        } else {
            loadBahanBaku();
            showToast(`"${nama}" berhasil dihapus.`, 'success');
        }
    }
}

export function bukaModalEditBB(item) {
    if (!hasRole('admin')) return alert('Akses ditolak.');
    document.getElementById('edit-bb-id').value = item.id;
    document.getElementById('edit-bb-nama').value = item.nama;
    document.getElementById('edit-bb-satuan-beli').value = item.satuan_beli || '';
    document.getElementById('edit-bb-harga-beli').value = item.harga_beli ? item.harga_beli.toString() : '';
    formatRupiahInput(document.getElementById('edit-bb-harga-beli'));
    document.getElementById('edit-bb-konversi').value = item.nilai_konversi || '';
    document.getElementById('edit-bb-satuan-resep').value = item.satuan;
    kalkulasiHargaSatuBB('edit');
    document.getElementById('modal-edit-bb').classList.remove('hidden');
}

export async function simpanEditBahanBaku() {
    if (!hasRole('admin')) return alert('Akses ditolak.');
    const id = document.getElementById('edit-bb-id').value;
    const nama = document.getElementById('edit-bb-nama').value.trim();
    const satuanBeli = document.getElementById('edit-bb-satuan-beli').value.trim();
    const hargaBeli = getNilaiAsli(document.getElementById('edit-bb-harga-beli').value);
    const konversi = parseFloat(document.getElementById('edit-bb-konversi').value);
    const satuanResep = document.getElementById('edit-bb-satuan-resep').value.trim();
    if (!nama || !hargaBeli) return alert("Lengkapi data!");
    showLoading();
    const supabase = getSupabase();
    const { error } = await supabase.from('bahan_baku').update({ 
        nama, 
        satuan_beli: satuanBeli, 
        harga_beli: hargaBeli, 
        nilai_konversi: konversi, 
        satuan: satuanResep, 
        harga: (hargaBeli / konversi) 
    }).eq('id', id);
    hideLoading();
    if (error) {
        showToast("Gagal memperbarui data!", 'error');
    } else {
        closeModal('modal-edit-bb');
        loadBahanBaku();
        loadDirektori();
        showToast("Data berhasil diperbarui.", 'success');
    }
}

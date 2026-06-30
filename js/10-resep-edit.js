// ==================== EDIT RESEP ====================
async function bukaModalEditResep(menuObj) {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    await loadDropdownBahanBaku('edit');
    document.getElementById('edit-r-pilih-bb').value = '';
    document.getElementById('edit-r-bb-selected-id').value = '';
    document.getElementById('edit-r-qty-bb').value = '';
    document.getElementById('edit-r-id').value = menuObj.id;
    document.getElementById('edit-r-nama').value = menuObj.nama;
    document.getElementById('edit-r-kategori').value = menuObj.kategori || 'Uncategorized';
    document.getElementById('edit-r-sub').value = menuObj.sub_kategori || 'Uncategorized';
    document.getElementById('edit-r-harga-jual').value = menuObj.harga_jual.toString();
    formatRupiahInput(document.getElementById('edit-r-harga-jual'));
    document.getElementById('edit-r-yield').value = menuObj.yield || 1;
    tempKomposisiEdit = menuObj.resep_detail.map(det => {
        if (!det.bahan_baku) return null;
        return { bahan_baku_id: det.bahan_baku_id, nama: det.bahan_baku.nama, satuan: det.bahan_baku.satuan, qty: det.qty, subtotal: det.qty * det.bahan_baku.harga };
    }).filter(item => item !== null);
    renderKomposisi('edit');
    document.getElementById('modal-edit-resep').classList.remove('hidden');
}
async function simpanEditResep() {
    if (!hasRole('senior_bar')) return alert('Akses ditolak.');
    const resepId = document.getElementById('edit-r-id').value;
    const nama = document.getElementById('edit-r-nama').value.trim();
    let kategori = document.getElementById('edit-r-kategori').value;
    let sub = document.getElementById('edit-r-sub').value;
    const harga_jual = getNilaiAsli(document.getElementById('edit-r-harga-jual').value);
    const yield_porsi = parseFloat(document.getElementById('edit-r-yield').value) || 1;
    if (!kategori || kategori === '') kategori = 'Uncategorized';
    if (!sub || sub === '') sub = 'Uncategorized';
    if (!nama || tempKomposisiEdit.length === 0) return alert("Nama dan komposisi wajib diisi!");
    showLoading();
    await supabaseClient.from('resep').update({ nama, kategori, sub_kategori: sub, harga_jual, yield: yield_porsi }).eq('id', resepId);
    await supabaseClient.from('resep_detail').delete().eq('resep_id', resepId);
    await supabaseClient.from('resep_detail').insert(tempKomposisiEdit.map(item => ({ resep_id: resepId, bahan_baku_id: item.bahan_baku_id, qty: item.qty })));
    hideLoading();
    closeModal('modal-edit-resep');
    loadDirektori();
}


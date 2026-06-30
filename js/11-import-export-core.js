// ==================== IMPORT / EXPORT ====================
function initiateImport(event, type) {
    fileImportTertunda = event.target.files[0];
    if (!fileImportTertunda) return;
    jenisImportTertunda = type;
    document.getElementById('modal-import-option').classList.remove('hidden');
}
function batalImport() {
    fileImportTertunda = null;
    jenisImportTertunda = '';
    document.getElementById('import-bb-file').value = '';
    document.getElementById('import-resep-file').value = '';
    if (document.getElementById('import-kat-file')) document.getElementById('import-kat-file').value = '';
    if (document.getElementById('import-penjualan-file')) document.getElementById('import-penjualan-file').value = '';
    closeModal('modal-import-option');
}
function jalankanImport(mode) {
    closeModal('modal-import-option');
    showLoading();
    if (jenisImportTertunda === 'bb') eksekusiImportBahanBaku(mode);
    else if (jenisImportTertunda === 'resep') eksekusiImportResep(mode);
    else if (jenisImportTertunda === 'penjualan') eksekusiImportPenjualan(mode);
    else eksekusiImportKategori(mode);
}


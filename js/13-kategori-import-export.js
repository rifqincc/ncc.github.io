// ==================== KATEGORI IMPORT/EXPORT ====================
function downloadTemplateKategori() {
    const ws = XLSX.utils.json_to_sheet([{ "Nama": "Coffee Series", "Jenis": "Kategori" }, { "Nama": "Espresso Based", "Jenis": "Sub-Kategori" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Kategori");
    XLSX.writeFile(wb, "Template_Kategori_Master.xlsx");
}
function exportKategoriToExcel() {
    const listGabung = [
        ...listKategori.map(k => ({ "ID": k.id, "Nama": k.nama, "Jenis": "Kategori" })),
        ...listSubKategori.map(s => ({ "ID": s.id, "Nama": s.nama, "Jenis": "Sub-Kategori" }))
    ];
    const ws = XLSX.utils.json_to_sheet(listGabung);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kategori_DB");
    XLSX.writeFile(wb, "Kategori_Export.xlsx");
}
function eksekusiImportKategori(mode) {
    if (!hasRole('senior_bar')) { hideLoading(); alert('Akses ditolak.'); batalImport(); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const rows = XLSX.utils.sheet_to_json(XLSX.read(new Uint8Array(e.target.result), { type: 'array' }).Sheets[XLSX.read(new Uint8Array(e.target.result), { type: 'array' }).SheetNames[0]]);
            const cleanData = rows.map(r => ({ nama: String(r["Nama"] || "").trim(), jenis: String(r["Jenis"] || "").trim() })).filter(r => r.nama && (r.jenis === 'Kategori' || r.jenis === 'Sub-Kategori'));
            if (cleanData.length === 0) { hideLoading(); alert("Data Excel kosong / tidak valid!"); batalImport(); return; }
            if (mode === 'replace') await supabaseClient.from('kategori_db').delete().neq('id', 0);
            let successCount = 0, failCount = 0;
            const { data: ext } = await supabaseClient.from('kategori_db').select('*');
            const mapCheck = {};
            ext.forEach(x => mapCheck[`${x.nama.toLowerCase()}-${x.jenis.toLowerCase()}`] = x.id);
            for (let r of cleanData) {
                const uniqueKey = `${r.nama.toLowerCase()}-${r.jenis.toLowerCase()}`;
                if (mapCheck[uniqueKey]) {
                    successCount++;
                } else {
                    const { error } = await supabaseClient.from('kategori_db').insert([r]);
                    if (error) failCount++; else successCount++;
                }
            }
            hideLoading();
            batalImport();
            await loadKategoriDB();
            showSummaryModal(failCount === 0, 'Import Kategori Master Selesai', successCount, failCount);
        } catch (err) {
            hideLoading();
            alert("Gagal mengolah file kategori.");
            batalImport();
        }
    };
    reader.readAsArrayBuffer(fileImportTertunda);
}


// ==================== BAHAN BAKU IMPORT/EXPORT ====================
function downloadTemplateBahanBaku() {
    const ws = XLSX.utils.json_to_sheet([{ "Nama Bahan": "Susu UHT", "Satuan Beli": "Karton", "Harga Beli": 240000, "Nilai Konversi (Yield)": 12000, "Satuan Pemakaian Resep": "ml" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Bahan_Baku.xlsx");
}
function exportBahanBakuToExcel() {
    const ws = XLSX.utils.json_to_sheet(bahanBakuList.map(i => ({ "ID": i.id, "Nama Bahan": i.nama, "Satuan Beli": i.satuan_beli, "Harga Beli": i.harga_beli, "Konversi": i.nilai_konversi, "Satuan Resep": i.satuan, "Harga per Satuan": i.harga })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "BahanBaku_Export.xlsx");
}
function eksekusiImportBahanBaku(mode) {
    if (!hasRole('admin')) { hideLoading(); alert('Akses ditolak.'); batalImport(); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const rows = XLSX.utils.sheet_to_json(XLSX.read(new Uint8Array(e.target.result), { type: 'array' }).Sheets[XLSX.read(new Uint8Array(e.target.result), { type: 'array' }).SheetNames[0]]);
            const cleanData = rows.map(r => {
                const h = parseFloat(r["Harga Beli"] || 0);
                const k = parseFloat(r["Nilai Konversi (Yield)"] || 1);
                return { nama: String(r["Nama Bahan"]).trim(), satuan_beli: r["Satuan Beli"], harga_beli: h, nilai_konversi: k, satuan: r["Satuan Pemakaian Resep"], harga: h / k };
            }).filter(r => r.nama && r.nama !== "undefined");
            if (cleanData.length === 0) { hideLoading(); alert("Data kosong!"); batalImport(); return; }
            let successCount = 0, failCount = 0;
            if (mode === 'replace') {
                const { error: delError } = await supabaseClient.from('bahan_baku').delete().neq('id', 0);
                if (delError && delError.code === '23503') { hideLoading(); alert("GAGAL: Bahan baku sedang dipakai di Resep."); batalImport(); return; }
                const { error: insError } = await supabaseClient.from('bahan_baku').insert(cleanData);
                if (insError) { failCount = cleanData.length; } else { successCount = cleanData.length; }
            } else {
                const { data: ext } = await supabaseClient.from('bahan_baku').select('*');
                const nMap = {};
                ext.forEach(i => nMap[i.nama.toLowerCase()] = i.id);
                for (let r of cleanData) {
                    const eId = nMap[r.nama.toLowerCase()];
                    if (eId) {
                        const { error } = await supabaseClient.from('bahan_baku').update(r).eq('id', eId);
                        if (error) failCount++; else successCount++;
                    } else {
                        const { error } = await supabaseClient.from('bahan_baku').insert([r]);
                        if (error) failCount++; else successCount++;
                    }
                }
            }
            hideLoading();
            loadBahanBaku();
            batalImport();
            showSummaryModal(failCount === 0, 'Import Bahan Baku Selesai', successCount, failCount);
        } catch (err) {
            hideLoading();
            alert("Terjadi kesalahan sistem saat membaca Excel.");
            batalImport();
        }
    };
    reader.readAsArrayBuffer(fileImportTertunda);
}


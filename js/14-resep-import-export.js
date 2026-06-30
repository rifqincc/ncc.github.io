// ==================== RESEP IMPORT/EXPORT ====================
function downloadTemplateResep() {
    const ws = XLSX.utils.json_to_sheet([{ "Nama Menu": "Iced Choco Banana", "Kategori": "Beverage", "Sub Kategori": "Non-Coffee", "Harga Jual": 28000, "Yield (Porsi)": 1, "Nama Bahan Baku": "Fresh Milk UHT", "Qty": 160 }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Resep.xlsx");
}
async function exportResepToExcel() {
    const { data } = await supabaseClient.from('resep').select(`nama,kategori,sub_kategori,harga_jual,yield,resep_detail(qty,bahan_baku(nama,satuan,harga))`);
    let rec = [];
    data.forEach(m => m.resep_detail.forEach(d => rec.push({ "Menu": m.nama, "Kategori": m.kategori, "Sub Kategori": m.sub_kategori, "Harga Jual": m.harga_jual, "Yield (Porsi)": m.yield || 1, "Nama Bahan Baku": d.bahan_baku?.nama, "Qty": d.qty, "Satuan": d.bahan_baku?.satuan, "Biaya Total": d.qty * (d.bahan_baku?.harga || 0) })));
    const ws = XLSX.utils.json_to_sheet(rec);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resep");
    XLSX.writeFile(wb, "Resep_Export.xlsx");
}
function eksekusiImportResep(mode) {
    if (!hasRole('senior_bar')) { hideLoading(); alert('Akses ditolak.'); batalImport(); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const rows = XLSX.utils.sheet_to_json(XLSX.read(new Uint8Array(e.target.result), { type: 'array' }).Sheets[XLSX.read(new Uint8Array(e.target.result), { type: 'array' }).SheetNames[0]]);
            if (rows.length === 0) { hideLoading(); alert("Data Excel kosong!"); batalImport(); return; }
            if (mode === 'replace') await supabaseClient.from('resep').delete().neq('id', 0);
            const { data: bbData } = await supabaseClient.from('bahan_baku').select('*');
            const bbMap = {};
            bbData.forEach(b => bbMap[b.nama.toLowerCase().trim()] = b.id);
            let grp = {};
            rows.forEach(r => {
                const m = r["Menu"] || r["Nama Menu"];
                if (!m) return;
                if (!grp[m]) grp[m] = { nama: m, kategori: r["Kategori"] || "Uncategorized", sub_kategori: r["Sub Kategori"] || "Uncategorized", harga_jual: parseFloat(r["Harga Jual"] || 0), yield_porsi: parseFloat(r["Yield (Porsi)"] || 1), ing: [] };
                const mId = bbMap[String(r["Nama Bahan Baku"] || r["Bahan"] || "").toLowerCase().trim()];
                if (mId) grp[m].ing.push({ bahan_baku_id: mId, qty: parseFloat(r["Qty"] || 0) });
            });
            let successCount = 0, failCount = 0;
            for (let k in grp) {
                if (grp[k].ing.length === 0) { failCount++; continue; }
                let rId, hasError = false;
                if (mode === 'modify') {
                    const { data: cR } = await supabaseClient.from('resep').select('id').eq('nama', grp[k].nama).single();
                    if (cR) {
                        rId = cR.id;
                        await supabaseClient.from('resep').update({ kategori: grp[k].kategori, sub_kategori: grp[k].sub_kategori, harga_jual: grp[k].harga_jual, yield: grp[k].yield_porsi }).eq('id', rId);
                        await supabaseClient.from('resep_detail').delete().eq('resep_id', rId);
                    }
                }
                if (!rId) {
                    const { data: nR, error: resepErr } = await supabaseClient.from('resep').insert([{ nama: grp[k].nama, kategori: grp[k].kategori, sub_kategori: grp[k].sub_kategori, harga_jual: grp[k].harga_jual, yield: grp[k].yield_porsi }]).select();
                    if (resepErr) { hasError = true; } else { rId = nR[0].id; }
                }
                if (rId && !hasError) {
                    const { error: detailErr } = await supabaseClient.from('resep_detail').insert(grp[k].ing.map(i => ({ resep_id: rId, bahan_baku_id: i.bahan_baku_id, qty: i.qty })));
                    if (detailErr) hasError = true;
                }
                if (hasError) failCount++; else successCount++;
            }
            hideLoading();
            batalImport();
            loadDirektori();
            showSummaryModal(failCount === 0, 'Import Resep Selesai', successCount, failCount);
        } catch (err) {
            hideLoading();
            alert("Terjadi kesalahan saat mengelola resep!");
            batalImport();
        }
    };
    reader.readAsArrayBuffer(fileImportTertunda);
}


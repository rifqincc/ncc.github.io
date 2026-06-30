import { appSettings } from './config.js';

// ===== HELPERS =====
export const formatRp = (angka) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
}).format(angka);

export function formatRupiahInput(element) {
    let val = element.value.replace(/[^,\d]/g, '').toString();
    let split = val.split(',');
    let sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    let ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    if (ribuan) {
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }
    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    element.value = rupiah;
}

export function getNilaiAsli(stringInput) {
    return parseFloat(String(stringInput).replace(/[^0-9]/g, '')) || 0;
}

export function getCardGradient(str) {
    const gradients = [
        'from-slate-800 to-slate-900', 
        'from-blue-800 to-indigo-900', 
        'from-emerald-800 to-teal-900', 
        'from-rose-800 to-pink-900', 
        'from-amber-800 to-orange-900', 
        'from-purple-800 to-fuchsia-900', 
        'from-cyan-800 to-blue-900', 
        'from-red-800 to-rose-900', 
        'from-lime-800 to-green-900'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
}

export function calculateHPP(totalBiayaBahan, yieldPorsi) {
    const costPerPorsiBase = totalBiayaBahan / (yieldPorsi || 1);
    const overhead = appSettings.overhead_type === 'persen' 
        ? (costPerPorsiBase * (appSettings.overhead_value / 100)) 
        : appSettings.overhead_value;
    return costPerPorsiBase + overhead;
}

export function calculateMargin(hargaJual, hpp) {
    return hargaJual - hpp;
}

export function calculateHPPPersen(hargaJual, hpp) {
    return hargaJual > 0 ? (hpp / hargaJual) * 100 : 0;
}

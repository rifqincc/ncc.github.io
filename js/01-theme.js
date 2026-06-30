// ===== TEMA =====
let currentTheme = 'auto';
function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.toggle('dark', prefersDark);
        currentTheme = 'auto';
        const status = document.getElementById('theme-status');
        if (status) status.innerHTML = `Tema aktif: <span class="font-bold text-[#FF3B30]">Otomatis (${prefersDark ? 'Gelap' : 'Terang'})</span>`;
    } else if (theme === 'dark') {
        html.classList.add('dark');
        currentTheme = 'dark';
        const status = document.getElementById('theme-status');
        if (status) status.innerHTML = `Tema aktif: <span class="font-bold text-[#FF3B30]">Gelap</span>`;
    } else {
        html.classList.remove('dark');
        currentTheme = 'light';
        const status = document.getElementById('theme-status');
        if (status) status.innerHTML = `Tema aktif: <span class="font-bold text-[#FF3B30]">Terang</span>`;
    }
    try { localStorage.setItem('preferred-theme', theme); } catch(e) {}
}
function setTheme(theme) {
    applyTheme(theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('bg-[#FF3B30]', 'text-white', 'border-[#FF3B30]');
        btn.classList.add('bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'border-gray-300', 'dark:border-gray-600');
    });
    const btnMap = { light: 0, dark: 1, auto: 2 };
    const btns = document.querySelectorAll('.theme-btn');
    if (btns[btnMap[theme]]) {
        const btn = btns[btnMap[theme]];
        btn.classList.remove('bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'border-gray-300', 'dark:border-gray-600');
        btn.classList.add('bg-[#FF3B30]', 'text-white', 'border-[#FF3B30]');
    }
}
function loadTheme() {
    let theme = 'auto';
    try { theme = localStorage.getItem('preferred-theme') || 'auto'; } catch(e) {}
    applyTheme(theme);
    const btnMap = { light: 0, dark: 1, auto: 2 };
    const btns = document.querySelectorAll('.theme-btn');
    if (btns[btnMap[theme]]) {
        const btn = btns[btnMap[theme]];
        btn.classList.remove('bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'border-gray-300', 'dark:border-gray-600');
        btn.classList.add('bg-[#FF3B30]', 'text-white', 'border-[#FF3B30]');
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (currentTheme === 'auto') applyTheme('auto');
    });
}

// ---------- HELPERS ----------

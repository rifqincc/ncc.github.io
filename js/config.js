// ===== CONFIGURATION =====
export const SUPABASE_URL = 'https://mslsgobvzzxxkwfvpjhx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbHNnb2J2enp4eGt3ZnZwamh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzAzMDEsImV4cCI6MjA5NzgwNjMwMX0.V7pUmC3En3O0pc3VamJUm9eq7cnB7UFLi333LmtnJqQ';

export const ROLE_HIERARCHY = {
    staff: 1,
    admin: 2,
    senior_bar: 3,
    head_bar: 4
};

// State variables (will be imported/exported)
export let bahanBakuList = [];
export let tempKomposisiBaru = [];
export let tempKomposisiEdit = [];
export let listKategori = [];
export let listSubKategori = [];
export let assignMenuTempData = [];
export let fileImportTertunda = null;
export let jenisImportTertunda = '';
export let bbCurrentPage = 1;
export let bbItemsPerPage = 10;
export let bbSortKey = 'nama';
export let bbSortOrder = 'asc';
export let summarySortKey = 'nama';
export let summarySortAsc = true;
export let cachedResepSummaryData = [];
export let penjualanInputData = {};
export let discountResults = [];
export let discountSortKey = 'index';
export let discountSortAsc = true;

export let currentUser = null;
export let appSettings = {
    hpp_limit: 35,
    overhead_type: 'nominal',
    overhead_value: 0
};
export let currentActiveTab = 'tab-direktori';
export let currentTheme = 'auto';

// Supabase client
export let supabaseClient = null;

export function initSupabase() {
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

export function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

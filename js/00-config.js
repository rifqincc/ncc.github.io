const SUPABASE_URL = 'https://mslsgobvzzxxkwfvpjhx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbHNnb2J2enp4eGt3ZnZwamh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzAzMDEsImV4cCI6MjA5NzgwNjMwMX0.V7pUmC3En3O0pc3VamJUm9eq7cnB7UFLi333LmtnJqQ';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let bahanBakuList = [], tempKomposisiBaru = [], tempKomposisiEdit = [];
let listKategori = [], listSubKategori = [];
let assignMenuTempData = [];
let fileImportTertunda = null, jenisImportTertunda = '';
let bbCurrentPage = 1, bbItemsPerPage = 10;
let bbSortKey = 'nama', bbSortOrder = 'asc';
let summarySortKey = 'nama';
let summarySortAsc = true;
let cachedResepSummaryData = [];
let penjualanInputData = {};
let discountResults = [];
let discountSortKey = 'index';
let discountSortAsc = true;

let currentUser = null;
let appSettings = {
  hpp_limit: 35,
  overhead_type: 'nominal',
  overhead_value: 0
};
let currentActiveTab = 'tab-direktori';


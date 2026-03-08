/* Supabase client — shared across all pages */
const SUPABASE_URL = 'https://oqgybwucpuiqniytmiby.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hb2sbUi_9dAaXJPX13lppg_2J8j9P6A';
// createClient is available after the Supabase CDN script loads
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

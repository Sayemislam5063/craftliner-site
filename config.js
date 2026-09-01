// ==========================================================
// এখানে তোমার Supabase এর তথ্য বসাও (Settings > API Keys থেকে)
// ==========================================================
const SUPABASE_URL = "https://lchbjfihmuknuvkmemce.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_woFPp_4YcLeT5ktf5iOHPA_R6LoAVBu";

// প্রোমো কোড (চাইলে এখানে নতুন কোড যোগ করতে পারবে)
// পার্সেন্ট আকারে ছাড় (যেমন 10 মানে ১০% ছাড়)
const PROMO_CODES = {
  "WELCOME10": 10,
  "EID20": 20
};

// ডেলিভারি চার্জ (টাকায়)
const DELIVERY_CHARGES = {
  dhaka: 70,
  outside: 130
};

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

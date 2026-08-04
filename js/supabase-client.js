"use strict";

(function(){
  const SUPABASE_URL="https://vwgwcvklbkyvgpxxkfot.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY="sb_publishable_M01E7oHWDI5hH-v8THFKHg_3h4_atRN";

  if(!window.supabase?.createClient){
    console.error("Biblioteca do Supabase não foi carregada.");
    return;
  }

  window.WONDERLAND_SUPABASE=window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true
      }
    }
  );
})();

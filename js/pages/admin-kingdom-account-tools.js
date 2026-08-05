"use strict";
(function(){
  const client=window.WONDERLAND_SUPABASE;
  const kingdoms=Array.isArray(window.WONDERLAND_KINGDOMS)?window.WONDERLAND_KINGDOMS:[];
  const host=document.getElementById("adminModuleContent");
  if(!client||!host)return;

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");

  function ensureKingdomField(){
    const form=host.querySelector(".admin-character-form");
    if(!form||form.querySelector('[name="kingdom_id"]'))return;
    const grid=form.querySelector(".admin-character-grid");
    if(!grid)return;
    const summary=form.querySelector(".admin-character-preview small")?.textContent||"";
    const current=(summary.match(/Reino:\s*([^•]+)/i)||[])[1]?.trim()||"";
    const label=document.createElement("label");
    label.className="admin-field";
    label.innerHTML=`<span>Reino</span><select name="kingdom_id"><option value="">Nenhum reino</option>${kingdoms.map(k=>`<option value="${esc(k.id)}" ${k.id===current?"selected":""}>${esc(k.name)}</option>`).join("")}</select>`;
    const imageField=grid.querySelector('[name="image_url"]')?.closest("label");
    grid.insertBefore(label,imageField||null);
  }

  function ensureDeleteAccount(){
    const form=host.querySelector("#adminEditForm");
    const activeUserButton=host.querySelector(".admin-record-button.active");
    if(!form||!activeUserButton||form.dataset.deleteAccountReady==="true")return;
    const id=activeUserButton.querySelector("small")?.textContent?.trim();
    if(!id)return;
    form.dataset.deleteAccountReady="true";
    const actions=form.querySelector(".admin-form-actions");
    if(!actions)return;
    const button=document.createElement("button");
    button.type="button";
    button.className="wl-button wl-button-red";
    button.textContent="Excluir conta";
    actions.prepend(button);
    button.addEventListener("click",async()=>{
      if(!window.confirm("Excluir esta conta e todos os personagens vinculados? Esta ação é permanente."))return;
      button.disabled=true;button.textContent="Excluindo...";
      try{
        const {error}=await client.rpc("admin_delete_user",{target_user_id:id});
        if(error)throw error;
        alert("Conta excluída com sucesso.");
        document.querySelector('[data-admin-module="users"]')?.click();
      }catch(error){
        console.error(error);
        alert(error.message||"Não foi possível excluir a conta. Execute a migração SQL correspondente.");
        button.disabled=false;button.textContent="Excluir conta";
      }
    });
  }

  const observer=new MutationObserver(()=>{ensureKingdomField();ensureDeleteAccount()});
  observer.observe(host,{childList:true,subtree:true});
})();

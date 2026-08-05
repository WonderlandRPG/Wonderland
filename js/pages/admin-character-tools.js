"use strict";
(function(){
  const client=window.WONDERLAND_SUPABASE;
  if(!client)return;

  const cleanImageField=()=>{
    const input=document.querySelector('.admin-character-form input[name="image_url"]');
    if(!input)return;
    input.removeAttribute("required");
    input.setAttribute("inputmode","url");
    input.placeholder="Opcional: deixe vazio para usar a imagem padrão da raça";
  };

  const bindDeleteButton=()=>{
    const form=document.querySelector('.admin-character-form');
    if(!form||form.dataset.deleteReady==="true")return;
    form.dataset.deleteReady="true";
    const editor=form.closest('.admin-character-editor');
    const name=editor?.querySelector('h3')?.textContent?.trim()||"este personagem";
    const relatedButton=[...document.querySelectorAll('[data-character-edit-index]')].find(button=>button.classList.contains('active'));
    const cards=[...document.querySelectorAll('.admin-related-card.admin-character-card')];
    const activeCard=relatedButton?.closest('.admin-related-card.admin-character-card')||cards.find(card=>card.querySelector('h4')?.textContent?.trim()===name);
    const editButton=activeCard?.querySelector('[data-character-edit-index]');
    const index=Number(editButton?.dataset.characterEditIndex);
    if(!Number.isInteger(index))return;

    const actions=form.querySelector('.admin-form-actions');
    if(!actions)return;
    const button=document.createElement('button');
    button.type='button';
    button.className='wl-button wl-button-red admin-delete-character';
    button.textContent='Excluir personagem';
    actions.prepend(button);

    button.addEventListener('click',async()=>{
      const card=cards[index];
      const characterName=card?.querySelector('h4')?.textContent?.trim()||name;
      const confirmed=window.confirm(`Excluir ${characterName}? Esta ação é permanente e também remove atributos, inventário, equipamentos e habilidades vinculadas.`);
      if(!confirmed)return;

      const idText=card?.querySelector('small')?.dataset?.characterId;
      let characterId=idText||null;
      if(!characterId){
        const userButton=document.querySelector('.admin-record-button.active');
        const userId=userButton?.querySelector('small')?.textContent?.trim();
        if(userId){
          const {data,error}=await client.from('characters').select('id,name,created_at').eq('user_id',userId).order('created_at',{ascending:true});
          if(error){alert(error.message||'Não foi possível localizar o personagem.');return;}
          characterId=data?.[index]?.id||data?.find(item=>item.name===characterName)?.id||null;
        }
      }
      if(!characterId){alert('Não foi possível identificar este personagem. Reabra o módulo Usuários e tente novamente.');return;}

      button.disabled=true;
      button.textContent='Excluindo...';
      try{
        const {error}=await client.from('characters').delete().eq('id',characterId);
        if(error)throw error;
        alert(`${characterName} foi excluído com sucesso.`);
        document.querySelector('[data-admin-module="users"]')?.click();
      }catch(error){
        console.error(error);
        alert(error.message||'Não foi possível excluir o personagem.');
        button.disabled=false;
        button.textContent='Excluir personagem';
      }
    });
  };

  const observe=()=>{
    cleanImageField();
    bindDeleteButton();
  };

  const host=document.getElementById('adminModuleContent');
  if(host){
    const observer=new MutationObserver(observe);
    observer.observe(host,{childList:true,subtree:true});
  }
  observe();
})();

"use strict";

(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  const tabs=[...document.querySelectorAll("[data-account-tab]")];
  const panels=[...document.querySelectorAll("[data-account-panel]")];
  const loginForm=document.getElementById("loginForm");
  const registerForm=document.getElementById("registerForm");
  const loginMessage=document.getElementById("loginMessage");
  const registerMessage=document.getElementById("registerMessage");

  if(!account){
    loginMessage.textContent="Não foi possível conectar ao servidor.";
    return;
  }

  try{
    if(await account.current()){
      window.location.replace("personagens.html");
      return;
    }
  }catch(error){
    console.error(error);
  }

  function switchTab(name){
    tabs.forEach(tab=>tab.classList.toggle("active",tab.dataset.accountTab===name));
    panels.forEach(panel=>panel.classList.toggle("active",panel.dataset.accountPanel===name));
    loginMessage.textContent="";
    registerMessage.textContent="";
  }

  function setBusy(form,busy){
    form.querySelectorAll("button,input").forEach(element=>element.disabled=busy);
  }

  tabs.forEach(tab=>tab.addEventListener("click",()=>switchTab(tab.dataset.accountTab)));

  loginForm?.addEventListener("submit",async event=>{
    event.preventDefault();
    loginMessage.textContent="";
    if(!loginForm.checkValidity()){
      loginMessage.textContent="Preencha o e-mail e a senha corretamente.";
      loginForm.reportValidity();
      return;
    }
    setBusy(loginForm,true);
    try{
      await account.login({
        email:document.getElementById("loginEmail").value,
        password:document.getElementById("loginPassword").value
      });
      loginMessage.textContent="Acesso confirmado. Abrindo seus personagens...";
      window.location.assign("personagens.html");
    }catch(error){
      loginMessage.textContent=error.message||"Não foi possível entrar.";
      setBusy(loginForm,false);
    }
  });

  registerForm?.addEventListener("submit",async event=>{
    event.preventDefault();
    registerMessage.textContent="";
    if(!registerForm.checkValidity()){
      registerMessage.textContent="Revise os campos obrigatórios.";
      registerForm.reportValidity();
      return;
    }
    const password=document.getElementById("registerPassword").value;
    const confirm=document.getElementById("registerConfirm").value;
    if(password!==confirm){registerMessage.textContent="As senhas não coincidem.";return}
    setBusy(registerForm,true);
    try{
      const result=await account.register({
        name:document.getElementById("registerName").value,
        email:document.getElementById("registerEmail").value,
        password
      });
      if(result.needsEmailConfirmation){
        registerMessage.textContent="Conta criada. Confirme o e-mail recebido antes de entrar.";
        setBusy(registerForm,false);
        return;
      }
      registerMessage.textContent="Conta criada. Abrindo seus personagens...";
      window.location.assign("personagens.html");
    }catch(error){
      registerMessage.textContent=error.message||"Não foi possível criar a conta.";
      setBusy(registerForm,false);
    }
  });
})();

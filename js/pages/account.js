"use strict";

(function(){
  const tabs=[...document.querySelectorAll("[data-account-tab]")];
  const panels=[...document.querySelectorAll("[data-account-panel]")];
  const loginForm=document.getElementById("loginForm");
  const registerForm=document.getElementById("registerForm");
  const loginMessage=document.getElementById("loginMessage");
  const registerMessage=document.getElementById("registerMessage");

  if(window.WONDERLAND_ACCOUNT?.current()){
    window.location.replace("personagens.html");
    return;
  }

  function switchTab(name){
    tabs.forEach(tab=>tab.classList.toggle("active",tab.dataset.accountTab===name));
    panels.forEach(panel=>panel.classList.toggle("active",panel.dataset.accountPanel===name));
    loginMessage.textContent="";
    registerMessage.textContent="";
  }

  tabs.forEach(tab=>tab.addEventListener("click",()=>switchTab(tab.dataset.accountTab)));

  loginForm?.addEventListener("submit",event=>{
    event.preventDefault();
    loginMessage.textContent="";
    if(!loginForm.checkValidity()){
      loginMessage.textContent="Preencha o e-mail e a senha corretamente.";
      loginForm.reportValidity();
      return;
    }
    try{
      window.WONDERLAND_ACCOUNT.login({email:document.getElementById("loginEmail").value,password:document.getElementById("loginPassword").value});
      loginMessage.textContent="Acesso confirmado. Abrindo seus personagens...";
      window.setTimeout(()=>window.location.assign("personagens.html"),250);
    }catch(error){loginMessage.textContent=error.message||"Não foi possível entrar."}
  });

  registerForm?.addEventListener("submit",event=>{
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
    try{
      window.WONDERLAND_ACCOUNT.register({name:document.getElementById("registerName").value,email:document.getElementById("registerEmail").value,password});
      registerMessage.textContent="Conta criada. Preparando seu salão de personagens...";
      window.setTimeout(()=>window.location.assign("personagens.html"),250);
    }catch(error){registerMessage.textContent=error.message||"Não foi possível criar a conta."}
  });
})();

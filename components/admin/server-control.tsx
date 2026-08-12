"use client";

import { useState } from "react";

import { setServerOnlineAction } from "@/app/admin/server-actions";

export function ServerControl({ online }: { online: boolean }) {
  const [armed, setArmed] = useState(false);

  return (
    <section className={`server-control ${online ? "is-online" : "is-offline"}`}>
      <div className="server-control__signal">
        <span />
        <small>Estado global</small>
        <strong>{online ? "Servidor ligado" : "Servidor desligado"}</strong>
      </div>
      <div className="server-control__copy">
        <span className="eyebrow">Controle de acesso</span>
        <h2>{online ? "Wonderland está disponível" : "Modo de manutenção ativo"}</h2>
        <p>
          {online
            ? "Jogadores podem entrar, selecionar personagens e acessar todas as áreas do jogo."
            : "Logins de jogadores estão bloqueados. Somente Administradores e Fundadores permanecem com acesso."}
        </p>
      </div>
      {online ? (
        armed ? (
          <form action={setServerOnlineAction} className="server-control__confirmation">
            <input name="online" type="hidden" value="false" />
            <label>
              <span>Digite DESLIGAR para confirmar</span>
              <input autoComplete="off" name="confirmation" pattern="DESLIGAR" required />
            </label>
            <div>
              <button
                className="server-control__cancel"
                onClick={() => setArmed(false)}
                type="button"
              >
                Cancelar
              </button>
              <button className="server-control__danger" type="submit">
                Confirmar desligamento
              </button>
            </div>
          </form>
        ) : (
          <button className="server-control__danger" onClick={() => setArmed(true)} type="button">
            Desligar servidor
          </button>
        )
      ) : (
        <form action={setServerOnlineAction}>
          <input name="online" type="hidden" value="true" />
          <button className="server-control__start" type="submit">
            Ligar servidor
          </button>
        </form>
      )}
    </section>
  );
}

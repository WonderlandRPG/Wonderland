"use client";

import { useMemo, useState } from "react";
import { executeRewardCommandAction } from "@/app/admin/console/actions";

export function RewardConsole({
  characters,
  rewards,
}: {
  characters: string[];
  rewards: string[];
}) {
  const [command, setCommand] = useState("Dar @");
  const token = command.match(/@([^\s]*)$/)?.[1] ?? null;
  const suggestions = useMemo(
    () =>
      token === null
        ? []
        : ["todos", ...characters]
            .filter((name) =>
              name.toLocaleLowerCase("pt-BR").includes(token.toLocaleLowerCase("pt-BR")),
            )
            .slice(0, 9),
    [token, characters],
  );
  const choose = (name: string) => setCommand(command.replace(/@[^\s]*$/, `@${name} `));
  return (
    <div className="admin-reward-console">
      <section className="admin-console-chat">
        <header>
          <span className="eyebrow">Comando administrativo</span>
          <h2>Distribuir recompensas</h2>
          <p>Digite um comando, confira o destinatário e confirme o envio.</p>
        </header>
        <div className="admin-console-history">
          <p>
            <b>Sistema</b> Use <strong>@</strong> para escolher um personagem ou todos.
          </p>
        </div>
        <form action={executeRewardCommandAction}>
          <div className="admin-command-input">
            <textarea
              name="command"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              aria-label="Comando de recompensa"
            />
            {suggestions.length ? (
              <div className="admin-command-suggestions">
                {suggestions.map((name) => (
                  <button type="button" key={name} onClick={() => choose(name)}>
                    <span>{name === "todos" ? "★" : name.slice(0, 2).toUpperCase()}</span>
                    <b>{name === "todos" ? "Todos os personagens" : name}</b>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button className="button button--primary">Revisar e executar</button>
        </form>
        <details>
          <summary>Itens e títulos disponíveis</summary>
          <div className="admin-console-rewards">
            {rewards.map((x) => (
              <button type="button" key={x} onClick={() => setCommand(command + x)}>
                {x}
              </button>
            ))}
          </div>
        </details>
      </section>
      <aside className="admin-command-help">
        <span className="eyebrow">Cola de comandos</span>
        <h3>Como escrever</h3>
        <code>Dar @Luna item:Cajado do Gelo Eterno quantidade: 1</code>
        <code>Dar @Luna titulo:Desperto de Wonderland quantidade: 1</code>
        <code>Dar @Luna xp:500</code>
        <code>Dar @Luna wg:1.000</code>
        <code>Dar @todos xp:100</code>
        <p>
          <b>@todos</b> entrega a recompensa a todos os personagens existentes. A ação fica
          registrada no histórico administrativo.
        </p>
      </aside>
    </div>
  );
}

import Link from "next/link";

import { ServerControl } from "@/components/admin/server-control";
import { getServerOnline } from "@/lib/content/server-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Central de Comando" };
export const dynamic = "force-dynamic";

const tools = [
  {
    href: "/admin/jogadores",
    index: "01",
    title: "Jogadores",
    text: "Gerencie contas, cargos e permissões de acesso.",
  },
  {
    href: "/admin/personagens",
    index: "02",
    title: "Personagens",
    text: "Ajuste progressão, WG, Rank, reino e caminho de classe.",
  },
  {
    href: "/admin/racas",
    index: "03",
    title: "Conteúdo do jogo",
    text: "Publique raças, habilidades e regras do mundo.",
  },
  {
    href: "/admin/itens",
    index: "04",
    title: "Itens e economia",
    text: "Revise o catálogo, preços, raridades e efeitos.",
  },
  {
    href: "/admin/balanceamento",
    index: "05",
    title: "Balanceamento",
    text: "Calibre combate, atributos e ritmo de progressão.",
  },
  {
    href: "/admin/presenca",
    index: "06",
    title: "Presença",
    text: "Configure campanhas e recompensas de acesso diário.",
  },
  {
    href: "/admin/missoes",
    index: "07",
    title: "Mural de missões",
    text: "Crie contratos, provas de Rank e recompensas para cada reino.",
  },
  {
    href: "/admin/reinos",
    index: "♛",
    title: "Controle de Reinos",
    text: "Nomeie Reis, Rainhas e Conselheiros e acompanhe as estrelas de cada reino.",
  },
  {
    href: "/admin/historico",
    index: "08",
    title: "Histórico",
    text: "Consulte quem alterou cada sistema e quando.",
  },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ servidor?: string }>;
}) {
  const [{ servidor }, serverOnline] = await Promise.all([searchParams, getServerOnline()]);
  const client = await createServerSupabaseClient();
  const results = client
    ? await Promise.all([
        client.from("v2_events").select("id", { count: "exact", head: true }),
        client.from("v2_updates").select("id", { count: "exact", head: true }),
        client.from("v2_characters").select("id", { count: "exact", head: true }),
        client.from("v2_shop_items").select("id", { count: "exact", head: true }),
      ])
    : [];
  const [events, updates, characters, items] = results.map((result) => result.count ?? 0);

  return (
    <div className="admin-content admin-command-center">
      {servidor === "ligado" || servidor === "desligado" ? (
        <div className="admin-notice">
          <span>✓</span>Servidor {servidor} com sucesso.
        </div>
      ) : null}
      {servidor === "erro" || servidor === "confirmacao-invalida" ? (
        <div className="admin-notice admin-notice--error">
          <span>!</span>
          {servidor === "erro"
            ? "Não foi possível alterar o servidor."
            : "Digite DESLIGAR para confirmar a operação."}
        </div>
      ) : null}
      <ServerControl online={serverOnline} />
      <section className="admin-command-welcome">
        <div>
          <span className="eyebrow">Painel administrativo</span>
          <h2>O que você quer administrar hoje?</h2>
          <p>
            Publique novidades, acompanhe a comunidade e ajuste os sistemas do RPG a partir de um
            único painel.
          </p>
        </div>
        <div className="admin-command-welcome__status">
          <span className="signal-dot" />
          <small>Núcleo online</small>
          <strong>Wonderland</strong>
        </div>
      </section>

      <section className="admin-publish-launchers" aria-label="Publicar conteúdo">
        <Link href="/admin/eventos#novo-evento">
          <span>Agenda dos jogadores</span>
          <h3>Publicar novo evento</h3>
          <p>Defina data, horário, descrição e visibilidade no calendário.</p>
          <b>
            Criar evento <i>＋</i>
          </b>
        </Link>
        <Link href="/admin/atualizacoes#nova-atualizacao">
          <span>Diário público</span>
          <h3>Publicar atualização</h3>
          <p>Informe a versão e apresente todas as mudanças aos jogadores.</p>
          <b>
            Escrever atualização <i>＋</i>
          </b>
        </Link>
      </section>

      <section className="admin-command-metrics">
        <article>
          <small>Eventos</small>
          <strong>{events ?? 0}</strong>
          <Link href="/admin/eventos">Gerenciar</Link>
        </article>
        <article>
          <small>Atualizações</small>
          <strong>{updates ?? 0}</strong>
          <Link href="/admin/atualizacoes">Gerenciar</Link>
        </article>
        <article>
          <small>Personagens</small>
          <strong>{characters ?? 0}</strong>
          <Link href="/admin/personagens">Abrir</Link>
        </article>
        <article>
          <small>Itens</small>
          <strong>{items ?? 0}</strong>
          <Link href="/admin/itens">Abrir</Link>
        </article>
      </section>

      <section className="admin-tool-section">
        <header>
          <div>
            <span className="eyebrow">Ferramentas</span>
            <h2>Todos os controles</h2>
          </div>
          <small>{tools.length} áreas disponíveis</small>
        </header>
        <div className="admin-tool-grid">
          {tools.map((tool) => (
            <Link href={tool.href} key={tool.href}>
              <span>{tool.index}</span>
              <div>
                <h3>{tool.title}</h3>
                <p>{tool.text}</p>
              </div>
              <b>→</b>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

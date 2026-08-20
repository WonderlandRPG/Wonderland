"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { CurrentAccount } from "@/lib/auth/roles";
import { roleLabels } from "@/lib/auth/roles";

function getRouteHeading(pathname: string) {
  if (pathname === "/admin/classes/nova") {
    return { path: "Wonderland / Classes / Nova", title: "Criar classe" };
  }
  if (pathname === "/admin/racas/nova") {
    return { path: "Wonderland / Raças / Nova", title: "Criar raça" };
  }
  if (pathname.endsWith("/preview")) {
    return { path: "Wonderland / Raças / Pré-visualização", title: "Prévia da raça" };
  }
  const routes = [
    ["/admin/estudio", "Criação assistida", "Studio de Criação"],
    ["/admin/portal", "Comunidade", "Tela principal"],
    ["/admin/atualizacoes", "Comunidade / Publicações", "Atualizações"],
    ["/admin/eventos", "Comunidade / Publicações", "Eventos"],
    ["/admin/personagens", "Comunidade / Jogadores", "Personagens"],
    ["/admin/jogadores", "Comunidade", "Jogadores"],
    ["/admin/missoes", "Jogo", "Missões"],
    ["/admin/titulos", "Jogo", "Títulos"],
    ["/admin/temas", "Aparência", "Temas"],
    ["/admin/reinos", "Mundo", "Controle de Reinos"],
    ["/admin/console", "Comando", "Console de recompensas"],
    ["/admin/balanceamento", "Jogo", "Balanceamento"],
    ["/admin/presenca", "Jogo", "Recompensas de presença"],
    ["/admin/historico", "Auditoria", "Histórico administrativo"],
    ["/admin/itens", "Economia", "Catálogo de itens"],
    ["/admin/importar", "Conteúdo do jogo", "Importador técnico"],
    ["/admin/racas", "Conteúdo do jogo", "Raças"],
    ["/admin/classes", "Conteúdo do jogo", "Classes"],
  ] as const;
  const route = routes.find(([path]) => pathname.startsWith(path));
  if (route) return { path: `Wonderland / ${route[1]}`, title: route[2] };
  if (pathname === "/admin")
    return { path: "Wonderland / Administração", title: "Central de comando" };

  return { path: "Wonderland / Administração", title: "Painel administrativo" };
}

export function AdminTopbar({
  account,
  configured,
}: {
  account: CurrentAccount;
  configured: boolean;
}) {
  const pathname = usePathname();
  const heading = getRouteHeading(pathname);
  const initials = account.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="admin-topbar">
      <div>
        <span className="admin-topbar__path">{heading.path}</span>
        <h1>{heading.title}</h1>
      </div>
      <div className="admin-topbar__actions">
        <span className={`connection-status ${configured ? "is-online" : "is-pending"}`}>
          <span className="signal-dot" />
          {configured ? "Supabase conectado" : "Supabase aguardando conexão"}
        </span>
        <Link className="admin-profile" href="/perfil">
          <span>{initials || "W"}</span>
          <span>
            <strong>{account.displayName}</strong>
            <small>{roleLabels[account.role]}</small>
          </span>
        </Link>
      </div>
    </header>
  );
}

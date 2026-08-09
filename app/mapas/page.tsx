import { PortalShell } from "@/components/portal-shell";
import { requireActiveCharacter } from "@/lib/content/active-character";

export const metadata = { title: "Mapas" };

export default async function MapsPage() {
  await requireActiveCharacter("/mapas");
  return (
    <PortalShell
      eyebrow="Exploração em manutenção"
      title="O mapa está temporariamente fechado"
      description="Estamos reconstruindo a exploração de Wonderland. O acesso será reaberto quando a nova experiência estiver pronta."
    >
      <section className="map-disabled-state"><span>⌖</span><strong>Região não mapeada</strong><p>Continue evoluindo seu personagem pela Arena, loja e eventos enquanto a exploração é preparada.</p></section>
    </PortalShell>
  );
}

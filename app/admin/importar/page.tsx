import { ContentImportChat } from "@/components/admin/content-import-chat";
export const metadata = { title: "Importar classe ou raça" };
export default function ImportContentPage() {
  return (
    <div className="admin-content">
      <section className="race-catalog-hero">
        <div>
          <span className="eyebrow">Criação assistida</span>
          <h1>Chat de conteúdo</h1>
          <p>Transforme o documento criado no chat em uma classe ou raça completa e editável.</p>
        </div>
      </section>
      <ContentImportChat />
    </div>
  );
}

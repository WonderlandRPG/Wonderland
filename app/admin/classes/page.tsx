import { requireAdministrativeAccount } from "@/lib/auth/account";

export const metadata = { title: "Guia de Classes | Painel ADM" };

const sections = [
  {
    index: "01",
    title: "Identidade da classe",
    text: "Esses dados apresentam a classe no códice e ajudam o jogador a entender seu papel.",
    fields: [
      "Nome e descrição",
      "Dificuldade (1 a 5)",
      "Especialização",
      "Atributos principais",
      "Imagem e complexidade",
    ],
  },
  {
    index: "02",
    title: "Recurso e mecânica",
    text: "A Arena precisa saber como o recurso nasce, qual é seu limite e quando ele é consumido ou zerado.",
    fields: [
      "Nome do recurso",
      "Valor inicial e máximo",
      "Regras de geração",
      "Limite por ação",
      "Regras de consumo e reinício",
    ],
  },
  {
    index: "03",
    title: "Passiva da classe",
    text: "A passiva deve possuir nome, descrição objetiva, gatilho e regra de sistema. Apenas um texto bonito não ativa o efeito no combate.",
    fields: [
      "Nome da passiva",
      "Gatilho",
      "Condição",
      "Operação executada",
      "Descrição para o jogador",
    ],
  },
  {
    index: "04",
    title: "Habilidades",
    text: "Cada habilidade é calculada por campos separados. A descrição exibida ao jogador não substitui os dados da Arena.",
    fields: [
      "Nível de desbloqueio",
      "Tipo e alvo",
      "Custo e recarga",
      "Alcance e área",
      "Escalamento e multiplicador",
      "Efeito, duração e chance",
    ],
  },
  {
    index: "05",
    title: "Caminhos da classe",
    text: "Cada caminho pode ter identidade, passiva e habilidades próprias, mas precisa seguir o mesmo contrato de combate da classe principal.",
    fields: [
      "Nome e descrição",
      "Chave interna única",
      "Passiva do caminho",
      "Habilidades exclusivas",
    ],
  },
];

export default async function AdminClassesGuidePage() {
  await requireAdministrativeAccount();

  return (
    <div className="admin-content admin-class-guide">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Conteúdo do jogo // contrato da Arena</span>
          <h2>Como cadastrar uma classe</h2>
          <p>
            Use este formato para que a classe apareça corretamente no códice, na ficha e no
            combate. Os campos estruturados alimentam a Arena; a descrição serve ao jogador.
          </p>
        </div>
      </header>

      <section className="admin-class-guide__warning">
        <strong>Regra principal</strong>
        <p>
          Não cadastre a habilidade somente como texto. Informe custo, recarga, alcance,
          escalamento, alvo e efeitos em seus campos próprios para que o sistema consiga calculá-la.
        </p>
      </section>

      <section className="admin-class-guide__grid">
        {sections.map((section) => (
          <article key={section.index}>
            <span>{section.index}</span>
            <div>
              <h3>{section.title}</h3>
              <p>{section.text}</p>
              <ul>
                {section.fields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-class-guide__example">
        <header>
          <span className="eyebrow">Exemplo funcional</span>
          <h3>Golpe Devastador</h3>
        </header>
        <dl>
          <div>
            <dt>Tipo</dt>
            <dd>Dano físico</dd>
          </div>
          <div>
            <dt>Escalamento</dt>
            <dd>1,5x FOR</dd>
          </div>
          <div>
            <dt>Custo</dt>
            <dd>20 de Fúria</dd>
          </div>
          <div>
            <dt>Recarga</dt>
            <dd>3 rodadas</dd>
          </div>
          <div>
            <dt>Alcance</dt>
            <dd>1 casa</dd>
          </div>
          <div>
            <dt>Efeito</dt>
            <dd>Sangramento por 2 rodadas</dd>
          </div>
        </dl>
        <p>
          O jogador pode ler “Desfere um golpe brutal que faz o alvo sangrar”, enquanto a Arena usa
          os valores acima para executar a habilidade.
        </p>
      </section>
    </div>
  );
}

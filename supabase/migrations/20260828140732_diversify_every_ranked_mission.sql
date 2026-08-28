create temporary table mission_variations(
  rank text,
  site_index integer,
  title text,
  detail text,
  objective text,
  primary key(rank, site_index)
) on commit drop;

insert into mission_variations(rank,site_index,title,detail,objective) values
('E',1,'Contagem Incompleta','Durante o serviço, confira a lista deixada pelo responsável: três itens estão sem identificação e precisam ser reconhecidos antes da entrega.','Confira a lista e identifique corretamente os três itens sem marcação.'),
('E',2,'Duas Áreas Trocadas','As marcações de duas áreas foram trocadas durante a preparação. Confirme com o responsável o que pertence a cada trecho antes de prosseguir.','Corrija as marcações e conclua cada parte na área certa.'),
('E',3,'Prazo da Feira','A tarefa precisa terminar antes da abertura da feira comunitária, sem bloquear a passagem dos comerciantes.','Conclua o serviço antes da feira e mantenha a passagem livre.'),
('E',4,'Registro para o Arquivo','A administração pediu que quantidades e condições sejam anotadas para atualizar o arquivo do bairro.','Registre as quantidades e o estado de tudo que foi encontrado.'),
('E',5,'Cuidados com a Chuva','Uma mudança no clima pode estragar o trabalho. Proteja o que já foi concluído e recolha tudo que não puder ficar exposto.','Proteja o trabalho e guarde os materiais vulneráveis ao clima.'),
('E',6,'Acesso dos Idosos','A rota usada por moradores idosos deve permanecer desimpedida durante toda a tarefa. Organize uma passagem segura.','Mantenha uma passagem segura e sinalizada para os moradores.'),
('E',7,'Estruturas Delicadas','Há estruturas frágeis ao redor da área de trabalho. Delimite o espaço e execute a tarefa sem causar rachaduras ou perdas.','Preserve todas as estruturas frágeis próximas da tarefa.'),
('E',8,'Instruções Apagadas','A chuva apagou parte das instruções. Converse com três moradores e reconstrua a ordem correta das tarefas.','Descubra com os moradores a ordem correta e conclua todas as etapas.'),
('E',9,'Reaproveitamento Comunitário','Nada que ainda possa ser usado deve ser descartado. Separe o material entre reutilizável, reparável e sem uso.','Classifique e encaminhe corretamente todo o material recolhido.'),
('E',10,'Inspeção Final','Depois do trabalho, acompanhe o responsável numa inspeção e corrija qualquer ponto que tenha ficado incompleto.','Passe pela inspeção e entregue o local sem pendências.'),

('D',1,'Moradores por Perto','Há moradores curiosos se aproximando do perigo. Isole o perímetro antes de lidar com o problema principal.','Afaste os moradores e mantenha o perímetro protegido.'),
('D',2,'Sem Ferir o Animal','O tratador explicou que o animal precisa ser recuperado com vida. Use contenção e evite golpes letais.','Resolva o incidente sem matar ou ferir gravemente o animal.'),
('D',3,'Segundo Chamado','Um segundo pedido de ajuda veio de uma construção próxima e pode estar ligado ao mesmo incidente. Verifique-o antes de encerrar o trabalho.','Atenda o segundo chamado e confirme se os dois incidentes estão ligados.'),
('D',4,'Rastro até o Abrigo','O problema pode voltar se a origem não for encontrada. Siga rastros e descubra por onde os animais entraram.','Encontre a origem e feche o acesso usado pelos animais.'),
('D',5,'Ajuda do Especialista','Um especialista local conhece o problema, mas precisa chegar perto o bastante para avaliar a situação. Proteja-o durante a aproximação.','Escolte o especialista e permita que ele conclua a avaliação.'),
('D',6,'Mantimentos Contaminados','Parte dos mantimentos foi alcançada pelos animais. Separe o alimento seguro antes que seja distribuído.','Identifique e descarte apenas os mantimentos contaminados.'),
('D',7,'Barulho na Vizinhança','Sons intensos estão deixando os animais mais agressivos. Descubra a fonte do ruído e interrompa-a antes da captura.','Elimine a fonte do barulho e só então contenha os animais.'),
('D',8,'Duas Rotas de Fuga','O local possui duas saídas e os animais escapam sempre que uma delas é fechada. Coordene o bloqueio das duas rotas.','Bloqueie as duas fugas e conclua a captura.'),
('D',9,'Pertence Perdido','Um pertence de família desapareceu durante a confusão. Localize-o sem abandonar a resolução do incidente principal.','Recupere o pertence e conclua a tarefa principal.'),
('D',10,'Área Segura','Depois da contenção, o local precisa ser vistoriado para impedir que o mesmo problema volte a ameaçar os moradores.','Elimine a causa do incidente e entregue a área em segurança.'),

('C',1,'Resgate Antes do Confronto','Duas pessoas ficaram presas dentro do perímetro. Retire-as antes de enfrentar a ameaça principal.','Localize e retire os dois civis antes do confronto.'),
('C',2,'Estrutura Instável','O terreno continua cedendo e qualquer impacto forte pode causar outro desabamento. Controle a força usada durante a operação.','Conclua o resgate sem provocar um novo desabamento.'),
('C',3,'Sedativo Limitado','A equipe dispõe de somente duas doses de sedativo. Observe o comportamento das criaturas e escolha os alvos corretos.','Use as duas doses nos alvos certos e contenha os demais sem matá-los.'),
('C',4,'Rastros Divididos','Os rastros se dividem em três direções. Investigue sinais deixados no terreno para escolher a trilha verdadeira.','Identifique o rastro correto antes que o tempo de resgate se esgote.'),
('C',5,'Ferido sem Movimento','Uma vítima não pode ser movida até receber os primeiros cuidados. Proteja o curandeiro durante o atendimento.','Estabilize a vítima e só depois realize a retirada.'),
('C',6,'Fera Protegendo o Ninho','A criatura age para proteger um ninho próximo. Afaste os moradores sem destruir os ovos ou provocar novos ataques.','Preserve o ninho e conduza a fera para longe da área habitada.'),
('C',7,'Saída Submersa','A rota mais curta ficou inacessível e o nível da água continua subindo. Encontre uma saída elevada para os sobreviventes.','Abra uma rota elevada e retire todos antes da inundação.'),
('C',8,'Passageiro Desaparecido','A contagem dos resgatados não coincide com o registro da viagem. Procure o passageiro que ainda está desaparecido.','Encontre o último passageiro antes de encerrar a operação.'),
('C',9,'Manada com Líder Ferido','A agitação começou porque o líder da manada está ferido. Trate-o ou conduza-o para controlar os demais animais.','Estabilize o líder e conduza a manada para uma rota segura.'),
('C',10,'Segundo Desabamento','Sons sob os escombros indicam outra área de sobreviventes. Reforce a estrutura antes de iniciar a segunda retirada.','Reforce o local e resgate o segundo grupo de sobreviventes.'),

('B',1,'Rota Comprometida','A rota oficial foi entregue aos criminosos. Escolha um caminho alternativo sem informar o destino à comitiva.','Descubra uma rota segura e mantenha o itinerário em segredo.'),
('B',2,'Traidor na Comitiva','Evidências apontam que alguém do grupo repassa informações aos perseguidores. Identifique o traidor durante a missão.','Proteja o alvo e descubra quem está vazando a rota.'),
('B',3,'Provas do Crime','A prisão só será válida se documentos e testemunhos forem preservados. Recolha as provas antes de deixar o local.','Capture os responsáveis e entregue as provas intactas.'),
('B',4,'Ataque em Duas Frentes','Os inimigos planejam uma distração para separar a escolta. Mantenha o grupo unido e proteja o verdadeiro alvo.','Impeça a separação da comitiva e neutralize as duas frentes.'),
('B',5,'Refém Importante','Um dos criminosos mantém um servidor do Reino como garantia de fuga. Planeje a abordagem sem colocar o refém em risco.','Liberte o refém e prenda o criminoso com vida.'),
('B',6,'Documento Falsificado','Dois objetos aparentemente idênticos foram encontrados. Verifique selos e marcas antes de entregar o item oficial.','Identifique e entregue o objeto verdadeiro.'),
('B',7,'Curandeiro sem Suprimentos','Os suprimentos médicos foram roubados durante a operação. Recupere-os antes que o atendimento seja interrompido.','Recupere os suprimentos e mantenha o protegido em atividade.'),
('B',8,'Emboscada na Retirada','Os inimigos aguardam o momento da evacuação. Prepare uma retirada falsa para revelar a posição dos atacantes.','Descubra a emboscada e retire todos pela rota segura.'),
('B',9,'Ordem de Captura','O comandante inimigo possui informações importantes e não pode ser morto. Contenha-o mesmo durante o confronto.','Prenda o comandante vivo e entregue-o à Guilda.'),
('B',10,'Escolta Ferida','O protegido foi ferido e perdeu mobilidade. Organize o transporte sem abandonar os demais integrantes.','Estabilize o protegido e leve toda a comitiva ao destino.'),

('A',1,'Reféns em Dois Setores','Os reféns foram separados e o inimigo ameaça um grupo caso o outro seja atacado. Coordene resgates quase simultâneos.','Liberte os dois grupos antes de enfrentar o líder.'),
('A',2,'Ritual em Andamento','O ritual já começou e cada círculo destruído fortalece temporariamente os demais. Descubra a sequência correta.','Desative os círculos na ordem correta e interrompa o ritual.'),
('A',3,'Inimigo entre os Civis','Um combatente de elite se disfarçou entre os evacuados. Identifique-o sem interromper a retirada.','Encontre o infiltrado e preserve todos os civis.'),
('A',4,'Barreira Alimentada','A fortificação absorve ataques e devolve energia ao conjurador. Localize os três focos que sustentam a barreira.','Destrua os três focos antes do confronto principal.'),
('A',5,'Antídoto Incompleto','O antídoto precisa de uma amostra da criatura que iniciou a contaminação. Capture-a antes que a praga avance.','Obtenha a amostra, conclua o antídoto e proteja os curandeiros.'),
('A',6,'Contagem Regressiva','Runas espalhadas pelo local anunciam uma explosão arcana. Desative-as enquanto a equipe contém os inimigos.','Desative todas as runas antes do fim da contagem.'),
('A',7,'Comandante Desconhecido','Os inimigos obedecem ordens ocultas e recuam antes de serem capturados. Descubra quem comanda a operação.','Revele e capture o verdadeiro comandante.'),
('A',8,'Evacuação sob Ataque','Centenas de moradores ainda não deixaram a área. Sustente uma rota segura enquanto as defesas são rompidas.','Mantenha a rota de evacuação até a saída do último morador.'),
('A',9,'Fonte Sob a Cidade','A ameaça visível é alimentada por um núcleo abaixo do local. Divida a operação entre contenção e destruição da fonte.','Contenha a ameaça e destrua o núcleo subterrâneo.'),
('A',10,'Escolha sem Baixas','Dois objetivos urgentes parecem incompatíveis, mas os registros revelam uma terceira rota. Encontre-a para evitar o sacrifício de inocentes.','Conclua os dois resgates sem aceitar baixas civis.'),

('S',1,'Fronteira Fechada','A fronteira foi tomada e a passagem oficial está bloqueada. Abra uma rota sem expor a comitiva ao exército inimigo.','Cruze a fronteira por uma rota segura e mantenha todos vivos.'),
('S',2,'Caçadores de Recompensa','Grupos de três Reinos aceitaram a recompensa pelo alvo. Cada grupo utiliza táticas e recursos diferentes.','Supere os três grupos e entregue o protegido com vida.'),
('S',3,'Artefato em Colapso','O artefato perde estabilidade a cada confronto. Evite batalhas desnecessárias e alcance os especialistas antes da ruptura.','Entregue o artefato antes que sua estabilidade chegue ao limite.'),
('S',4,'Exército sem Estandarte','Uma força clandestina bloqueia a viagem e nenhum Reino reconhece seus soldados. Descubra quem financia a operação.','Rompa o bloqueio e identifique os responsáveis pelo exército.'),
('S',5,'Travessia sem Mana','Uma zona morta interrompe recursos mágicos no meio da rota. Prepare suprimentos e proteções antes de entrar.','Atravesse a zona morta e preserve toda a comitiva.'),
('S',6,'Portal de Retorno','O portal para casa ficará aberto por poucos minutos. Conclua o objetivo do outro lado e retorne antes do fechamento.','Complete a incursão e faça todos retornarem dentro do prazo.'),
('S',7,'Cerco aos Refugiados','Uma força de elite persegue os refugiados e tenta dividir a coluna. Organize defesas móveis durante a travessia.','Leve todos os refugiados ao Reino vizinho sem dispersar o grupo.'),
('S',8,'Traição Diplomática','Um dos representantes entregou a rota aos assassinos. Revele a traição sem iniciar uma guerra entre os Reinos.','Identifique o traidor, proteja os demais e evite conflito diplomático.'),
('S',9,'Calamidade Migratória','A criatura atravessa fronteiras e se fortalece em cada território. Intercepte-a antes que alcance o próximo Reino.','Derrote a calamidade antes da próxima fronteira.'),
('S',10,'Última Ponte','A única ponte entre os territórios está ruindo sob ataque. Sustente a passagem até que o último civil atravesse.','Defenda a ponte e conclua a evacuação antes do colapso.'),

('EX',1,'Primeira Etapa: Ecos Perdidos','Os primeiros sobreviventes lembram versões incompatíveis do acontecimento. Reconstrua a verdade antes de escolher a rota da expedição.','Investigue os relatos e determine qual sequência de eventos é verdadeira.'),
('EX',2,'Segunda Etapa: Três Chaves','Três chaves foram entregues a guardiões em regiões diferentes. Cada recuperação altera as defesas das etapas seguintes.','Recupere as três chaves e decida a ordem estratégica de uso.'),
('EX',3,'Terceira Etapa: Cidade Oculta','Uma comunidade desaparecida sobrevive num setor que não aparece nos mapas. Estabeleça contato sem levar a ameaça até ela.','Encontre a comunidade e crie uma rota de retirada protegida.'),
('EX',4,'Quarta Etapa: Aliado Corrompido','Um dos guias da operação foi dominado pela força inimiga, mas ainda resiste internamente. Liberte-o para recuperar informações essenciais.','Salve o guia corrompido e recupere suas informações.'),
('EX',5,'Quinta Etapa: Escolha dos Reinos','Representantes dos Reinos discordam sobre a solução. Obtenha apoio suficiente sem permitir que a aliança seja rompida.','Construa um acordo e preserve a aliança durante a crise.'),
('EX',6,'Sexta Etapa: Núcleo Móvel','A fonte da calamidade muda de posição sempre que uma defesa é destruída. Preveja o próximo deslocamento.','Localize e imobilize o núcleo antes do confronto final.'),
('EX',7,'Sétima Etapa: Duas Realidades','A expedição foi dividida entre realidades conectadas. Ações de um grupo transformam os caminhos do outro.','Sincronize os dois grupos e reúna a expedição.'),
('EX',8,'Oitava Etapa: Sacrifício Recusado','Os registros afirmam que uma vida precisa ser entregue, mas existe uma solução escondida pelos antigos responsáveis.','Encontre a alternativa e conclua a etapa sem sacrificar inocentes.'),
('EX',9,'Nona Etapa: Cerco Final','As forças inimigas cercam os sobreviventes enquanto a solução é preparada. Organize defesa, suprimentos e evacuação ao mesmo tempo.','Proteja os sobreviventes até a conclusão da solução.'),
('EX',10,'Etapa Final: Consequência Permanente','A decisão final mudará permanentemente a região e seus habitantes. Avalie as descobertas anteriores antes de agir.','Derrote a ameaça e escolha conscientemente o destino da região.');

with parsed as (
  select
    mission.id,
    mission.rank,
    split_part(mission.slug,'-',4)::integer site_index,
    regexp_replace(mission.name,' — .*$', '') base_name
  from public.v2_missions mission
  where mission.active
    and not mission.is_rank_trial
    and mission.slug ~ '^(aokigahara|darkya|oymyakon|lesedi|namida|skypiece)-(e|d|c|b|a|s|ex)-[0-9]{2}-[0-9]{2}$'
)
update public.v2_missions mission
set name = parsed.base_name || ': ' || variation.title,
    description = regexp_replace(mission.description,' A operação será dividida em investigação.*$','')
      || ' ' || variation.detail,
    objective = mission.objective || ' ' || variation.objective,
    updated_at = now()
from parsed
join mission_variations variation
  on variation.rank=parsed.rank and variation.site_index=parsed.site_index
where mission.id=parsed.id;

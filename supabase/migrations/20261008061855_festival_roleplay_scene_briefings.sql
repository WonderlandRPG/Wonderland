begin;
-- Rewrite shared briefings in place; keep mission IDs, assignments and rewards.
with scenes(kingdom,event_day,description,objective) as (values
('aokigahara','2026-10-08','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. A clareira ainda está coberta por galhos caídos e restos de folhas. Os organizadores pedem ajuda para liberar o espaço das barracas, mas nenhum galho deve ser cortado das árvores.

Complicação: Um ajudante aponta uma área que ninguém quer tocar. Quando você se aproxima, folhas se voltam para o mesmo ponto, embora não haja vento. Decida como examinar o lugar antes de começar o trabalho.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 10 galhos secos na área indicada e entregue ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-09','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. Algumas partes do caminho até a clareira ficam escorregadias ao anoitecer. O grupo marcou os trechos onde os visitantes terão mais dificuldade para passar.

Complicação: As indicações do grupo não coincidem com os sinais do caminho. Folhas se voltam para o mesmo ponto, embora não haja vento. Escolha em que orientação confiar e como garantir a passagem dos visitantes.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 8 pedras achatadas perto do riacho e coloque nos trechos marcados.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-10','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. As primeiras lanternas estão prontas, mas ainda precisam ser penduradas. Cada uma tem uma fita de cor diferente e deve ficar no lugar correspondente.

Complicação: Um organizador interrompe o serviço ao perceber que folhas se voltam para o mesmo ponto, embora não haja vento. Ele teme assustar os visitantes. Decida como continuar sem ignorar o ocorrido.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Instale 5 lanternas nas árvores indicadas, respeitando a cor de cada fita.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-11','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. O grupo quer preparar enfeites que durem até o fim do festival. As folhas verdes e as completamente secas não serão aceitas.

Complicação: Um ajudante insiste que parte do material mudou desde a última inspeção. Folhas se voltam para o mesmo ponto, embora não haja vento. Examine o que pode ser usado e explique sua escolha ao grupo.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 12 folhas avermelhadas que já tenham caído no chão e entregue aos organizadores.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-12','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. As cordas trazidas pelos viajantes não são suficientes para as guirlandas. As fibras precisam chegar inteiras, sem cortes no meio.

Complicação: O material disponível parece adequado, mas uma das peças reage à sua aproximação: folhas se voltam para o mesmo ponto, embora não haja vento. Escolha como testá-la sem comprometer os preparativos.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Consiga 6 fibras resistentes de plantas da região e entregue para a montagem das guirlandas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-13','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. Algumas placas de boas-vindas ainda precisam de suporte. O grupo procura peças com o centro preservado, mesmo que a parte de fora esteja apodrecida.

Complicação: Um trabalhador quer aproveitar tudo; outro pede que uma peça seja deixada para trás. Folhas se voltam para o mesmo ponto, embora não haja vento. Ouça os dois e decida o que levar para a festa.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 4 pedaços de madeira escura entre os troncos caídos e entregue ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-14','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. Os organizadores estão preparando pequenos sachês para deixar nas barracas. Eles indicaram árvores onde a resina pode ser recolhida sem ferir os troncos.

Complicação: Durante o serviço, folhas se voltam para o mesmo ponto, embora não haja vento. Um ajudante abandona sua tarefa e pede que você o acompanhe. Decida como tranquilizá-lo e preservar o que estão preparando.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 5 porções de resina nos pontos indicados, sem ferir as árvores.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-15','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. Parte das fitas colocadas no dia anterior foi encontrada longe da clareira. Algumas ficaram presas em raízes baixas, apesar de terem sido penduradas nos galhos.

Complicação: As marcas deixadas pelo grupo terminam onde folhas se voltam para o mesmo ponto, embora não haja vento. Reconstrua o trajeto e escolha como recuperar o que falta sem danificar os enfeites.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recupere 6 fitas alaranjadas ao longo do caminho e devolva ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-16','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. As barracas receberão vasos com plantas locais. Os organizadores já deixaram recipientes numerados e pedem que a terra de cada ponto seja mantida separada.

Complicação: Uma marca nos recipientes não consta nas instruções. Folhas se voltam para o mesmo ponto, embora não haja vento. Decida como manter o material separado e quem deve receber seu relato.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 3 pequenas porções de terra nos pontos assinalados e entregue nos recipientes correspondentes.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-17','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. As novas lanternas serão feitas com abóboras. O grupo também está separando as cascas retiradas durante o preparo para aproveitar na compostagem.

Complicação: Uma das peças parece intacta, mas o ajudante se recusa a tocá-la. Folhas se voltam para o mesmo ponto, embora não haja vento. Investigue o receio e escolha como transportá-la ou substituí-la.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Entregue 4 abóboras intactas e leve as cascas do preparo até a caixa de compostagem atrás das barracas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-18','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. Os visitantes precisarão encontrar o festival depois de escurecer. Uma das marcações fica em uma passagem pouco usada, que dá acesso aos fundos da clareira.

Complicação: Um visitante indica um caminho diferente daquele mostrado pelos organizadores. Folhas se voltam para o mesmo ponto, embora não haja vento. Compare os indícios e decida por onde seguir com segurança.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Amarre 6 fitas nos pontos indicados do caminho até o festival.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-19','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. A chuva deixou poças perto das mesas. Os organizadores entregaram um desenho para conduzir a água até a área das raízes sem alagar as barracas.

Complicação: O serviço parece terminado até que folhas se voltam para o mesmo ponto, embora não haja vento. Um ajuste pode afetar o trabalho já pronto. Escolha o que revisar e teste sua solução.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Abra 3 pequenos canais de escoamento nos trechos demarcados, seguindo o desenho recebido.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-20','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. As bases de madeira estão destoando do restante da decoração. O grupo quer cobrir os suportes com musgo, mas pede que as raízes vivas sejam preservadas.

Complicação: Um ajudante reconhece uma marca que preferia não encontrar ali. Folhas se voltam para o mesmo ponto, embora não haja vento. Converse com ele e decida como proteger os preparativos sem espalhar rumores.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 6 porções de musgo em pedras úmidas e entregue para cobrir os suportes.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-21','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. Pequenos sinos serão colocados nas entradas do festival. Um deles soa mais baixo que os outros, mas os organizadores pedem que seja mantido.

Complicação: No meio da tarefa, folhas se voltam para o mesmo ponto, embora não haja vento. Um visitante pede ajuda enquanto o material fica exposto. Organize as prioridades e mostre as consequências de sua escolha.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Instale 4 sinos nos suportes marcados e teste cada um.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-22','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. A passagem de trabalhadores deixou alguns trechos das raízes expostos. As fitas amarradas nesses pontos devem permanecer no lugar durante o trabalho.

Complicação: As instruções de dois responsáveis se contradizem. Folhas se voltam para o mesmo ponto, embora não haja vento. Compare o que cada um viu e escolha como deixar o serviço seguro para a celebração.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Cubra 4 pontos das raízes com a terra e as folhas entregues pelo grupo, sem deslocar as fitas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-23','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. Uma parte da clareira será reservada para homenagens. Os moradores poderão deixar pequenas lembranças diante das lanternas preparadas pelo grupo.

Complicação: Uma parte do trabalho foi alterada durante sua ausência. Folhas se voltam para o mesmo ponto, embora não haja vento. Investigue o que mudou e decida o que pode ser preservado e o que precisa ser refeito.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Coloque 6 lanternas apagadas nos suportes indicados e deixe espaço para as lembranças.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-24','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. O grupo quer conferir se o caminho está bem iluminado. Em alguns trechos, a luz parece ficar mais fraca perto do chão.

Complicação: O teste final produz um resultado que ninguém esperava: folhas se voltam para o mesmo ponto, embora não haja vento. Decida se interrompe, repete ou adapta o serviço e registre o que aconteceu.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Percorra 5 pontos da trilha à noite e registre quais lanternas precisam de óleo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('aokigahara','2026-10-25','Contexto: Seu personagem é chamado para ajudar na clareira das barracas, entre as raízes da floresta. Os organizadores estão fazendo a última revisão da área. O cesto de folhas destinado à estrutura central será guardado fechado até a noite principal do festival.

Complicação: Os organizadores pedem a revisão final, mas folhas se voltam para o mesmo ponto, embora não haja vento. Escolha o que precisa de atenção antes da entrega e deixe um aviso sobre o indício que continua sem explicação.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recoloque uma placa, reforce duas amarrações e leve um cesto de folhas até a estrutura central.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-08','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Algumas caixas chegaram com as lonas soltas. A água está se aproximando dos tecidos e dos enfeites que serão usados nas barracas.

Complicação: Um ajudante aponta uma área que ninguém quer tocar. Quando você se aproxima, batidas ecoam sob o metal, sempre depois do trovão. Decida como examinar o lugar antes de começar o trabalho.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Leve 4 caixas de materiais até a área coberta indicada.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-09','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. As primeiras barracas precisam de reforço para suportar o tempo de Darkya. O grupo aceita peças usadas, desde que estejam firmes.

Complicação: As indicações do grupo não coincidem com os sinais do caminho. Batidas ecoam sob o metal, sempre depois do trovão. Escolha em que orientação confiar e como garantir a passagem dos visitantes.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Entregue 6 peças de madeira resistente para sustentar as coberturas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-10','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. A água recolhida será usada na limpeza e nos preparativos. Os organizadores pedem barris que nunca tenham armazenado óleo.

Complicação: Um organizador interrompe o serviço ao perceber que batidas ecoam sob o metal, sempre depois do trovão. Ele teme assustar os visitantes. Decida como continuar sem ignorar o ocorrido.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Consiga 3 barris vazios, lave por dentro e entregue ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-11','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Folhas e ferrugem estão impedindo a passagem da água nas construções cedidas ao festival. O grupo forneceu sacos para guardar os resíduos retirados.

Complicação: Um ajudante insiste que parte do material mudou desde a última inspeção. Batidas ecoam sob o metal, sempre depois do trovão. Examine o que pode ser usado e explique sua escolha ao grupo.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Limpe 4 trechos de calha e deixe os resíduos nos sacos fornecidos.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-12','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Os tecidos das barracas chegaram manchados da viagem. Cada peça tem uma pequena marca bordada no canto, que deve ser preservada durante a lavagem.

Complicação: O material disponível parece adequado, mas uma das peças reage à sua aproximação: batidas ecoam sob o metal, sempre depois do trovão. Escolha como testá-la sem comprometer os preparativos.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Lave 5 peças na água recolhida pelo grupo e estenda na área coberta.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-13','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Um dos cozinheiros separou novos recipientes para o trabalho. Para este pedido, a água dos reservatórios antigos não serve.

Complicação: Um trabalhador quer aproveitar tudo; outro pede que uma peça seja deixada para trás. Batidas ecoam sob o metal, sempre depois do trovão. Ouça os dois e decida o que levar para a festa.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Encha 3 jarros com água de chuva recém-recolhida nos pontos indicados.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-14','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Alguns reservatórios estão recebendo sujeira das ruas. Os barris já estão identificados por símbolos na madeira e precisam conservar a abertura da coleta.

Complicação: Durante o serviço, batidas ecoam sob o metal, sempre depois do trovão. Um ajudante abandona sua tarefa e pede que você o acompanhe. Decida como tranquilizá-lo e preservar o que estão preparando.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Ajuste 4 tampas, deixando apenas a abertura destinada à entrada da água.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-15','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. O terreno entre as barracas está dificultando o transporte. Pequenas canaletas passam entre os reservatórios e não devem ser cobertas.

Complicação: As marcas deixadas pelo grupo terminam onde batidas ecoam sob o metal, sempre depois do trovão. Reconstrua o trajeto e escolha como recuperar o que falta sem danificar os enfeites.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Espalhe 5 cargas de cascalho nos trechos marcados, deixando as canaletas livres.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-16','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Durante a madrugada, duas coberturas cederam e alguns vasos foram deslocados. Mesmo os que ficaram em lugares aparentemente melhores precisam voltar às marcas do piso.

Complicação: Uma marca nos recipientes não consta nas instruções. Batidas ecoam sob o metal, sempre depois do trovão. Decida como manter o material separado e quem deve receber seu relato.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recoloque 5 recipientes nas posições marcadas pelos organizadores.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-17','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. O grupo está testando uma receita para o festival. As cascas das frutas serão guardadas para perfumar a água usada na limpeza.

Complicação: Uma das peças parece intacta, mas o ajudante se recusa a tocá-la. Batidas ecoam sob o metal, sempre depois do trovão. Investigue o receio e escolha como transportá-la ou substituí-la.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 6 porções de frutas ácidas e entregue na barraca de preparo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-18','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Os organizadores querem substituir parte da água armazenada. Os frascos devem ser preenchidos depois do primeiro trovão e entregues com as tampas fechadas.

Complicação: Um visitante indica um caminho diferente daquele mostrado pelos organizadores. Batidas ecoam sob o metal, sempre depois do trovão. Compare os indícios e decida por onde seguir com segurança.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Durante uma tempestade, recolha 3 frascos de água nas calhas indicadas, depois do primeiro trovão.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-19','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. A chuva apagou algumas identificações. O desenho de cada marca vem em uma folha separada, junto da posição correta.

Complicação: O serviço parece terminado até que batidas ecoam sob o metal, sempre depois do trovão. Um ajuste pode afetar o trabalho já pronto. Escolha o que revisar e teste sua solução.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Refaça 6 marcas nos barris usando a tinta e os desenhos fornecidos.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-20','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Uma infiltração está ameaçando as caixas de decoração. A água recolhida durante o reparo deve ser levada ao reservatório coberto.

Complicação: Um ajudante reconhece uma marca que preferia não encontrar ali. Batidas ecoam sob o metal, sempre depois do trovão. Converse com ele e decida como proteger os preparativos sem espalhar rumores.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Vede 3 goteiras, posicione os recipientes de coleta e leve a água ao reservatório coberto.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-21','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Alguns recipientes precisam ser limpos antes de receber mais água. Os organizadores querem conferir o material acumulado antes de descartar.

Complicação: No meio da tarefa, batidas ecoam sob o metal, sempre depois do trovão. Um visitante pede ajuda enquanto o material fica exposto. Organize as prioridades e mostre as consequências de sua escolha.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Retire o sedimento de 4 vasos vazios e entregue os resíduos ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-22','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. As lanternas das tendas estão apagando com facilidade. Uma delas fica sobre o reservatório central, longe das mesas.

Complicação: As instruções de dois responsáveis se contradizem. Batidas ecoam sob o metal, sempre depois do trovão. Compare o que cada um viu e escolha como deixar o serviço seguro para a celebração.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Instale 5 proteções de vidro e confira as amarrações das lanternas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-23','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. A barraca de preparo precisa de água separada para os últimos dias. O grupo entregou uma lista com a ordem dos barris que devem ser usados.

Complicação: Uma parte do trabalho foi alterada durante sua ausência. Batidas ecoam sob o metal, sempre depois do trovão. Investigue o que mudou e decida o que pode ser preservado e o que precisa ser refeito.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Transfira 6 baldes dos barris identificados para o reservatório central, seguindo a ordem da lista.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-24','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. O grupo quer verificar o funcionamento das calhas durante uma chuva. Todos os pontos de escoamento devem alimentar os recipientes indicados.

Complicação: O teste final produz um resultado que ninguém esperava: batidas ecoam sob o metal, sempre depois do trovão. Decida se interrompe, repete ou adapta o serviço e registre o que aconteceu.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Observe 4 pontos de escoamento durante a chuva e corrija as peças que estiverem desviando a água.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('darkya','2026-10-25','Contexto: Seu personagem é chamado para ajudar na área da festa entre as passarelas da Cidade Ferrugem. Os materiais que só serão usados na celebração precisam ser protegidos. A lona central tem aberturas próprias para a água continuar entrando.

Complicação: Os organizadores pedem a revisão final, mas batidas ecoam sob o metal, sempre depois do trovão. Escolha o que precisa de atenção antes da entrega e deixe um aviso sobre o indício que continua sem explicação.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Cubra três reservatórios e prenda a lona da estrutura central, mantendo livres as aberturas de coleta.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-08','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. A área cedida ao festival ainda está coberta pela nevasca. Algumas marcas já estavam no gelo quando o grupo chegou e precisam continuar visíveis.

Complicação: Um ajudante aponta uma área que ninguém quer tocar. Quando você se aproxima, uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Decida como examinar o lugar antes de começar o trabalho.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Limpe 4 trechos demarcados, levando a neve retirada até a borda do terreno.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-09','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. As caixas mais pesadas continuam perto da entrada da capital. Uma delas precisa permanecer fechada e longe dos braseiros.

Complicação: As indicações do grupo não coincidem com os sinais do caminho. Uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Escolha em que orientação confiar e como garantir a passagem dos visitantes.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Transporte 3 caixas nos trenós disponibilizados e deixe nos pontos indicados.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-10','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. Os visitantes terão um espaço para se aquecer. Os braseiros ficarão afastados da escultura principal para não prejudicar o trabalho.

Complicação: Um organizador interrompe o serviço ao perceber que uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Ele teme assustar os visitantes. Decida como continuar sem ignorar o ocorrido.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Entregue 8 pedaços de lenha seca na área das barracas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-11','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. O grupo começou a selecionar blocos para as esculturas. Peças com bolhas ou rachaduras serão separadas para outros usos.

Complicação: Um ajudante insiste que parte do material mudou desde a última inspeção. Uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Examine o que pode ser usado e explique sua escolha ao grupo.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 4 fragmentos de gelo transparente na região indicada, sem bolhas ou rachaduras.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-12','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. As laterais das barracas precisam de proteção. O desenho dos organizadores indica quais passagens devem continuar abertas.

Complicação: O material disponível parece adequado, mas uma das peças reage à sua aproximação: uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Escolha como testá-la sem comprometer os preparativos.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Instale 4 painéis de tecido grosso, deixando abertas as passagens marcadas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-13','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. Algumas ferramentas ficaram congeladas durante o trabalho. O grupo forneceu um material para soltá-las sem aquecer as caixas ao redor.

Complicação: Um trabalhador quer aproveitar tudo; outro pede que uma peça seja deixada para trás. Uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Ouça os dois e decida o que levar para a festa.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recupere 5 ferramentas no depósito externo e entregue ao escultor.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-14','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. As lanternas receberão cristais que refletem melhor a luz. O grupo procura os que continuam frios mesmo depois de algum tempo dentro de uma bolsa.

Complicação: Durante o serviço, uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Um ajudante abandona sua tarefa e pede que você o acompanhe. Decida como tranquilizá-lo e preservar o que estão preparando.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 6 cristais pálidos nas formações próximas e entregue aos organizadores.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-15','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. Os suportes da escultura precisam ser assentados nas cavidades já abertas. Cada placa tem uma marca que deve ficar voltada para baixo.

Complicação: As marcas deixadas pelo grupo terminam onde uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Reconstrua o trajeto e escolha como recuperar o que falta sem danificar os enfeites.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Coloque 4 placas de pedra nas cavidades indicadas, com as marcas voltadas para baixo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-16','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. Os alimentos da festa serão guardados em caixas próprias. Os organizadores pedem que cada caixa receba uma camada de neve limpa.

Complicação: Uma marca nos recipientes não consta nas instruções. Uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Decida como manter o material separado e quem deve receber seu relato.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Separe 5 porções de ingredientes e leve ao depósito indicado, cobrindo as caixas com neve limpa.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-17','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. A neve voltou a cobrir a entrada do festival. Uma das lanternas baixas marca uma passagem usada apenas pelos trabalhadores.

Complicação: Uma das peças parece intacta, mas o ajudante se recusa a tocá-la. Uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Investigue o receio e escolha como transportá-la ou substituí-la.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Limpe 5 pontos do trajeto e reposicione as lanternas baixas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-18','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. Uma parte da escultura começou a apresentar fissuras. A mistura entregue pelo grupo deixa o gelo levemente azulado antes de desaparecer.

Complicação: Um visitante indica um caminho diferente daquele mostrado pelos organizadores. Uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Compare os indícios e decida por onde seguir com segurança.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Preencha 3 rachaduras com a mistura fornecida e alise a superfície.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-19','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. A decoração das mesas precisa de neve limpa. Os recipientes serão fechados assim que chegarem à área de preparo.

Complicação: O serviço parece terminado até que uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Um ajuste pode afetar o trabalho já pronto. Escolha o que revisar e teste sua solução.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 4 recipientes de neve em uma área protegida do vento e entregue sem compactar.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-20','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. Algumas peças decorativas serão congeladas na base da escultura. Cada peça tem um formato diferente e uma cavidade correspondente.

Complicação: Um ajudante reconhece uma marca que preferia não encontrar ali. Uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Converse com ele e decida como proteger os preparativos sem espalhar rumores.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Coloque 5 pequenos enfeites nas cavidades indicadas e cubra com água.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-21','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. O grupo espera receber visitantes que viajaram de longe. As mantas gastas também servem, desde que não estejam rasgadas.

Complicação: No meio da tarefa, uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Um visitante pede ajuda enquanto o material fica exposto. Organize as prioridades e mostre as consequências de sua escolha.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Entregue 3 mantas grossas e organize os bancos da área de descanso.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-22','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. Os organizadores estão testando a iluminação. Algumas partes da estrutura continuam escuras mesmo com as lanternas próximas.

Complicação: As instruções de dois responsáveis se contradizem. Uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Compare o que cada um viu e escolha como deixar o serviço seguro para a celebração.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Posicione 4 lanternas ao redor da estrutura e marque no desenho os pontos que continuam escuros.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-23','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. Algumas caixas precisam ser transferidas para uma sala com temperatura mais baixa. Há instruções para não empilhar nenhuma delas.

Complicação: Uma parte do trabalho foi alterada durante sua ausência. Uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Investigue o que mudou e decida o que pode ser preservado e o que precisa ser refeito.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Leve 3 caixas lacradas até o novo depósito, mantendo cada uma separada.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-24','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. A escultura está quase pronta. Os canais estreitos da base precisam permanecer abertos até a revisão dos organizadores.

Complicação: O teste final produz um resultado que ninguém esperava: uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Decida se interrompe, repete ou adapta o serviço e registre o que aconteceu.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Remova o excesso de neve de 5 partes da estrutura e limpe os canais estreitos da base.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('oymyakon','2026-10-25','Contexto: Seu personagem é chamado para ajudar no acampamento do festival junto às rotas de gelo. O grupo está fechando a área de trabalho. O compartimento da base será selado com uma nova camada de gelo depois que receber os cristais.

Complicação: Os organizadores pedem a revisão final, mas uma silhueta aparece no gelo, mas não acompanha os movimentos de ninguém. Escolha o que precisa de atenção antes da entrega e deixe um aviso sobre o indício que continua sem explicação.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Prenda duas coberturas e coloque uma caixa de cristais no compartimento da base.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-08','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. O grupo trouxe menos materiais do que precisava. O depósito local autorizou a retirada de peças reaproveitáveis para as primeiras barracas.

Complicação: Um ajudante aponta uma área que ninguém quer tocar. Quando você se aproxima, um sino distante toca quando as ilhas ficam imóveis. Decida como examinar o lugar antes de começar o trabalho.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 6 peças de madeira reaproveitável no depósito autorizado e entregue ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-09','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. Algumas fitas escaparam durante a descarga. As mais leves acabaram presas nas bordas das passarelas.

Complicação: As indicações do grupo não coincidem com os sinais do caminho. Um sino distante toca quando as ilhas ficam imóveis. Escolha em que orientação confiar e como garantir a passagem dos visitantes.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recupere 8 fitas nos pontos indicados da capital e devolva aos organizadores.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-10','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. Os postes precisam ser firmados antes da instalação das luzes. Cada base deve ficar sobre a marca correspondente no piso.

Complicação: Um organizador interrompe o serviço ao perceber que um sino distante toca quando as ilhas ficam imóveis. Ele teme assustar os visitantes. Decida como continuar sem ignorar o ocorrido.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Monte 4 bases com as peças fornecidas, respeitando as marcas do piso.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-11','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. O grupo aceita fragmentos que já não são usados em peças maiores. Os organizadores querem todos separados por tamanho.

Complicação: Um ajudante insiste que parte do material mudou desde a última inspeção. Um sino distante toca quando as ilhas ficam imóveis. Examine o que pode ser usado e explique sua escolha ao grupo.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Entregue 6 pequenos cristais de Mana obtidos na área autorizada, separados por tamanho.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-12','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. As coberturas precisam resistir ao vento de Skypiece. Os fios finos presos aos suportes devem permanecer livres durante o reforço.

Complicação: O material disponível parece adequado, mas uma das peças reage à sua aproximação: um sino distante toca quando as ilhas ficam imóveis. Escolha como testá-la sem comprometer os preparativos.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Reforce 5 amarrações nas barracas sem prender os fios finos dos suportes.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-13','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. A iluminação será dividida entre as áreas do festival. A lanterna azul fica na passagem entre duas barracas.

Complicação: Um trabalhador quer aproveitar tudo; outro pede que uma peça seja deixada para trás. Um sino distante toca quando as ilhas ficam imóveis. Ouça os dois e decida o que levar para a festa.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Instale 5 lanternas de acordo com o desenho recebido.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-14','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. Parte do terreno precisa de uma cobertura para evitar tropeços. Algumas placas têm um pequeno espaço por baixo para a passagem dos cabos.

Complicação: Durante o serviço, um sino distante toca quando as ilhas ficam imóveis. Um ajudante abandona sua tarefa e pede que você o acompanhe. Decida como tranquilizá-lo e preservar o que estão preparando.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Assente 6 placas de piso nos trechos preparados, preservando o espaço dos cabos.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-15','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. Certas lanternas apagam pouco depois de serem acesas. Um dos cristais volta a brilhar quando é aproximado dos demais.

Complicação: As marcas deixadas pelo grupo terminam onde um sino distante toca quando as ilhas ficam imóveis. Reconstrua o trajeto e escolha como recuperar o que falta sem danificar os enfeites.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Teste 4 lanternas e leve os cristais defeituosos ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-16','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. Os organizadores querem evitar atrasos durante a festa. As peças precisam estar sem ferrugem e sem tinta nas extremidades.

Complicação: Uma marca nos recipientes não consta nas instruções. Um sino distante toca quando as ilhas ficam imóveis. Decida como manter o material separado e quem deve receber seu relato.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Consiga 5 conectores metálicos no depósito autorizado e entregue ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-17','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. Alguns cabos ficaram expostos perto das mesas. Eles serão cobertos depois da revisão, mas a sequência das etiquetas precisa ser mantida.

Complicação: Uma das peças parece intacta, mas o ajudante se recusa a tocá-la. Um sino distante toca quando as ilhas ficam imóveis. Investigue o receio e escolha como transportá-la ou substituí-la.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Prenda 6 trechos de fio nos encaixes indicados, mantendo a sequência das etiquetas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-18','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. A poeira está alterando a cor das lanternas. Uma das proteções tem marcas por dentro e precisa ser devolvida sem tentar removê-las.

Complicação: Um visitante indica um caminho diferente daquele mostrado pelos organizadores. Um sino distante toca quando as ilhas ficam imóveis. Compare os indícios e decida por onde seguir com segurança.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Limpe 5 proteções de vidro com o tecido fornecido, preservando as marcas internas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-19','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. O grupo quer ajustar a aparência da decoração. A altura pedida varia poucos centímetros entre cada suporte.

Complicação: O serviço parece terminado até que um sino distante toca quando as ilhas ficam imóveis. Um ajuste pode afetar o trabalho já pronto. Escolha o que revisar e teste sua solução.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Reposicione 4 lanternas usando a régua e as medidas entregues pelos organizadores.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-20','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. Uma caixa de materiais ficou no ponto de chegada da Ponte de Arco-Íris. Ela contém peças reservadas para a estrutura central.

Complicação: Um ajudante reconhece uma marca que preferia não encontrar ali. Um sino distante toca quando as ilhas ficam imóveis. Converse com ele e decida como proteger os preparativos sem espalhar rumores.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Busque a caixa identificada com uma lanterna e entregue fechada na área do festival.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-21','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. A iluminação precisa funcionar com todas as áreas ocupadas. O grupo forneceu uma ordem específica para o teste.

Complicação: No meio da tarefa, um sino distante toca quando as ilhas ficam imóveis. Um visitante pede ajuda enquanto o material fica exposto. Organize as prioridades e mostre as consequências de sua escolha.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Ative 5 conjuntos de lanternas, um de cada vez, na ordem recebida, e anote qual demora mais para acender.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-22','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. Algumas peças serão substituídas antes da celebração. Os cristais antigos devem voltar para a caixa de coleta.

Complicação: As instruções de dois responsáveis se contradizem. Um sino distante toca quando as ilhas ficam imóveis. Compare o que cada um viu e escolha como deixar o serviço seguro para a celebração.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Retire 4 cristais opacos, coloque os novos nos mesmos encaixes e devolva as peças antigas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-23','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. Os fios ainda aparecem em partes da decoração. As pequenas placas metálicas nas pontas precisam continuar descobertas.

Complicação: Uma parte do trabalho foi alterada durante sua ausência. Um sino distante toca quando as ilhas ficam imóveis. Investigue o que mudou e decida o que pode ser preservado e o que precisa ser refeito.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Instale 5 faixas de tecido sobre os suportes indicados, deixando as placas metálicas expostas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-24','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. O grupo quer observar as lanternas quando o local estiver mais vazio. Algumas parecem acompanhar o brilho do Cristal Azul ao longe.

Complicação: O teste final produz um resultado que ninguém esperava: um sino distante toca quando as ilhas ficam imóveis. Decida se interrompe, repete ou adapta o serviço e registre o que aconteceu.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Confira 6 luzes ao anoitecer e registre qualquer mudança de cor.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('skypiece','2026-10-25','Contexto: Seu personagem é chamado para ajudar nas plataformas reservadas à festa, junto às pontes suspensas. O cristal reservado à estrutura central chegou embalado. Depois da instalação, a ferramenta precisa voltar para o responsável pelos testes finais.

Complicação: Os organizadores pedem a revisão final, mas um sino distante toca quando as ilhas ficam imóveis. Escolha o que precisa de atenção antes da entrega e deixe um aviso sobre o indício que continua sem explicação.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Leve o cristal embalado até a estrutura central, encaixe na posição indicada e feche a proteção.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-08','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Algumas mercadorias ainda estão nas carroças. Os espelhos serão descarregados separadamente dos outros enfeites.

Complicação: Um ajudante aponta uma área que ninguém quer tocar. Quando você se aproxima, uma sombra permanece na areia mesmo depois que a luz muda. Decida como examinar o lugar antes de começar o trabalho.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Leve 5 volumes de tecidos e enfeites até a praça escolhida.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-09','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. As primeiras barracas precisam de cobertura. Os organizadores pedem que a parte central da praça continue livre.

Complicação: As indicações do grupo não coincidem com os sinais do caminho. Uma sombra permanece na areia mesmo depois que a luz muda. Escolha em que orientação confiar e como garantir a passagem dos visitantes.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Instale 4 toldos nos suportes preparados, deixando o centro da praça livre.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-10','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. A viagem deixou areia nas caixas de decoração. As pequenas marcas gravadas na madeira não devem ser removidas durante a limpeza.

Complicação: Um organizador interrompe o serviço ao perceber que uma sombra permanece na areia mesmo depois que a luz muda. Ele teme assustar os visitantes. Decida como continuar sem ignorar o ocorrido.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Limpe 6 suportes de espelho e entregue as peças prontas para montagem.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-11','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Os comerciantes estão preparando amostras para os moradores. Cada porção de frutas será usada em uma receita diferente.

Complicação: Um ajudante insiste que parte do material mudou desde a última inspeção. Uma sombra permanece na areia mesmo depois que a luz muda. Examine o que pode ser usado e explique sua escolha ao grupo.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 8 porções de frutas secas e entregue na barraca de doces.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-12','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Os primeiros espelhos já podem ser colocados na praça. Um deles tem o vidro mais escuro que os outros.

Complicação: O material disponível parece adequado, mas uma das peças reage à sua aproximação: uma sombra permanece na areia mesmo depois que a luz muda. Escolha como testá-la sem comprometer os preparativos.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Limpe 5 espelhos com o material fornecido e leve até os suportes numerados.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-13','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Algumas barracas receberão cortinas leves. O grupo quer materiais que permitam a passagem da luz sem deixar o interior completamente exposto.

Complicação: Um trabalhador quer aproveitar tudo; outro pede que uma peça seja deixada para trás. Uma sombra permanece na areia mesmo depois que a luz muda. Ouça os dois e decida o que levar para a festa.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Consiga 4 peças de tecido fino e entregue aos organizadores.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-14','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Os suportes mais pesados estão cedendo na areia. As posições já foram medidas pelos organizadores.

Complicação: Durante o serviço, uma sombra permanece na areia mesmo depois que a luz muda. Um ajudante abandona sua tarefa e pede que você o acompanhe. Decida como tranquilizá-lo e preservar o que estão preparando.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Coloque 6 placas de pedra sob as bases indicadas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-15','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Um artesão local terminou novas peças para o festival. Os discos serão guardados em caixas individuais ao chegar à praça.

Complicação: As marcas deixadas pelo grupo terminam onde uma sombra permanece na areia mesmo depois que a luz muda. Reconstrua o trajeto e escolha como recuperar o que falta sem danificar os enfeites.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Busque 3 discos de vidro polido e leve até a praça sem empilhar.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-16','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. O grupo quer distribuir os enfeites entre as barracas. Duas molduras ficam voltadas para o centro, mesmo sem nenhuma barraca naquela direção.

Complicação: Uma marca nos recipientes não consta nas instruções. Uma sombra permanece na areia mesmo depois que a luz muda. Decida como manter o material separado e quem deve receber seu relato.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Instale 5 molduras decorativas nos suportes marcados.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-17','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Uma ventania deslocou algumas peças. Os organizadores pedem que o ajuste seja feito no horário registrado na folha da missão.

Complicação: Uma das peças parece intacta, mas o ajudante se recusa a tocá-la. Uma sombra permanece na areia mesmo depois que a luz muda. Investigue o receio e escolha como transportá-la ou substituí-la.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recoloque 4 espelhos nas posições marcadas no chão, no horário indicado.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-18','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. As placas do festival precisam ser retocadas. O responsável pela decoração procura um tom dourado específico.

Complicação: Um visitante indica um caminho diferente daquele mostrado pelos organizadores. Uma sombra permanece na areia mesmo depois que a luz muda. Compare os indícios e decida por onde seguir com segurança.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 5 porções de pigmento mineral na área indicada e entregue para o preparo da tinta.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-19','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Alguns reflexos estão atingindo os olhos dos visitantes. O esquema recebido direciona a luz para as faixas claras presas acima das mesas.

Complicação: O serviço parece terminado até que uma sombra permanece na areia mesmo depois que a luz muda. Um ajuste pode afetar o trabalho já pronto. Escolha o que revisar e teste sua solução.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Ajuste 3 pequenos espelhos para que os reflexos alcancem as faixas indicadas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-20','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Os enfeites de vidro serão usados apenas na celebração principal. Cada peça precisa ficar com a face marcada para cima.

Complicação: Um ajudante reconhece uma marca que preferia não encontrar ali. Uma sombra permanece na areia mesmo depois que a luz muda. Converse com ele e decida como proteger os preparativos sem espalhar rumores.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Embale 6 peças com os tecidos fornecidos e coloque nas caixas numeradas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-21','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. A areia voltou a cobrir os espelhos mais baixos. Uma das peças permanece morna mesmo sob a sombra do toldo.

Complicação: No meio da tarefa, uma sombra permanece na areia mesmo depois que a luz muda. Um visitante pede ajuda enquanto o material fica exposto. Organize as prioridades e mostre as consequências de sua escolha.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Limpe 5 espelhos instalados sem alterar sua inclinação.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-22','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Os organizadores querem testar um efeito para a festa. A placa de teste será retirada assim que o trabalho terminar.

Complicação: As instruções de dois responsáveis se contradizem. Uma sombra permanece na areia mesmo depois que a luz muda. Compare o que cada um viu e escolha como deixar o serviço seguro para a celebração.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Ajuste 3 espelhos menores até que seus reflexos alcancem as marcas da placa de teste.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-23','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. Parte da decoração ficará escondida até a noite principal. Há pequenas passagens assinaladas nas laterais da estrutura.

Complicação: Uma parte do trabalho foi alterada durante sua ausência. Uma sombra permanece na areia mesmo depois que a luz muda. Investigue o que mudou e decida o que pode ser preservado e o que precisa ser refeito.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Pendure 4 cortinas ao redor da estrutura central, deixando abertas as passagens assinaladas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-24','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. O desenho dos reflexos precisa ser revisado. Os organizadores pedem apenas o registro dos resultados, sem novos ajustes.

Complicação: O teste final produz um resultado que ninguém esperava: uma sombra permanece na areia mesmo depois que a luz muda. Decida se interrompe, repete ou adapta o serviço e registre o que aconteceu.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Visite 5 suportes no horário indicado e confira se a luz alcança suas marcas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('lesedi','2026-10-25','Contexto: Seu personagem é chamado para ajudar nas tendas do festival entre as dunas. O último disco de vidro polido será usado na estrutura central. A peça ficará coberta até a apresentação do festival.

Complicação: Os organizadores pedem a revisão final, mas uma sombra permanece na areia mesmo depois que a luz muda. Escolha o que precisa de atenção antes da entrega e deixe um aviso sobre o indício que continua sem explicação.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Leve o último disco até a estrutura central, ajude a prender a moldura e cubra com o tecido fornecido.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-08','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. Os equipamentos de viagem ainda estão na entrada de Namida. As bases da área do festival já estão preparadas para receber a carga.

Complicação: Um ajudante aponta uma área que ninguém quer tocar. Quando você se aproxima, uma melodia atravessa a água sem que se veja sua origem. Decida como examinar o lugar antes de começar o trabalho.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Transporte 4 caixas impermeáveis até a área do festival e coloque sobre as bases preparadas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-09','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. Parte da decoração chegou coberta de sal. As peças têm encaixes pequenos que também precisam ficar desobstruídos.

Complicação: As indicações do grupo não coincidem com os sinais do caminho. Uma melodia atravessa a água sem que se veja sua origem. Escolha em que orientação confiar e como garantir a passagem dos visitantes.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Limpe 6 peças metálicas com a solução fornecida e entregue ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-10','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. O grupo quer decorar as barracas com materiais da região. As conchas precisam estar vazias para não prejudicar os animais.

Complicação: Um organizador interrompe o serviço ao perceber que uma melodia atravessa a água sem que se veja sua origem. Ele teme assustar os visitantes. Decida como continuar sem ignorar o ocorrido.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 10 conchas vazias na área permitida, sem retirar animais vivos de suas casas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-11','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. As primeiras lanternas estão prontas para instalação. Uma delas ficará baixa, perto da estrutura central.

Complicação: Um ajudante insiste que parte do material mudou desde a última inspeção. Uma melodia atravessa a água sem que se veja sua origem. Examine o que pode ser usado e explique sua escolha ao grupo.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Pendure 5 lanternas marinhas nos suportes indicados.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-12','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. As amarrações comuns começaram a se desfazer. O novo material será usado nas barracas e nos suportes dos enfeites.

Complicação: O material disponível parece adequado, mas uma das peças reage à sua aproximação: uma melodia atravessa a água sem que se veja sua origem. Escolha como testá-la sem comprometer os preparativos.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Entregue 6 porções de fibra própria para uso marinho ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-13','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. Algumas esferas foram danificadas durante a viagem. As peças rachadas ficarão em outra caixa para revisão.

Complicação: Um trabalhador quer aproveitar tudo; outro pede que uma peça seja deixada para trás. Uma melodia atravessa a água sem que se veja sua origem. Ouça os dois e decida o que levar para a festa.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Separe 5 esferas intactas no depósito e entregue ao responsável pela decoração.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-14','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. O grupo está preparando tinta para as placas. Os organizadores pedem que as amostras permaneçam úmidas durante o transporte.

Complicação: Durante o serviço, uma melodia atravessa a água sem que se veja sua origem. Um ajudante abandona sua tarefa e pede que você o acompanhe. Decida como tranquilizá-lo e preservar o que estão preparando.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 4 porções de pigmento de algas na área autorizada e entregue ainda úmidas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-15','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. As primeiras bolhas decorativas já podem ser distribuídas. Cada uma deve permanecer acima de sua própria base.

Complicação: As marcas deixadas pelo grupo terminam onde uma melodia atravessa a água sem que se veja sua origem. Reconstrua o trajeto e escolha como recuperar o que falta sem danificar os enfeites.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Instale 4 esferas encantadas nos suportes indicados e confira a posição das bolhas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-16','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. As molduras receberão detalhes de coral. O grupo aceita apenas fragmentos que já estejam desprendidos.

Complicação: Uma marca nos recipientes não consta nas instruções. Uma melodia atravessa a água sem que se veja sua origem. Decida como manter o material separado e quem deve receber seu relato.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Recolha 6 fragmentos de coral já desprendidos na região indicada, sem cortar corais vivos.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-17','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. Algumas peças precisam passar por um teste antes da instalação. Os suportes próximos da redoma foram autorizados para esse trabalho.

Complicação: Uma das peças parece intacta, mas o ajudante se recusa a tocá-la. Uma melodia atravessa a água sem que se veja sua origem. Investigue o receio e escolha como transportá-la ou substituí-la.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Coloque 3 esferas nos suportes indicados, aguarde o indicador mudar de cor e devolva as peças ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-18','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. Certos enfeites perdem a forma pouco depois de serem ativados. Uma das esferas forma uma película que demora a desaparecer.

Complicação: Um visitante indica um caminho diferente daquele mostrado pelos organizadores. Uma melodia atravessa a água sem que se veja sua origem. Compare os indícios e decida por onde seguir com segurança.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Teste 5 esferas e separe as que não conseguem manter a bolha.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-19','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. A água acumulada está alcançando algumas caixas. As caixas com esferas devem permanecer próximas umas das outras.

Complicação: O serviço parece terminado até que uma melodia atravessa a água sem que se veja sua origem. Um ajuste pode afetar o trabalho já pronto. Escolha o que revisar e teste sua solução.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Coloque 4 bases de pedra sob os recipientes indicados, mantendo as caixas com esferas próximas.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-20','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. O grupo quer finalizar os detalhes das lanternas. Peças irregulares também serão aceitas, desde que estejam inteiras.

Complicação: Um ajudante reconhece uma marca que preferia não encontrar ali. Uma melodia atravessa a água sem que se veja sua origem. Converse com ele e decida como proteger os preparativos sem espalhar rumores.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Consiga 5 pequenas pérolas de fornecedores ou pontos de coleta autorizados e entregue ao grupo.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-21','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. A entrada do festival receberá novos enfeites. As últimas esferas ficam na passagem para a parte de trás das barracas.

Complicação: No meio da tarefa, uma melodia atravessa a água sem que se veja sua origem. Um visitante pede ajuda enquanto o material fica exposto. Organize as prioridades e mostre as consequências de sua escolha.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Distribua 6 pequenas esferas luminosas ao longo do caminho marcado.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-22','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. Algumas esferas estão com o interior embaçado. Os organizadores pedem que elas não sejam abertas antes da revisão.

Complicação: As instruções de dois responsáveis se contradizem. Uma melodia atravessa a água sem que se veja sua origem. Compare o que cada um viu e escolha como deixar o serviço seguro para a celebração.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Leve 4 esferas até a bancada e registre quais apresentam uma película por dentro.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-23','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. As peças maiores já podem receber os últimos detalhes. Cada moldura guarda espaço para uma esfera transparente.

Complicação: Uma parte do trabalho foi alterada durante sua ausência. Uma melodia atravessa a água sem que se veja sua origem. Investigue o que mudou e decida o que pode ser preservado e o que precisa ser refeito.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Fixe 5 molduras de conchas nos encaixes indicados da estrutura central.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-24','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. O grupo quer conferir a decoração com menos gente passando. Algumas bolhas se aproximam umas das outras durante o teste.

Complicação: O teste final produz um resultado que ninguém esperava: uma melodia atravessa a água sem que se veja sua origem. Decida se interrompe, repete ou adapta o serviço e registre o que aconteceu.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Observe 5 conjuntos de bolhas no período indicado e registre quais se aproximam, sem tentar separá-las.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'),
('namida','2026-10-25','Contexto: Seu personagem é chamado para ajudar na área da celebração próxima à antiga redoma. A esfera reservada à celebração principal está na bancada próxima da redoma. Ela deve continuar lacrada durante o transporte.

Complicação: Os organizadores pedem a revisão final, mas uma melodia atravessa a água sem que se veja sua origem. Escolha o que precisa de atenção antes da entrega e deixe um aviso sobre o indício que continua sem explicação.

Encerramento: Mostre como sua ação ajuda o festival e relate aos organizadores o que observou. A origem do sinal permanece em aberto.','Na cena, desenvolva o pedido: «Busque a esfera lacrada, leve até a estrutura central, coloque no suporte marcado e feche a proteção.» Mostre sua decisão diante da complicação e o resultado da ajuda ao festival.'))
update public.v2_missions m
set description=s.description, objective=s.objective, updated_at=now()
from scenes s
where m.event_key='noites-apavorantes-2026'
  and m.kingdom=s.kingdom and m.event_day=s.event_day::date;

do $$ begin
  if (select count(*) from public.v2_missions where event_key='noites-apavorantes-2026'
      and description like 'Contexto:%' and description like '%Complicação:%'
      and description like '%Encerramento:%' and objective like 'Na cena,%') <> 108 then
    raise exception 'Festival scene catalog incomplete';
  end if;
end $$;
commit;

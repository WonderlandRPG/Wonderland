update public.v2_missions
set name=replace(name,'Materiais Trocados','Duas Áreas Trocadas'),
    description=replace(description,'Os materiais de duas famílias foram misturados. Separe cada conjunto pelas marcas de fabricação antes de concluir o trabalho.','As marcações de duas áreas foram trocadas durante a preparação. Confirme com o responsável o que pertence a cada trecho antes de prosseguir.'),
    objective=replace(objective,'Separe os materiais e devolva cada conjunto à família correta.','Corrija as marcações e conclua cada parte na área certa.'),
    updated_at=now()
where active and not is_rank_trial and rank='E' and slug ~ '-02$';

update public.v2_missions
set name=replace(name,'Peças Delicadas','Estruturas Delicadas'),
    description=replace(description,'Parte do material é frágil e possui valor afetivo. Transporte e organize essas peças sem causar rachaduras ou perdas.','Há estruturas frágeis ao redor da área de trabalho. Delimite o espaço e execute a tarefa sem causar rachaduras ou perdas.'),
    objective=replace(objective,'Preserve todas as peças frágeis durante o serviço.','Preserve todas as estruturas frágeis próximas da tarefa.'),
    updated_at=now()
where active and not is_rank_trial and rank='E' and slug ~ '-07$';

update public.v2_missions
set name=replace(name,'Filhotes Escondidos','Segundo Chamado'),
    description=replace(description,'Pegadas menores indicam que existem filhotes escondidos nas proximidades. Encontre-os antes de remover o animal adulto.','Um segundo pedido de ajuda veio de uma construção próxima e pode estar ligado ao mesmo incidente. Verifique-o antes de encerrar o trabalho.'),
    objective=replace(objective,'Localize os filhotes e reúna todos em segurança.','Atenda o segundo chamado e confirme se os dois incidentes estão ligados.'),
    updated_at=now()
where active and not is_rank_trial and rank='D' and slug ~ '-03$';

update public.v2_missions
set name=replace(name,'Remédio do Tratador','Ajuda do Especialista'),
    description=replace(description,'Um tratador preparou um calmante, mas precisa chegar perto o bastante para aplicá-lo. Proteja-o durante a aproximação.','Um especialista local conhece o problema, mas precisa chegar perto o bastante para avaliar a situação. Proteja-o durante a aproximação.'),
    objective=replace(objective,'Escolte o tratador e permita a aplicação segura do calmante.','Escolte o especialista e permita que ele conclua a avaliação.'),
    updated_at=now()
where active and not is_rank_trial and rank='D' and slug ~ '-05$';

update public.v2_missions
set name=replace(name,'Objeto Engolido','Pertence Perdido'),
    description=replace(description,'Um dos animais engoliu uma joia de família. Recupere-o com vida para que o curandeiro possa retirar o objeto.','Um pertence de família desapareceu durante a confusão. Localize-o sem abandonar a resolução do incidente principal.'),
    objective=replace(objective,'Identifique o animal correto e leve-o vivo ao curandeiro.','Recupere o pertence e conclua a tarefa principal.'),
    updated_at=now()
where active and not is_rank_trial and rank='D' and slug ~ '-09$';

update public.v2_missions
set name=replace(name,'Retorno à Natureza','Área Segura'),
    description=replace(description,'Após a contenção, os animais devem ser levados a um habitat distante das moradias, sem separar o grupo.','Depois da contenção, o local precisa ser vistoriado para impedir que o mesmo problema volte a ameaçar os moradores.'),
    objective=replace(objective,'Transporte e solte o grupo num habitat seguro.','Elimine a causa do incidente e entregue a área em segurança.'),
    updated_at=now()
where active and not is_rank_trial and rank='D' and slug ~ '-10$';

# O Projeto

- **Introdução**
  - Vocês são uma equipe responsável por elaborar um Plano de Prevenção e Combate a Incêndios Florestais para o Parque Estadual da Serra do Rola-Moça.

- **Objetivos do Projeto**
  - Identificar áreas de risco de incêndio.
  - Definir locais para postos de observação e estações de bombeamento de água.
  - Avaliar a relação entre o parque, áreas urbanizadas e recursos naturais.


- **Metodologia**
  - Utilizar camadas geográficas no QGIS.
  - Analisar os dados (rios, estradas, áreas urbanas, vento, relevo, vegetação).
  - Propor soluções de forma colaborativa.

- **Resultados esperados**
  - Camadas editadas
  - Novas camadas
  - Mapa com o plano de ação
  - Documento Word com respostas às perguntas


## Atividade 1 (10 pontos)

- **Vetorizar regiões próximas ao parque**
  - Editar a camada de pontos comunidades_proximas;
  - Adicionar no mínimo 5 bairros/distritos próximos ao parque Rola Moça;
  - Adicionar no mínimo 1 coluna com o nome dos bairros (usar outros mapas bases de referência, consultar no google);

## Atividade 2 (10 pontos)

- **Vetorizar pontos de captação/bombeamento de água**
  - Editar a camada de pontos pontos_captacao;
  - Adicionar no mínimo 3 pontos de captação bombeamento de água;
  - Adicionar no mínimo 2 colunas com o nome de cada ponto e disponibilidade em L de água (sejam criativos e críticos na escolha do nome e disponibilidade);
  - Condições gerais
    - Os pontos devem estar dentro do limite do parque;
    - A distância entre um ponto e outro deve ser no mínimo 500m; e,
    - O ponto de captação deve ser marcado sobre a hidrografia; e,
    - O ponto de captação deve ser marcado a uma distância máxima de 300 metros de uma via de acesso (camada malha viária); e,
    - O ponto de captação deve estar em hidrografia de ordem superior a 2 (coluna: nustrahler)


## Atividade 3 (10 pontos)

- **Vetorizar torres de observação**
  - Editar a camada de pontos torres_observacao;
  - Adicionar no mínimo 3 torres de observação;
  - Adicionar no mínimo 2 colunas com o nome de cada torre e altura da torre (sejam criativos e críticos na escolha do nome e altura);
  - Condições gerais
    - As torres devem estar dentro do limite do parque;
    - A distância entre uma torre e outra deve ser no mínimo 500m; e,
    - A torre só pode ser colocada em altitudes (elevação) superior a 1200m; e,
    - A torre deve ser marcada a uma distância máxima de 100 metros de uma via de acesso (camada malha viária);


## Atividade 4 (10 pontos)

- **Gerar buffer de visibilidade**
  - Gerar a camada de visibilidade nomeada visibilidade_torres;
  - Condições gerais
    - Para fins didaticos apenas, iremos considerar que a visibilidade de cada torre é de 1km (1000 metros);


## Atividade 5 (10 pontos)


- **Identificar vento predominante para o mês com maior susceptibilidade de incêndio**
    - Considerar agosto o mês com ventos predominantes;


- **Identificar os bairros com maior risco**
    - Considerar o vento predominante, região com vegetação natural e a proximidade dos bairros ao parque;


## Atividade 6 (50 pontos)

### Elaborar mapa (layout final do projeto)

- Criar um **layout de impressão no QGIS** nomeado *Plano de Prevenção de Incêndios*.

- O layout deve conter:
  - **Título do mapa:** *Plano de Prevenção e Combate a Incêndios Florestais – Parque Estadual da Serra do Rola-Moça*  
  - **Camadas do projeto utilizadas:** parque, areas_urbanizadas, malha viária, hidrografia, torres de observação, pontos de captação de água, buffers de visibilidade, direção dos ventos, elevação, hillshade.  
  - **Legenda clara e organizada** (sem atributos desnecessários).  
  - **Elementos cartográficos obrigatórios:**
    - Barra de escala
    - Grid
    - Indicação de norte
    - Fonte dos dados (exemplo: “Fonte: IDE-Sisema”)
    - Autoria do mapa (nomes dos alunos)

- O mapa deve representar visualmente a estratégia final, incluindo:
  - Localização dos **pontos de captação de água**;
  - Localização das **torres de observação**;
  - Identificação dos **bairros em risco**;
  - **Buffers de visibilidade** das torres;
  - **Direção predominante dos ventos**.

---

### Entrega Final
- **Produto esperado:** 1 layout impresso/exportado em PDF ou imagem.  
- **Complemento:** pequeno texto (5–10 linhas) justificando as escolhas feitas (por que posicionaram cada torre, por que definiram aqueles bairros como de risco, etc.).

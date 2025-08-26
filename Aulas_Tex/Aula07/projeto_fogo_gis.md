
# 🔥 O Projeto

## 📘 Introdução
Vocês são uma equipe responsável por elaborar um **Plano de Prevenção e Combate a Incêndios Florestais** para o **Parque Estadual da Serra do Rola-Moça**.

## 🎯 Objetivos do Projeto
- 🔍 Identificar áreas de risco de incêndio
- 🏞️ Definir locais para postos de observação e estações de bombeamento de água
- 🌆 Avaliar a relação entre o parque, áreas urbanizadas e recursos naturais

## 🛠️ Metodologia
- 🗺️ Utilizar camadas geográficas no QGIS
- 📊 Analisar os dados: rios, estradas, áreas urbanas, vento, relevo, vegetação
- 🤝 Propor soluções de forma colaborativa

## ✅ Resultados Esperados
- 📝 Camadas editadas
- ➕ Novas camadas
- 🗺️ Mapa com o plano de ação
- 📄 Documento Word com respostas às perguntas

---

## 🧪 Atividade 1 (10 pontos)
### 🏘️ Vetorizar regiões próximas ao parque
- Editar a camada de pontos `comunidades_proximas`
- Adicionar no mínimo 5 bairros/distritos próximos ao parque Rola Moça
- Adicionar no mínimo 1 coluna com o nome dos bairros (usar mapas de referência, consultar no Google)

## 💧 Atividade 2 (10 pontos)
### 🚰 Vetorizar pontos de captação/bombeamento de água
- Editar a camada de pontos `pontos_captacao`
- Adicionar no mínimo 3 pontos de captação/bombeamento de água
- Adicionar no mínimo 2 colunas: nome e disponibilidade em litros de água

#### 📌 Condições Gerais
- Os pontos devem estar **dentro do limite do parque**
- Distância mínima entre pontos: **2500m**
- Devem estar sobre a **hidrografia**
- Distância máxima de **300m** de uma via de acesso (camada `malha viária`)
- Devem estar em hidrografia de ordem superior a 2 (`nustrahler`)

## 🗼 Atividade 3 (10 pontos)
### 🔭 Vetorizar torres de observação
- Editar a camada de pontos `torres_observacao`
- Adicionar no mínimo 3 torres
- Adicionar no mínimo 2 colunas: nome e altura da torre

#### 📌 Condições Gerais
- Devem estar **dentro do limite do parque**
- Distância mínima entre torres: **1000m**
- Altitude superior a **1200m**
- Distância máxima de **100m** de uma via de acesso

## 🧭 Atividade 4 (10 pontos)
### 📏 Gerar buffer de visibilidade
- Criar a camada `visibilidade_torres`
- Visibilidade de cada torre: **1km (1000 metros)**

## 🌬️ Atividade 5 (10 pontos)
### 🌡️ Identificar vento predominante e bairros de risco
- Considerar **agosto** como mês com ventos predominantes
- Identificar bairros com maior risco considerando vegetação natural (camada `uso_natural_nao_antropico`) e proximidade ao parque (`comunidades_proximas`)

## 🗺️ Atividade 6 (20 pontos)
### 🖼️ Elaborar mapa (layout final do projeto)

Criar um layout de impressão no QGIS nomeado **Plano de Prevenção de Incêndios**.

#### 🧾 O layout deve conter:
- **Título do mapa:** Plano de Prevenção e Combate a Incêndios Florestais – Parque Estadual da Serra do Rola-Moça
- **Camadas utilizadas:** parque, áreas urbanizadas, malha viária, hidrografia, torres de observação, pontos de captação de água, comunidades_proximas, buffers de visibilidade, direção dos ventos, elevação, hillshade
- **Rótulos:** comunidades_proximas, torres de observação, pontos de captação de água, direção dos ventos
- **Legenda clara e organizada**
- **Elementos cartográficos obrigatórios:**
  - 📐 Barra de escala
  - 🧭 Indicação de norte
  - 🗃️ Grid
  - 📝 Fonte dos dados (ex: "Fonte: IDE-Sisema")
  - 👥 Autoria do mapa (nomes dos alunos)
  - 🗓️ Data de elaboração

#### 🧭 O mapa deve representar:
- Localização dos **pontos de captação de água**
- Localização das **torres de observação**
- Identificação dos **bairros em risco**
- **Buffers de visibilidade** das torres
- **Direção predominante dos ventos**
- **Elevação da região**

---

## 🗺️ Atividade 7 (10 pontos)
### 🖼️ Elaborar relatório com justificativas de escolha

#### 🧾 O relatório deve conter:
- Texto (5–10 linhas) justificando as escolhas feitas


## 🧩 Desafio Final (Extra) - (20 pontos)
### 🌐 Publicação Dinâmica no Felt WebGIS

Como etapa complementar e opcional, desafia-se a equipe a transformar o mapa estático em uma **visualização interativa** utilizando a plataforma [FELT](https://felt.com/):

- 🗺️ **Objetivo:** Publicar o plano de prevenção e combate a incêndios em formato dinâmico, acessível via web.
- 🔧 **Como fazer:**
  - Exportar as camadas do QGIS em formato compatível (.geojson, .shp, .kml, etc.)
  - Criar um projeto no FELT e importar as camadas
  - Organizar a visualização com legendas, cores e descrições
  - Compartilhar o link do mapa interativo com a turma/instrutor
- 🏆 **Benefício:** Aprimorar a comunicação dos resultados e explorar o potencial de plataformas WebGIS para projetos reais

---

## 📦 Entrega Final
- **Apresentação:** Apresentação para os colegas os resultados obtidos
- **Produto esperado:** 1 layout em A4 impresso/exportado em PDF ou imagem
- **Complemento:** Texto (5–10 linhas) justificando as escolhas feitas

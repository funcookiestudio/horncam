# HORNCAM FPV · Centro Logístico

Jogo FPV (body cam) em Three.js r128, sem build: abra `index.html` num servidor estático.

## Estrutura

```
index.html          Marcação HTML + ordem de carregamento dos scripts
css/                Estilos, na ordem em que são carregados (a cascata importa)
js/
  core/             Bootstrap, renderer, cena e loop principal
  world/            Mapa, voxels, destruição, vidro, ferro, portas, caixas, lâmpadas
  weapons/          M4A1 e efeitos de tiro
  player/           Jogador, corpo/arma, vida (ECG) e animação de morte
  rendering/        Pós-processamento body cam, lente, iluminação, pré-aquecimento de shaders
  audio/            Opções de som e som do menu
  net/              Multiplayer P2P (PeerJS): rede, avatares, spawn/morte
  ui/               Cena do menu, lobby e controles touch
  debug/            Diagnóstico de desempenho (F4)
```

## Regras importantes

- São scripts clássicos (não módulos): compartilham o escopo global, como no arquivo único original.
  **A ordem das tags `<script>` em `index.html` é a ordem de execução e não pode ser trocada
  sem checar dependências** (um `const`/`let` só existe depois do script que o declara).
- Funções declaradas num script só ficam visíveis para código que roda *depois* dele; chamadas
  feitas dentro de funções/eventos em tempo de jogo não têm esse limite.

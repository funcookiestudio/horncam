# ISLAND OF THE DEAD

Jogo FPV (body cam) em Three.js r128, sem build: abra `index.html` num servidor estático.

## Estrutura

```
index.html          Marcação HTML + ordem de carregamento dos scripts
css/                Estilos, na ordem em que são carregados (a cascata importa)
js/
  core/             Bootstrap, estado do jogo (game-state: menu/intro/play), renderer, cena e loop principal
  world/            Mapa, voxels, destruição, vidro, ferro, portas, caixas, lâmpadas
  weapons/          M4A1 e efeitos de tiro
  player/           Jogador, colisão, corpo/arma, vida (ECG) e animação de morte
  rendering/        Pós-processamento body cam, lente, iluminação, volume de luz (light-volume, lv-shader), pré-aquecimento de shaders
  audio/            Opções de som e som do menu
  net/              Multiplayer P2P (PeerJS): rede, avatares, spawn/morte
  ui/               Cena do menu (menu-scene), fluxo da tela inicial (start-flow), transição menu→jogador (intro-transition), lobby e controles touch (touch-input)
  debug/            Diagnóstico de desempenho (F4)
```

## Regras importantes

- São scripts clássicos (não módulos): compartilham o escopo global, como no arquivo único original.
  **A ordem das tags `<script>` em `index.html` é a ordem de execução e não pode ser trocada
  sem checar dependências** (um `const`/`let` só existe depois do script que o declara).
- Funções declaradas num script só ficam visíveis para código que roda *depois* dele; chamadas
  feitas dentro de funções/eventos em tempo de jogo não têm esse limite.

## Tela inicial x jogo
A tela inicial (sala de monitores, `menuScene`/`menuCam`) é independente da partida (`scene`/`camera`). `GS.mode` (`js/core/game-state.js`) controla `menu` → `intro` → `play`. Ao tocar em INICIAR, `introBegin()` apaga a interface, a câmera do menu mergulha na TV CH 01 com glitch/ruído e, ao fim, `introTick()` entrega o jogo à câmera do jogador (abertura CRT + câmera "acordando" via `wakeCam`). Esc durante a transição cancela e volta ao menu. A transição é só visual/áudio e não altera a qualidade gráfica.

## Iluminação das luminárias (volume de luz)
As 690 luminárias (69 por galpão, registro em `js/world/lamp-registry.js`) emitem luz, mas só as do **galpão onde o jogador está** são calculadas.
- `js/rendering/light-volume.js`: grade 3D (células de 1 m) com a soma da luz, com oclusão por voxel (grade fina de 25 cm montada dos chunks). Calculada em fatias de 5 ms por quadro.
- `js/rendering/lv-shader.js` (carregado **antes** de qualquer material): todo MeshStandard/Phong lê o volume no shader (1 textura 3D RGBA16F; os canais são estável / 2 lâmpadas com defeito / trecho recém-ligado). Não existem mais PointLights de luminária.
- Disjuntor, lâmpada quebrada: recálculo só das luminárias afetadas (delta). Parede/caixa destruída: recálculo completo com debounce.
- Troca de galpão: o volume do galpão da frente é pré-calculado a menos de 16 m e trocado a 10 m (ou dentro), com fade.
- F5 (painel `?perf=1`/F4) liga/desliga a luz do volume para comparar desempenho.

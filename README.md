# ISLAND OF THE DEAD

Jogo FPV (body cam) em Three.js r128, sem build: abra `index.html` num servidor estático.

## Estrutura

```
index.html          Marcação HTML + ordem de carregamento dos scripts
css/                Estilos, na ordem em que são carregados (a cascata importa)
js/
  core/             Bootstrap, estado do jogo (game-state: menu/intro/play), renderer, cena e loop principal
  world/            Mapa, voxels, destruição, vidro, ferro, portas, caixas, lâmpadas, quadros de disjuntores (breaker-panels), apagão (blackout), caixa de fusíveis (fuse-boxes), poste de rua, lua
  weapons/          M4A1 e efeitos de tiro
  player/           Jogador, colisão, corpo/arma, mão do quadro (breaker-hand), vida (ECG), animação de morte e interferência magnética (interference)
  rendering/        Pós-processamento body cam, lente, iluminação, volume de luz (light-volume, lv-shader), pré-aquecimento de shaders
  audio/            Opções de som, som do menu e chat de voz por proximidade (voice-capture: VOIP + banco de trechos de voz)
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

## Eventos de terror (interferência magnética)
Três sistemas ligados entre si; todos disparam sozinhos e também por tecla de teste.
- **Interferência (J, a cada 6–10 min)** — `js/player/interference.js`: sinal da câmera cai, a câmera gira e os outros jogadores viram *vultos* pretos só para quem sofre o efeito (sem jogador por perto, uma cópia aparece). O vulto some quando você o encara, aumenta a estática ao se aproximar, faz passos e "fala" com trechos deformados da voz dos jogadores (`VOICE.mimic`).
- **Apagão (H, anfitrião sorteia a cada 8–14 min)** — `js/world/blackout.js`: lâmpadas piscam em padrões, explodem com faíscas e os disjuntores desligam. Religar 3–4 chaves em até 2 min explode o quadro (40% de dano e desorientação). O surto queima 1–2 fusíveis do galpão; a explosão queima 2–3.
- **Caixa de fusíveis** — `js/world/fuse-boxes.js`: cada quadro tem tampa (G, mão faz o gesto) com 4 fusíveis; cada um alimenta 2 corredores. Fusível queimado = corredores sem luz mesmo com a chave ligada. Fusíveis novos ficam nas mesas dos escritórios (sorteio fixo, ~40% das mesas; o anfitrião devolve um a cada 5 min), carrega-se até 3, e a troca tem animação (puxar, pegar no bolso, encaixar; choque se a chave estiver ligada). Teclas de teste: N queima um fusível, Shift+N restaura.
- **Rede**: o anfitrião decide quem pega cada fusível e retransmite trocas; `init` leva o estado para quem entra depois.

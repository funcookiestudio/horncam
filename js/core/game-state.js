// [HORNCAM] js/core/game-state.js
// ---------- Estado do jogo: tela inicial x transição x partida ----------
// 'menu'  = sala de monitores (menuScene/menuCam), jogo parado
// 'intro' = a câmera do menu mergulha na tela da TV, chiado, e abre na câmera do jogador (ui/intro-transition.js)
// 'play'  = partida (scene/camera); pausar (Esc) volta para 'menu'
const GS={mode:'menu'};

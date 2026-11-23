// Bootstrap: captura erros globais e checa se o three.js carregou.
window.addEventListener('error',function(e){var o=document.getElementById('ov');if(o){o.style.display='flex';o.querySelector('p').textContent='Erro: '+e.message;}});
if(typeof THREE==='undefined'){document.getElementById('ov').querySelector('p').textContent='Não foi possível carregar o three.js. Verifique a conexão e recarregue.';}

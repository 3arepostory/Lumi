# Lumi: mensagens, imagens e voz

O site e o servidor de convites/histórico estão no projeto Vercel `lumi`. O Blob privado já está conectado. A preferência de nome, combinação de cores e modo escuro é local ao navegador. Chaves, mensagens, rascunhos e fila de envio ficam no cofre IndexedDB. Não apague os dados do site se quiser manter acesso às salas.

## Como conversar

1. Abra a URL estável de produção, escolha nome e cores.
2. Crie uma conversa, copie o convite e envie à outra pessoa.
3. A pessoa abre o link no próprio navegador e pede entrada. Quem criou aceita.
4. Comparem o código por um canal já confiável. Cada participante confirma no próprio navegador.
5. Mantenham a conversa aberta. Quando aparecer “Conectado em tempo real”, digitação, confirmações e voz estarão disponíveis pela conexão WebRTC. Mensagens também sincronizam pelo servidor se a conexão direta não estiver disponível.

O botão de clipe abre a galeria/arquivos. A câmera usa a opção nativa `capture=environment`; o dispositivo decide se oferece câmera, galeria ou seletor de arquivos. JPEG, PNG, WebP e GIF: até 3 MB cada; 20 imagens e 40 MB por sala. A imagem tem prévia, legenda opcional, cancelamento, progresso, reenvio e ampliação. O progresso mede a transferência; “Salvando imagem…” aguarda a confirmação do armazenamento. O arquivo é cifrado antes do upload; a chave segue dentro da mensagem MLS.

“Enviando…” indica fila local; “Enviado” exige confirmação do servidor; “Entregue” exige que o outro cliente tenha decifrado e guardado a mensagem; “Lido” exige visibilidade da mensagem na conversa do outro participante. As confirmações vêm do outro cliente e não provam atenção humana. Uma mensagem pode ser entregue pela conexão direta antes da confirmação do histórico. Em caso de falha, “Tentar novamente” reaproveita ID e ciphertext. A fila é retomada ao reabrir a conversa.

## Áudio em redes diferentes: configurar TURN

**Configuração externa ainda necessária para cobertura de redes restritivas.** O projeto usa STUN por padrão. Isso permite conexões diretas em redes compatíveis, mas não garante áudio ou canal de dados em todas as combinações de Wi-Fi, rede móvel e firewall. TURN retransmite a conexão quando o caminho direto falha. O relay TURN precisa de um provedor ou de um servidor apropriado fora das funções HTTP do Vercel; não é necessário instalar Matrix.

Não foi contratado serviço pago, feito upgrade ou inventada credencial. Escolha um serviço TURN de sua confiança ou um coturn administrado por você.

Opção recomendada, para coturn/serviço compatível com credenciais REST HMAC:

1. No painel Vercel, abra `lumi → Settings → Environment Variables`.
2. Crie `LUMI_TURN_URLS` no ambiente Production e, se necessário, Preview. Exemplo: `turn:turn.seudominio.com:3478?transport=udp,turns:turn.seudominio.com:5349?transport=tcp`. Os endereços e portas precisam corresponder ao serviço real, com certificado válido para `turns:`.
3. Crie `LUMI_TURN_SECRET` como variável sensível, com o segredo compartilhado do serviço. No coturn, corresponde ao modo `use-auth-secret`/`static-auth-secret`. Não use prefixo `VITE_` e não coloque o segredo no código ou na conversa.
4. Faça uma nova implantação. O backend autenticado gera username e senha TURN temporários, com validade de uma hora. O segredo compartilhado não sai do servidor. Para sessões de chat que fiquem abertas por mais de uma hora, reabra a conversa antes de iniciar uma chamada que precise de um novo caminho TURN.
5. Teste uma pessoa no Wi-Fi e outra na rede móvel: chamar, aceitar, falar nos dois sentidos, silenciar, reativar e encerrar. O serviço deve liberar suas portas de relay e impedir uso contra destinos internos conforme a configuração do provedor.

Alternativa: `LUMI_ICE_SERVERS` aceita um JSON de `RTCIceServer[]` fornecido pelo provedor, substituindo a configuração acima e o STUN padrão. Exemplo sem credenciais reais:

```json
[{"urls":"stun:stun.seudominio.com:3478"},{"urls":["turns:turn.seudominio.com:443?transport=tcp"],"username":"USUARIO_DO_PROVEDOR","credential":"SENHA_DO_PROVEDOR"}]
```

Credenciais nessa alternativa são entregues somente a participantes autenticados, mas podem ser inspecionadas por eles. Use credenciais limitadas/rotacionadas, com cotas no provedor. Não publique credenciais permanentes de administrador. O projeto verifica associação à sala antes de fornecer qualquer configuração ICE.

## Limites atuais

- Chamadas recebidas exigem o aplicativo e a conversa abertos. Não há push nem recebimento em segundo plano com o navegador fechado. Sistemas móveis podem suspender abas.
- O microfone é solicitado ao iniciar ou aceitar; recusar/cancelar/encerrar libera a captura. A pessoa pode revogar a permissão no navegador. O áudio usa DTLS-SRTP do WebRTC; não é gravado nem enviado ao Blob.
- A conexão direta revela endereços IP entre participantes; STUN/TURN observam metadados de rede. A sinalização armazenada no Vercel é cifrada com chave derivada do exporter MLS.
- O piloto mantém duas pessoas por sala, convite único de 24 horas, sala de 7 dias e até 500 envelopes. Criação: 3 salas por endereço de rede/dia e 10 no total/dia. O contador usa o dia UTC; apenas a saudação segue Brasília.
- A consulta inicial ocorre a cada 2s por até dois minutos; após isso usa 10s para uma conexão pendente. Com WebRTC conectado, o apoio do histórico usa 30s. O conteúdo entre conectados chega pelo canal direto, sem esperar essa consulta. Há botão para atualizar/reconectar.
- Blob e Functions têm cotas. O armazenamento atual serve ao piloto de baixo volume. Expansão para muitos usuários exige banco e distribuição de eventos apropriados. Não houve upgrade automático.
- Ainda não há conta recuperável, backup, múltiplos dispositivos ou auditoria formal. As duas identidades deste modo pertencem aos navegadores; não são contas de um servidor Matrix.

Referências: [conectividade WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity), [sinalização e áudio](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling), [Blob privado](https://vercel.com/docs/vercel-blob/private-storage), [limite de upload das funções](https://vercel.com/docs/vercel-blob/server-upload).

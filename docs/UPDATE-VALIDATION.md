# Lumi — atualização de 17/10/2026

## Entrega

Personalização antes da entrada: nome, cinco combinações de cores, prévia ao vivo e modo escuro. Preferências persistem no navegador e podem ser alteradas nas configurações. O tema alcança fundo, navegação, botões, detalhes e balões. A saudação usa explicitamente `America/Sao_Paulo`, com os limites 05h, 12h e 18h solicitados.

Mensagens aparecem imediatamente na interface. Uma fila local cifrada mantém envios pendentes e permite repetir o mesmo ID e ciphertext. O servidor confirma armazenamento; o outro cliente confirma entrega e leitura. Leitura exige mensagem ao menos 50% visível e documento visível. A criptografia é serializada; requisições de rede não bloqueiam a decifragem de mensagens recebidas.

Foi removida a espera de um segundo entre mensagens e substituído o caminho de entrega baseado exclusivamente em consultas de dez segundos. WebRTC transporta envelopes MLS, digitação e confirmações entre participantes conectados. Vercel Functions e Blob privado mantêm convites, sinalização cifrada, histórico e imagens cifradas. A consulta ao servidor continua como apoio e recuperação; o modo conectado não espera essa consulta para mostrar conteúdo.

Imagens têm galeria/câmera nativa quando oferecida, prévia, legenda, cancelamento, progresso, nova tentativa e ampliação. Arquivos são cifrados antes do upload; as chaves seguem dentro da mensagem MLS. Limites: 3 MB por imagem, 20 imagens e 40 MB por sala.

Chamadas usam captura real pelo navegador e áudio WebRTC/DTLS-SRTP: chamada recebida, aceitar, recusar, cancelar, silenciar/reativar e encerrar. A captura termina também quando a conexão se perde ou a outra pessoa sai. A interface informa os estados reais da negociação; nenhum áudio gravado ou sinalização de demonstração é usado pelo aplicativo.

## Verificações

- TypeScript e compilação de produção aprovados.
- **25 testes automatizados** em sete arquivos: MLS nos dois sentidos, persistência de ratchet, adulteração/replay, vínculo de identidade, limites de horário, persistência de preferências, contraste, cifra de imagens, autorização, convite único concorrente, criação/reenvio idempotentes, reservas de mídia, fila durante falha, recebimento enquanto o próprio envio aguarda confirmação, bloqueio entre abas e liberação segura da chave após envio em andamento.
- GitHub Actions executa instalação, tipos, testes, build e auditoria de dependências de produção.
- Cinco combinações nos modos claro/escuro verificadas no navegador. Menor contraste medido nos botões e balões da prévia: **5,79:1**, acima de 4,5:1. Isso não substitui auditoria assistiva completa.
- Primeiro acesso, edição nas configurações, nome/tema/modo escuro após recarregar e interface móvel sem rolagem horizontal.
- Navegador configurado para `Asia/Tokyo` recebeu a saudação correta de Brasília. Os testes automatizados cobrem 04h59m59s, 05h, 11h59m59s, 12h, 17h59m59s, 18h e meia-noite de Brasília.

## Comunicação integrada

Dois perfis independentes do Chrome, com chaves e armazenamento separados, usaram a prévia protegida do Vercel e o Blob privado real. As identidades foram identificadas como “teste técnico”; não houve contato com pessoas reais.

| Fluxo | Verificação |
|---|---|
| Convite e identidade | Entrada por convite, aceitação e mesmo código MLS nos dois lados |
| Conexão | Dois RTCPeerConnection com canal de dados efetivamente conectado |
| Envio otimista | Mensagem local em 36 ms na última execução (medição de teste, não SLA); a resposta do servidor foi atrasada deliberadamente em cinco segundos somente pelo teste |
| Entrega direta | Outro navegador recebeu e decifrou antes da confirmação do servidor |
| Confirmações | Entregue com conversa escondida; lido somente depois de tornar a mensagem visível |
| Digitação | Indicador entre os dois navegadores e expiração após parar de digitar |
| Reenvio de texto | Falha HTTP induzida; nova tentativa reutilizou ID e ciphertext, sem duplicação |
| Imagens | Prévia, cancelamento, legenda, upload cifrado, falha induzida e repetição dos mesmos bytes cifrados; imagem decodificada e ampliada pelo destinatário |
| Voz | Chamada recebida, recusa, cancelamento, aceitação e áudio nos dois sentidos |
| Prova de áudio | `getStats()` confirmou bytes e pacotes `inbound-rtp` de áudio nos dois navegadores |
| Microfone | Silenciar desabilitou o track real; reativar funcionou; encerrar e saída do outro participante liberaram a captura |
| Retomada | Histórico e imagem acessíveis após recarregar; preferência e confirmação local preservadas |
| Responsividade | Desktop e largura móvel de 390 px, sem transbordamento horizontal |

O teste de áudio utilizou o dispositivo de captura de teste do Chrome como fonte sonora, atravessando a conexão WebRTC e a pilha RTP reais. Isso testa o transporte e os controles, sem alegar uma conversa entre pessoas ou validação de microfones físicos. A versão do aplicativo usa `getUserMedia`, sem fontes sintéticas ou permissões automáticas.

## Configuração e limites de validação

O Blob privado está conectado. **TURN ainda precisa ser configurado para cobertura de redes restritivas**; o padrão atual usa STUN e conexão direta. Nenhum relay pago, upgrade ou credencial externa foi contratado. Veja [configuração de áudio e uso](REALTIME-SETUP.md).

Não foram usados dois aparelhos físicos nem duas redes distintas nesta sessão. O teste final com Wi-Fi de um lado e rede móvel do outro, permissões e microfones físicos deve ser feito após configurar TURN. Chamadas exigem a conversa aberta; não há push nem chamadas com o navegador fechado.

A produção continua pública por convite; prévias continuam protegidas. A rodada integrada utilizou uma prévia isolada porque os testes anteriores consumiram a cota diária de criação de salas do endereço de teste em produção. Os limites de produção foram mantidos.

O modo por link continua limitado a duas pessoas, convite de 24h, sala de 7 dias e 500 envelopes. Não há recuperação, troca de dispositivo, auditoria independente ou teste de carga. Nomes e metadados de acesso permanecem visíveis ao operador; conteúdo, arquivos e sinalização são cifrados. A conexão direta pode revelar IPs entre participantes.

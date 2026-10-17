# Arquitetura e modelo de ameaças

## Atualização: modalidade por link inteiramente no Vercel

Este modo substitui a dependência de um homeserver Matrix na página inicial. O modelo abaixo continua aplicável ao cliente Matrix em `/?modo=matrix`.

Na modalidade por link, as funções Vercel autenticam credenciais de 256 bits e gravam hashes em Blob privado. As mensagens usam MLS RFC 9420 através de `ts-mls` 1.6.4, sem reimplementar a criptografia. A biblioteca é MIT e declara não ter auditoria formal. Este modo também não é auditado.

Chaves e estado MLS são criados e cifrados localmente. A implementação usa pacotes padronizados, welcome com ratchet tree e mensagens privadas; credenciais básicas são UUIDs fixados às chaves de assinatura esperadas. O link fixa a chave de quem criou a sala; a entrada do convidado exige aceitação explícita. Os dois comparam um código derivado pelo exporter MLS por um canal confiável. Não se usa o autenticador permissivo de testes da biblioteca. Não existe alegação de identidade civil validada.

Operador de servidor pode negar entrega, observar metadados e controlar o código servido. Não pode obter o conteúdo a partir apenas dos envelopes sem comprometer as chaves, a implementação ou os dispositivos. Ratchets e mensagens locais são persistidos juntos antes/depois de operações; o ciphertext pendente é reutilizado em reenvios. A sequência e IDs são verificados, o protocolo rejeita replay/adulteração, e writes condicionais por ETag resolvem concorrência no servidor. Ainda são necessários testes extensos de falhas durante escritas locais e mudança de versões.

São somente dois participantes, sem troca de dispositivos, remoção seletiva de membro, atualização periódica de época, backups ou restauração neste modo. Assim, não se anuncia recuperação após comprometimento durante uma conversa longa: MLS oferece mecanismos para isso, mas a integração atual só cria a época de entrada e usa os ratchets de aplicação. Não confundir a escolha do protocolo com garantias ainda não integradas.

O acesso expira em sete dias; o convite em 24h. Encerrar limpa os envelopes do registro ativo e bloqueia acessos. Retenção operacional do provedor e cópias locais permanecem fora dessa garantia. A rota exige origem correta, JSON, bearer token, associação à sala e limites de tamanho. Criação de salas tem limite compartilhado persistente. Logs registram apenas um identificador genérico de erro. O service worker nunca guarda `/api/link` ou blobs de conversas.

Imagens usam AES-256-GCM com chave aleatória e IV por arquivo, com o identificador como dados autenticados. O Blob guarda só bytes cifrados; chave, tipo, tamanho e identificador seguem na mensagem MLS. O endpoint autentica ambos os participantes, revalida expiração/revogação e limita tamanho, número e volume total. Reservas fixam o digest do ciphertext por ID, impedindo substituição por outro conteúdo em uma nova tentativa. Arquivos permanecem no armazenamento após o bloqueio de acesso, sujeitos à limpeza operacional.

A sinalização WebRTC usa AES-GCM com chave de propósito separado derivada pelo exporter MLS e AAD que fixa sala e remetente. Isso protege os fingerprints DTLS do caminho de sinalização. O canal de dados ordenado usa DTLS; voz usa DTLS-SRTP e não é gravada. Época MLS não muda durante essas sessões. Sinais antigos podem ser reapresentados por um operador para causar negação de serviço; o estado da sessão trata reentrada e reinício, sem garantia de disponibilidade contra um operador malicioso. Não há garantia de ocultar endereços IP: a conexão direta pode revelá-los à outra pessoa, e STUN/TURN processam metadados. Credenciais TURN coturn são geradas no backend com validade de uma hora; a alternativa JSON deve usar credenciais limitadas/rotacionadas.

Entregue e lido são confirmações do cliente autenticado da outra pessoa, não prova de atenção humana. Lido exige mensagem ao menos 50% visível e documento visível. Digitação é transitória e expira; não é armazenada no histórico. O microfone só é capturado ao iniciar ou aceitar chamada. Captura e track de envio são liberadas ao recusar, cancelar, encerrar, sair ou perder a conexão. O elemento de áudio permanece silenciado fora da chamada ativa.

Veja o README e o relatório específico `LINK-VALIDATION.md` para o estado desta modalidade.

## Limite do cliente Matrix anterior

Piloto não auditado. O fluxo com duas contas reais, revogação/rotação e recuperação completa de histórico ainda não foi validado. A implementação do protocolo não foi reescrita. Não usar como prova de segurança para comunicação sensível.

## Arquitetura

```text
Navegador A (React + Matrix SDK + Rust/WASM + IndexedDB)
   │ HTTPS / autenticação / envelopes criptografados
Servidor Matrix Synapse ── PostgreSQL + mídia já criptografada
   │ HTTPS / sync retomável
Navegador B (descriptografia local)

Vercel: distribui apenas shell e módulos públicos da aplicação.
GitHub: código, revisão, CI e integração de previews.
```

React/Vite em vez de Next.js reduz o servidor de confiança ao necessário: toda a mensageria já tem um backend estabelecido. O PostgreSQL, autorização, convites, transações, sincronização e persistência pertencem ao servidor Matrix. Não se promete executar Synapse dentro de funções efêmeras do Vercel. `/sync` HTTP retomável do SDK dispensa inventar um barramento WebSocket entre instâncias. A documentação atual do Vercel foi consultada: WebSockets existem em beta com reconexão após limite de função, mas não são necessários aqui. Nenhuma tarefa cron foi habilitada.

## Alternativas criptográficas avaliadas

- Signal `libsignal`: implementação oficial mantida, mas as interfaces e distribuição não são uma integração de navegador pronta para este cliente; suporte externo e licença AGPL precisam de análise. Não usar ports antigos sem manutenção.
- MLS RFC 9420 / `ts-mls`: candidato para grupos com garantias próprias de forward secrecy e PCS; adoção exigiria implementação e testes completos de autenticação, entrega, armazenamento, estados de época e recuperação. A existência de uma biblioteca não garante uma aplicação segura.
- Selecionado: Matrix oficial `matrix-js-sdk` 44.0.0, Rust crypto WASM 18.9.0, Apache-2.0. Olm para dispositivos e compartilhamento de chaves; Megolm para eventos de sala. A escolha reduz o trabalho de protocolo e reutiliza o backend, mas **não satisfaz uma exigência de PCS por mensagem equivalente a Signal/MLS**. Essa diferença precisa ser aceita ou o protocolo substituído antes de uma promessa mais forte.

## Ativos e adversários

Ativos: mensagens, mídia, chaves privadas, credenciais de sessão, relação entre contatos, rascunhos e preferências.

Adversários considerados: operador curioso ou invasor do banco, observador da rede, pessoa externa à sala, participante abusivo, dispositivo revogado, replay/adulteração, pacote comprometido e código malicioso na origem da interface.

| Fronteira | Controle | Limite |
|---|---|---|
| Rede | HTTPS; HTTP aceito apenas em localhost para desenvolvimento | Terminação TLS vê metadados e credenciais de autenticação Matrix |
| Servidor Matrix | SDK cifra eventos; anexos cifrados antes do upload; chaves ficam no cliente | Servidor vê participantes, horários, tamanhos e eventos de estado |
| Autorização | Associação privada controlada no Synapse; convites aceitos explicitamente; histórico `joined` | Precisa de teste negativo com terceira conta |
| Identidade | SAS do SDK, bloqueio global de dispositivos não verificados, alertas de mudanças | UX de cross-signing e desafios UIA ainda incompleta |
| Grupo | Sessões Megolm, rotação diária ou a cada 100 eventos, mudanças tratadas pelo SDK | Sem garantia de apagar chaves ou cópias já entregues; testes reais pendentes |
| Replay | IDs de evento/transação do Matrix, validação de protocolo e deduplicação do cliente | Reconexão real ainda não testada; revisão manual de pendência pode gerar novo envio |
| Anexos | Formato Matrix v2 AES-CTR e hash SHA-256 dentro de evento E2EE | Não transformar esse mecanismo isolado na alegação de E2EE do mensageiro |
| Navegador | CSP, sem terceiros, texto renderizado pelo React, sem HTML injetado | XSS/código malicioso da origem pode acessar chaves e texto |
| Armazenamento local | Rascunhos/preferências/outbox em AES-GCM com chave CryptoKey não extraível | Chave no mesmo perfil; não é proteção contra dispositivo comprometido; store Rust depende das proteções do navegador |
| Sessões | Token no sessionStorage; Web Lock exclusivo por dispositivo; logout remoto e limpeza | Não protege contra script malicioso da origem; fechamento da aba não revoga sessão do servidor |
| Logs | Logger do cliente sem saída; aplicação não registra conteúdo; configuração de servidor redigida | Diagnóstico operacional limitado; nenhuma inspeção de logs de servidor real foi realizada |

Reações usam evento próprio `com.lumi.reaction` para passarem pela criptografia; o evento padrão `m.reaction` não é cifrado pelo SDK atual. Elas só são renderizadas por clientes que conhecem essa extensão. Algumas relações de resposta e redação ainda expõem metadados conforme Matrix.

## Recuperação e dispositivos

Backup atual: exportação portátil do formato padrão Megolm pelo próprio módulo Rust, protegido por senha com 600.000 iterações; não é um protocolo E2EE inventado. O teste cobre o formato criptografado e senha incorreta; restauração de histórico real ainda depende de servidor e chaves reais.

Recuperar a senha da conta não recupera chaves. O backup não contém mídia nem todos os eventos, não restaura identidade/cross-signing automaticamente e não substitui os backups operacionais do servidor. A lista de dispositivos e a verificação usam APIs oficiais. UIA adicional de revogação mostra erro explícito e pede uso de cliente compatível, sem fingir sucesso.

## Agendamento, cápsulas e histórico anterior

Não implementados. Estratégia necessária para envio offline: congelar destinatários e dispositivos, cifrar envelope no dispositivo, persistir só ciphertext no agendador, comparar época/membros/identidades na entrega e interromper se houver mudança. Mudança de chaves exige revisão e nova criptografia por um cliente autorizado, sem redirecionamento silencioso. Cron Hobby não oferece precisão de minuto; escolher mecanismo e orçamento antes da implantação.

Cápsulas sem criptografia temporal específica só ocultam conteúdo na interface; não dão garantia criptográfica de data de abertura. Compartilhar histórico anterior exige seleção explícita, ação autorizada e aviso visível. Esses recursos não são simulados como reais neste piloto.

## Segurança web e operação

CSP permite apenas scripts próprios e WASM; estilos inline são necessários às preferências de cor. `connect-src https:` aceita o servidor informado pela pessoa; numa distribuição para servidor único, reduza à origem exata. Sem iframes, object, fontes externas, prévias remotas de links ou analytics. Sessões não são enviadas ao Vercel. Tokens Matrix só são usados na origem configurada; download autenticado rejeita redirecionamentos.

O servidor deve limitar mensagens, autenticação e convites em estado compartilhado; a configuração fornece limites iniciais do Synapse. Cadastro público e federação estão desativados. Denúncias voluntárias com prévia do conteúdo e consentimento ainda não estão implementadas. Não ativar push com conteúdo sensível.

Uma revisão independente deve avaliar identidade/cross-signing, endurecimento do armazenamento Rust, SQL/logs, autorização, recuperação, dependências, metadados, extensão de reações e UX contra downgrade antes da liberação.

Fontes oficiais: [SDK](https://github.com/matrix-org/matrix-js-sdk), [crypto WASM](https://github.com/matrix-org/matrix-sdk-crypto-wasm), [Signal](https://github.com/signalapp/libsignal), [ts-mls](https://github.com/LukaJCB/ts-mls), [Matrix E2EE](https://spec.matrix.org/latest/client-server-api/#end-to-end-encryption), [WebSockets Vercel](https://vercel.com/docs/functions/websockets), [Cron e limites](https://vercel.com/docs/cron-jobs/usage-and-pricing).

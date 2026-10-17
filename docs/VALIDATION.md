# Relatório de validação

Data da execução: 16 de outubro de 2026, fuso do usuário America/Sao_Paulo.

História: pessoa conecta conta Matrix → SDK inicializa chaves locais → aceita convite para sala E2EE → envia ciphertext ao Synapse → outra conta sincroniza e descriptografa localmente. A validação dessa história completa está **pendente na fronteira com o servidor próprio**, ainda não provisionado.

## Evidência executada

| Verificação | Resultado |
|---|---|
| TypeScript `tsc --noEmit` | Passou, sem erros |
| Vitest | 2 arquivos, 5 testes passaram |
| Compilação Vite | Passou, 276 módulos; aviso de tamanho do chunk do SDK |
| Auditoria das dependências de produção | Nenhuma vulnerabilidade conhecida reportada na execução |
| Interface em Chromium/Chrome desktop 1440×950 | Renderizou; captura inspecionada |
| Viewport móvel 390×844 | Navegação de volta para lista e ausência de overflow horizontal verificadas |
| Rascunho com desfazer | Texto recuperado após cancelar envio local |
| Modo escuro | Alternância e captura verificadas |
| Guarda de HTTPS no login | Endereço remoto HTTP rejeitado antes de autenticação |
| Erros de execução do navegador no fluxo testado | Lista vazia |

Testes de criptografia: anexo foi cifrado e decifrado com a biblioteca oficial; adulteração do ciphertext rejeitada; arquivo padrão de exportação de chaves criado/decifrado pelo módulo Rust e senha errada rejeitada. O teste de formato usa uma lista vazia de chaves: **não comprova recuperação de mensagens reais**.

Testes de domínio: origens inseguras, credenciais em URL e caminhos/query rejeitados; classificação privada não altera registros compartilhados; eventos repetidos são deduplicados mantendo a versão atual.

QA visual usa dados identificados como fictícios. Não houve envio para pessoas reais nem uso de credenciais externas. O navegador e o servidor estático precisaram ser iniciados no mesmo processo de QA por isolamento de rede do ambiente. As capturas foram salvas como entregáveis locais, fora do repositório de código.

## Não executado; obrigatório antes da liberação

- Duas contas reais em navegadores distintos, convite, aceitação, verificação SAS e troca E2EE.
- Inspeção de ciphertext no PostgreSQL e ausência de conteúdo sensível nos logs reais.
- Terceira conta recebendo negação de acesso a eventos, sync e mídia de conversa.
- Queda de rede e reconexão sem duplicar; entrega depois de o destinatário voltar.
- Upload/download de imagem, vídeo, áudio e documento entre contas reais.
- Backup com chaves reais, sessão nova e restauração comprovada do histórico.
- Dispositivo novo, mudança de identidade, revogação, saída/expulsão de membro e rotação.
- Navegação completa com teclado e leitores de tela; contraste AA; navegadores Safari/Firefox/Edge e instalação PWA real.
- Cache offline em instalação real, modo compartilhado e fechamento abrupto durante gravações locais.
- Teste de abuso/carga, políticas de retenção/mídia e auditoria independente.

## Roteiro reprodutível com servidor próprio

1. Siga `infra/README.md` em servidor controlado. Crie contas Alice, Bruno e Clara (contas de teste, sem identidades simuladas como pessoas reais).
2. Abra perfis separados. Alice cria sala privada e convida Bruno. Bruno aceita. Ambos verificam o outro dispositivo por SAS usando um canal confiável; só confirme códigos idênticos.
3. Envie um texto único. Consulte o evento no banco pelo ID e confirme `m.room.encrypted` com ciphertext. Não publique o conteúdo do banco ou tokens em relatórios. Verifique que logs não contêm texto nem chaves.
4. Com Clara, tente consultar sala/eventos/mídia com suas próprias credenciais. Exija negação; compartilhe apenas códigos de resposta no relatório.
5. Desconecte Bruno, envie cinco mensagens e reconecte. Exija os mesmos cinco IDs únicos, na ordem. Repita a interrupção durante envio de Alice e inspecione pendências antes de reenviar manualmente.
6. Compartilhe um arquivo, confirme ciphertext de mídia no armazenamento e compare o hash do arquivo original com o recebido. Adultere uma cópia do ciphertext: o cliente deve rejeitá-la.
7. Exporte chaves, entre em perfil limpo, importe o arquivo com a senha e confirme leitura do histórico disponível. Senha incorreta deve falhar. Teste também backup operacional de banco/mídia em ambiente separado.
8. Adicione/revogue dispositivo, altere identidade e remova membro. Observe alerta/bloqueio e verifique destinatários das sessões subsequentes. Não conclua sem confirmar que o dispositivo revogado não obtém novas chaves.
9. Registre navegadores, versões, IDs de testes e resultados, sem segredos. Anexe revisão independente antes de anunciar segurança para conversas sensíveis.

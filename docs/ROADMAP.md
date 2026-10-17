# Entrega por fases

**Modo principal atual:** conversa por link no Vercel com personalização, fila de mensagens, confirmações, digitação, imagens cifradas e voz WebRTC. Veja [validação da atualização](UPDATE-VALIDATION.md). TURN ainda deve ser configurado para redes restritivas. A tabela abaixo registra o roteiro anterior do cliente Matrix.

O objetivo completo continua aberto. Não há alegação de produto pronto para uso sensível ou de atendimento integral ao briefing.

| Fase | Estado | Critério restante |
|---|---|---|
| 1. Identidade e estrutura | Implementada e testada em prévia local desktop/móvel | Revisão assistiva completa e avaliação de contraste |
| 2. Autenticação e primeira conversa E2EE | Cliente integrado ao SDK oficial | Provisionar servidor e validar duas contas, SAS e entrega real |
| 3. Persistência, sincronização, mídia | Cliente e configuração Synapse/PostgreSQL | Executar servidor, inspecionar banco/logs, testar reconexão e retomada |
| 4. Grupos, dispositivos, recuperação | Salas privadas, lista de dispositivos e arquivo de chaves | UIA completa, cross-signing, recuperação de conta, revogação/rotação e backup integral |
| 5. Organização e diferenciais | Espaços locais, favoritas, temas, lembretes, combinados e momentos | Fios próprios, tarefas versionadas, cápsulas, presença com expiração, encontro e agendamento offline seguro |
| 6. Qualidade e segurança | Tipos, testes, build, auditoria de dependências e QA básico | WCAG 2.2 AA completo, leitores de tela, teste de carga e revisão independente |

## Pendências prioritárias antes de ampliar o catálogo

1. Operar o servidor próprio em domínio HTTPS e criar duas contas de teste controladas pelo proprietário.
2. Completar o roteiro de autorização negativa e E2EE no relatório de validação.
3. Refinar verificação/cross-signing e confiança dos dispositivos. Não remover o bloqueio de dispositivos não verificados para contornar falhas.
4. Completar desafios de reautenticação de revogação, recuperação de conta e restauração de histórico real.
5. Acrescentar contatos, bloqueio e denúncia voluntária com prévia explícita do conteúdo compartilhado com moderação.
6. Persistir histórico local e fila transacional por dispositivo, com proteção adicional do store Rust. Hoje o histórico é ressincronizado do servidor; fila pendente é criptografada localmente e exige revisão manual ao retomar.
7. Implementar exportação integral portátil, download/limpeza seletiva de mídia e backups operacionais restauráveis.

## Decisões de custo e protocolo ainda necessárias

Hospedagem do servidor e backups exigem uma máquina externa. Nenhuma assinatura foi contratada. Vercel Functions não substitui automaticamente um daemon Synapse. Antes de agendamento offline, avaliar o mecanismo durável, granularidade de entrega, custo, comportamento de epochs e mudanças de dispositivos/membros.

Se a exigência de recuperação após comprometimento equivalente a Signal ou MLS for inegociável, reavaliar o protocolo antes de liberar o produto. Não tratar a rotação periódica de Megolm como essa mesma garantia.

Chamadas não estão na interface. Só adicioná-las com STUN/TURN operacionais, sinalização autenticada e avaliação própria de chamadas de grupo/E2EE de mídia. IA continua ausente e desligada.

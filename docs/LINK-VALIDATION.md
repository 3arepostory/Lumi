# Conversa por link no Vercel — validação

**Atualização mais recente:** [personalização, tempo real, imagens e voz](UPDATE-VALIDATION.md). O registro abaixo documenta a primeira versão de texto.

Estado de implementação: cliente MLS + API Vercel + Blob privado integrado. Armazenamento criado em São Paulo e conectado ao projeto; segredos não foram versionados.

Executado localmente:

- TypeScript sem erros e compilação Vite aprovada.
- Nove testes passaram, incluindo os cinco anteriores do modo Matrix.
- Dois participantes com chaves distintas: criação do grupo MLS, entrada via welcome, mesmo código de verificação, mensagens nos dois sentidos e retomada de estado serializado.
- Rejeição de replay, adulteração e chave de criador não fixada.
- API com armazenamento substituído somente em teste: pessoa externa negada, convite inválido negado, resgate único com disputa concorrente, reenvio deduplicado, alteração de ID/ciphertext rejeitada e fechamento com bloqueio posterior.
- Auditoria de dependências de produção sem vulnerabilidades conhecidas reportadas.

## Validação no Vercel real — 17/10/2026

URL pública estável: https://lumi-windonwactive.vercel.app/

No commit `2c4727e407ab0bcd916071d58c1b6e59ddb10fe5`, dois perfis de navegador Chrome separados, com chaves e armazenamento local distintos, completaram o fluxo real. Os nomes utilizados eram identificados como teste técnico; não foram contatadas pessoas reais.

| Verificação | Resultado |
|---|---|
| Criar conversa no backend Vercel/Blob privado | Passou |
| Abrir convite, solicitar entrada e aceitar | Passou |
| Código de verificação MLS nos dois navegadores | Igual, confirmado nos dois |
| Mensagens nos dois sentidos | Passou |
| Resposta de leitura persistida pelo backend | Apenas envelopes; texto de teste ausente |
| Payload de envio capturado | Ciphertext, sem texto da mensagem |
| Terceiro dispositivo consultando sala | HTTP 403 |
| Reutilização do mesmo convite por outra pessoa | HTTP 409 |
| Destinatário offline, posterior retomada | Entrega correta |
| Duas sincronizações após reconectar | Uma ocorrência da mensagem, sem duplicação |
| Recarregar navegador do criador | Chaves, histórico local e confirmação retomados |
| Encerrar conversa e tentar acesso novamente | HTTP 410 |
| Erros de execução de página no fluxo | Nenhum |
| Busca pelo texto de teste nos logs do deployment | Nenhum resultado; isso não substitui auditoria dos logs do provedor |
| GitHub Actions no commit testado | Sucesso |

Os testes automatizados de autorização usam um armazenamento substituto apenas dentro do runner de testes. A validação acima usou o backend e o Blob reais, sem esse substituto. Não foi necessário recuperar ou imprimir a credencial de armazenamento.

Durante a validação foram corrigidos imports ESM do servidor, entrada por mudança de fragmento na mesma aba e uso de metadados consistentes para writes condicionais do Blob. A inspeção da captura móvel identificou um conflito na precedência do CSS do painel contextual; a correção apenas visual está incluída na revisão final.

## Limites restantes

Sem auditoria independente, teste completo de leitores de tela, garantia WCAG integral, teste extensivo de queda durante escrita no IndexedDB, recuperação/backup, vários dispositivos, atualização periódica de época MLS ou teste de carga. Esta modalidade oferece texto entre duas pessoas e não herda automaticamente os recursos do cliente Matrix anterior.

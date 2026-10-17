# Conversa por link no Vercel — validação

Estado de implementação: cliente MLS + API Vercel + Blob privado integrado. Armazenamento criado em São Paulo e conectado ao projeto; segredos não foram versionados.

Executado localmente:

- TypeScript sem erros e compilação Vite aprovada.
- Nove testes passaram, incluindo os cinco anteriores do modo Matrix.
- Dois participantes com chaves distintas: criação do grupo MLS, entrada via welcome, mesmo código de verificação, mensagens nos dois sentidos e retomada de estado serializado.
- Rejeição de replay, adulteração e chave de criador não fixada.
- API com armazenamento substituído somente em teste: pessoa externa negada, convite inválido negado, resgate único com disputa concorrente, reenvio deduplicado, alteração de ID/ciphertext rejeitada e fechamento com bloqueio posterior.
- Auditoria de dependências de produção sem vulnerabilidades conhecidas reportadas.

Pendentes nesta etapa do registro: teste entre dois navegadores contra o Blob real, reconexão e validação da URL pública de produção. O armazenamento de teste não é usado na implantação.

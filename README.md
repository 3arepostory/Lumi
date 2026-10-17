# Lumi ✦

Um lugar tranquilo para conversar. Cliente web React/TypeScript em português brasileiro, preparado para hospedagem estática no Vercel e conectado a um servidor Matrix próprio.

**Estado: piloto funcional de cliente, com backend próprio ainda não provisionado e fluxo real entre duas contas ainda não validado. Não é uma entrega de todas as seis fases, nem produto auditado.** A prévia começa em modo identificado com pessoas fictícias e mensagens locais. Para mensagens reais é necessário conectar contas de um servidor Matrix.

## Executar

Node.js 24 e pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Nenhum segredo é necessário para compilar a interface. `VITE_MATRIX_HOMESERVER` é opcional, público, e pode ser configurado como URL HTTPS padrão; sem ele, a pessoa informa o servidor no login. Não coloque tokens, chaves privadas ou senhas em variáveis `VITE_*`.

Veja [configuração do servidor](infra/README.md), [arquitetura e ameaças](docs/SECURITY.md), [validação](docs/VALIDATION.md) e [etapas restantes](docs/ROADMAP.md).

## O que está implementado

- Interface própria lavanda/creme/rosa/menta, três colunas, adaptação móvel, modo escuro, movimento reduzido, diálogos nativos e rótulos de controles.
- Login real Matrix e cadastro apenas quando o servidor permite um fluxo suportado. Sessão temporária na aba; bloqueio Web Locks impede uso simultâneo da mesma sessão criptográfica em duas abas.
- Criação de salas privadas com E2EE desde o início, convites explícitos e histórico limitado à entrada. Nenhum envio em sala não criptografada.
- SDK oficial Matrix para sincronização autenticada, retomada, armazenamento remoto, chaves locais Rust/WASM e confirmação do servidor. Eventos deduplicados por ID; não existe backend de mensagens em memória no Vercel.
- Texto, resposta, edição identificada, reações Lumi criptografadas, prévia de anexo e criptografia Matrix v2 antes do upload. Downloads autenticados, validação de integridade e gravação de áudio quando o navegador permite.
- Fluxo SAS por emojis/códigos, alerta de alterações, impressão digital própria e bloqueio de envio a dispositivos não verificados. Precisa de validação com dois dispositivos reais.
- Lista de dispositivos e tentativa de revogação com indicação explícita quando a autenticação adicional do servidor não é suportada.
- Exportação/importação do formato padrão de chaves Matrix com senha. Isto não exporta histórico ou anexos completos.
- Organização, favoritas, filtros e temas privados por conversa; rascunhos e caixa de saída criptografados localmente; revisão explícita das pendências após interrupção. Busca apenas no histórico disponível na memória do dispositivo.
- Atraso de envio com desfazer enquanto o aplicativo está aberto; lembretes locais sem avisar participantes. Combinados e momentos enviados como eventos criptografados com vínculo à origem.
- Exclusão local por ocultação e solicitação de redação ao servidor, com limites de cópias explicados.
- Manifesto e cache público do shell PWA, sem cache de tokens, solicitações Matrix ou anexos no service worker.

Recibos de leitura e digitação começam desligados. Não há IA, rastreadores, imagens remotas ou fontes de terceiros. Modo tranquilo e silêncio por conversa controlam avisos de novas mensagens dentro da aplicação. Não há notificações push de sistema.

## GitHub e Vercel

A alteração é proposta na branch `feat/lumi-pilot`; o projeto Vercel `lumi` está vinculado ao repositório. Builds de previews podem ser criados pela integração Git ou pela API. `vercel.json` mantém cabeçalhos de segurança e saída Vite. A implantação usa apenas arquivos de aplicação; não leva dados Matrix, `.env`, armazenamento local ou arquivos gerados de servidor.

CI valida tipos, testes, compilação e dependências de produção. Os ambientes de backend devem ser separados por instalação e domínio; não use contas reais de produção em testes. O preview pode exigir login no Vercel conforme a proteção da equipe. Não desative a proteção para testar.

Nenhum serviço pago foi contratado. Vercel estático usa a cota do plano existente; limites e condições do plano aplicam-se. O servidor próprio, domínio e backups têm custos a contratar separadamente, estimados apenas para planejamento em `infra/README.md`.

## Limites essenciais

Matrix Olm/Megolm é um protocolo estabelecido, mas não tem exatamente as garantias do Signal Double Ratchet ou de MLS. Não há alegação de recuperação por mensagem após comprometimento de sessão Megolm. Metadados, conteúdo em dispositivos desbloqueados e código servido pelo navegador permanecem superfícies de risco.

Cadastro protegido, recuperação de conta, UIA completa, bloqueio/denúncias, backup integral e agendamento offline ainda precisam ser concluídos. Os detalhes restantes estão no roteiro. Nenhum botão anuncia essas capacidades como disponíveis.

## Dependências e licença

Código do Lumi: direitos reservados ao proprietário do repositório até escolha explícita de licença. `matrix-js-sdk`, `matrix-sdk-crypto-wasm` e `matrix-encrypt-attachment`: Apache-2.0. React: MIT. As licenças das dependências permanecem nos respectivos pacotes. O servidor Synapse e suas obrigações de distribuição são separados da interface e devem ser revisados antes de alterações/distribuição do servidor.

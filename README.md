# Lumi ✦

## Modalidade atual: conversa por link no Vercel

A página inicial agora permite criar uma conversa real entre **dois navegadores**, sem configurar Matrix. Quem cria informa um nome, copia um convite de uso único e aceita a entrada da outra pessoa. Ambos devem comparar um código por um canal confiável antes de enviar texto.

Backend em `api/link.ts` com Vercel Functions e armazenamento **Vercel Blob privado**. MLS RFC 9420 no navegador pela biblioteca `ts-mls` 1.6.4 (MIT, sem auditoria formal). O cliente fixa as chaves públicas esperadas, valida os pacotes e o grupo, exige mensagens MLS privadas e conserva estado/ratchets localmente. Nenhuma chave privada MLS vai para o servidor.

Convite de 24h, sala de 7 dias, duas pessoas, até 500 envelopes e mensagens de até 2.000 caracteres. Atualização a cada 10 segundos com a aba visível. A entrada usa credenciais aleatórias e persistência privada; não é login com conta, telefone ou e-mail. Não há recuperação nem múltiplos dispositivos neste modo. Apagar dados do navegador perde as chaves. Anexos e recursos do cliente Matrix não estão anunciados como disponíveis nessa modalidade.

O Blob está conectado ao projeto `lumi`; o servidor usa a credencial de ambiente automaticamente. Não publique `BLOB_READ_WRITE_TOKEN`. Previews e produção usam prefixos separados no armazenamento. A autorização é revalidada a cada operação. Escritas condicionais por ETag evitam que duas pessoas consumam o mesmo convite ou sobrescrevam envelopes concorrentes. Reenvios usam o mesmo ID e ciphertext.

Os segredos do convite ficam no fragmento `#convite=...`, não no caminho/query enviados ao servidor ao abrir a página. No resgate explícito, a credencial é enviada por HTTPS ao servidor. O servidor mantém hashes das credenciais. Nomes, chaves públicas, tamanhos e horários são metadados visíveis ao operador. A comparação do código é necessária contra substituição de identidades. Pessoas ainda podem copiar o conteúdo.

O armazenamento foi habilitado na cota do plano existente; nenhum upgrade foi contratado. No Hobby, os limites incluídos interrompem o uso quando excedidos. A conversa por link é um piloto de baixo volume: leitura de objetos Blob e atualização por polling não substituem um banco/barramento para grande escala. Limite de criação inicial: três salas por endereço de rede e dez no total por dia. Contadores e salas expiradas ainda precisam de limpeza operacional; expiração bloqueia acesso, sem promessa de apagamento físico imediato.

Para compartilhar, utilize a **URL estável de produção**. Previews continuam protegidos pela autenticação do Vercel; a produção usa o próprio controle de convite da aplicação.

O cliente Matrix anterior continua em `/?modo=matrix`. A documentação abaixo e a infraestrutura Synapse referem-se a essa opção anterior, que permanece separada.

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

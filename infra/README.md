# Servidor próprio (não provisionado)

Esta configuração é um ponto de partida para um piloto fechado em uma máquina Linux com Docker Compose, domínio e portas 80/443. Não foi executada neste ambiente, que não possui Docker. Antes de operar, valide a configuração com o próprio Synapse, fixe os digests das três imagens, revise os limites e configure backups externos do volume PostgreSQL e da mídia. Synapse usa sua própria gestão de migrações na inicialização: não altere tabelas manualmente.

1. Aponte o DNS de `matrix.seudominio.com` para sua máquina. O nome passa a fazer parte das identidades e não deve ser mudado depois.
2. Na raiz do projeto, execute `node infra/setup.mjs matrix.seudominio.com`. O script cria segredos aleatórios e não sobrescreve uma instalação existente.
3. Em Linux, ajuste a pasta de dados para o usuário do contêiner: `sudo chown -R 991:991 infra/data` e `sudo chmod 700 infra/data`. Ajuste permissões de ACL se usar outro sistema. Não publique `infra/.env` ou `infra/data`.
4. Execute `docker compose --project-directory infra -f infra/compose.yaml config --quiet`. Depois `docker compose --project-directory infra -f infra/compose.yaml up -d`.
5. Verifique `https://matrix.seudominio.com/_matrix/client/versions`.
6. Crie duas contas reais para teste, com senha pedida interativamente: `docker compose --project-directory infra -f infra/compose.yaml exec synapse register_new_matrix_user -c /data/homeserver.yaml http://localhost:8008`. Repita para a segunda conta. Não coloque senhas na linha de comando.
7. No Lumi, clique **Conectar meu servidor**, informe a URL HTTPS e faça login com cada conta em um navegador/perfil diferente. Use os identificadores completos nos convites.

Cadastro público, federação, presença e prévias de links ficam desabilitados por padrão. O cadastro no cliente só funciona se o administrador habilitar um fluxo compatível; não habilite cadastro irrestrito sem proteção contra abuso. A interface de revogação de dispositivos não implementa todos os desafios UIA do servidor: use um cliente Matrix compatível quando for exigida reautenticação.

TLS é encerrado pelo Caddy. Banco e Synapse não publicam portas na máquina. O proxy bloqueia os endpoints administrativos públicos. Certificados, contas, chaves de assinatura e banco precisam de retenção e recuperação operacional próprias.

Retenção inicial: eventos elegíveis com até 180 dias, conteúdo redigido por 7 dias e salas esquecidas por 30 dias, conforme tarefas de limpeza do Synapse. Isso não elimina cópias de outros participantes nem garante remoção de todos os metadados. Mídia órfã precisa de uma política administrativa adicional; não há limpeza automática de mídia neste piloto. Logs locais são limitados e redigidos, com perda deliberada de detalhes de diagnóstico; nenhum corpo de mensagem deve ser habilitado em logs.

O arquivo de chaves exportado pelo Lumi permite restaurar as chaves recebidas, mas **não substitui backup do banco ou dos anexos**, não recupera a conta e não revoga um dispositivo comprometido.

Nenhuma máquina foi contratada. Estimativa de planejamento, sem cotação: uma VM pequena, armazenamento e backups podem consumir aproximadamente US$ 10–30/mês em piloto, variando bastante por região, tráfego e disponibilidade. Verifique preços do provedor antes de contratar. Um domínio pode ter custo anual. Serviços pagos adicionais exigem autorização.

Referências oficiais: [instalação](https://element-hq.github.io/synapse/latest/setup/installation.html), [Docker](https://github.com/element-hq/synapse/blob/develop/docker/README.md), [configuração](https://element-hq.github.io/synapse/latest/usage/configuration/config_documentation.html).

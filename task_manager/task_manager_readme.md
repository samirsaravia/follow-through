# 📋 Gerenciador de Tarefas - Extensão Chrome

Um sistema completo de gerenciamento de tarefas desenvolvido como extensão para Google Chrome, com funcionalidades avançadas de organização, lembretes e relatórios.

## 🚀 Funcionalidades

### ✨ Gerenciamento de Tarefas
- **Cadastro Completo**: Título, descrição, ID automático e prazo personalizável
- **Prazos Inteligentes**: Opções rápidas (Hoje, Amanhã, 1 Semana, 1 Mês) ou data/hora customizada
- **Status Automático**: As tarefas são automaticamente marcadas como "Atrasada" quando passam do prazo
- **Ordenação**: Lista organizada por prazo de vencimento
- **Filtros**: Visualize todas as tarefas ou filtre por status

### 📊 Controle de Status
- **Em Andamento**: Status padrão para novas tarefas
- **Atrasada**: Marcação automática quando o prazo é ultrapassado
- **Encerrado**: Tarefas concluídas são movidas para o histórico

### 📝 Edição e Manutenção
- **Edição Completa**: Modifique título, descrição, prazo e status
- **Modal Intuitivo**: Interface limpa para edição
- **Exclusão Segura**: Confirmação antes de remover tarefas
- **Conclusão Rápida**: Botão dedicado para finalizar tarefas

### 📚 Histórico
- **Arquivo Completo**: Todas as tarefas concluídas ficam registradas
- **Informações Detalhadas**: Prazo original e data de conclusão
- **Gerenciamento**: Possibilidade de limpar histórico quando necessário

### ⚙️ Configurações Avançadas
- **Notificações por Email**: Configure seu email para receber relatórios
- **Lembretes Personalizáveis**: Defina quando ser alertado antes do prazo (1h, 6h, 24h, 48h)
- **Persistência**: Configurações salvas no navegador

### 📊 Relatórios e Análises
- **Relatório Completo**: Estatísticas detalhadas sobre suas tarefas
- **Exportação**: Download em formato texto ou envio por email
- **Métricas Incluídas**:
  - Total de tarefas ativas
  - Tarefas concluídas
  - Tarefas atrasadas
  - Tarefas em andamento
  - Lista detalhada de todas as tarefas e histórico

### 🔔 Sistema de Notificações
- **Alertas Visuais**: Notificações na interface da extensão
- **Notificações do Sistema**: Lembretes nativos do Chrome
- **Verificação Automática**: Monitoramento contínuo de prazos vencidos

### 💾 Armazenamento
- **Cache do Navegador**: Dados salvos localmente usando Chrome Storage API
- **Backup Automático**: Dados persistem entre sessões
- **Sincronização**: Funciona offline e online

## 🛠️ Arquivos do Projeto

### 📄 Arquivos Principais
- **`manifest.json`**: Configuração da extensão e permissões
- **`index.html`**: Interface principal da aplicação
- **`index.css`**: Estilos responsivos e modernos
- **`index.js`**: Lógica principal do gerenciador de tarefas
- **`background.js`**: Service worker para notificações e alarmes

### 🎨 Recursos Visuais (Necessários)
- **`icon16.png`**: Ícone 16x16 pixels
- **`icon48.png`**: Ícone 48x48 pixels  
- **`icon128.png`**: Ícone 128x128 pixels

## 📥 Instalação

### 1. Preparar os Arquivos
1. Crie uma pasta para a extensão
2. Salve todos os arquivos fornecidos na pasta
3. Adicione os ícones necessários (16x16, 48x48, 128x128 pixels)

### 2. Instalar no Chrome
1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o "Modo do desenvolvedor" no canto superior direito
3. Clique em "Carregar sem compactação"
4. Selecione a pasta com os arquivos da extensão
5. A extensão aparecerá na barra de ferramentas

### 3. Configuração Inicial
1. Clique no ícone da extensão
2. Vá para "Configurações"
3. Configure seu email (opcional) e preferências de lembrete
4. Comece a adicionar suas tarefas!

## 🎯 Como Usar

### Adicionando Tarefas
1. Preencha o título e descrição
2. Escolha um prazo usando os botões rápidos ou data customizada
3. Clique em "Adicionar Tarefa"

### Gerenciando Tarefas
- **Editar**: Clique no botão "✏️ Editar" para modificar qualquer tarefa
- **Concluir**: Use "✅ Concluir" para mover a tarefa para o histórico
- **Excluir**: "🗑️ Excluir" remove permanentemente a tarefa

### Relatórios
1. Clique em "📊 Gerar Relatório"
2. O relatório será baixado como arquivo texto ou enviado por email (se configurado)

## 🔧 Tecnologias Utilizadas

- **HTML5**: Estrutura da interface
- **CSS3**: Estilos responsivos com gradientes e animações
- **JavaScript (ES6+)**: Lógica da aplicação
- **Chrome Extension APIs**: Storage, Alarms, Notifications
- **LocalStorage**: Fallback para armazenamento

## 🎨 Design

- **Interface Moderna**: Design limpo com gradientes e transições suaves
- **Responsivo**: Funciona bem em diferentes tamanhos de tela
- **Intuitivo**: Navegação por abas e modais bem organizados
- **Acessível**: Cores contrastantes e textos legíveis

## 🔒 Privacidade

- **Dados Locais**: Todas as informações ficam no seu navegador
- **Sem Coleta**: Não coletamos ou enviamos dados para servidores externos
- **Email Opcional**: Funcionalidade de email é completamente opcional

## 🐛 Solução de Problemas

### Extensão não carrega
- Verifique se todos os arquivos estão na pasta
- Certifique-se de que os ícones estão presentes
- Recarregue a extensão em `chrome://extensions/`

### Notificações não funcionam
- Verifique as permissões de notificação do Chrome
- Reinicie o navegador após instalar a extensão

### Dados perdidos
- Os dados ficam salvos no cache do navegador
- Não limpe os dados da extensão nas configurações do Chrome

## 🚀 Próximas Funcionalidades

- [ ] Categorias de tarefas
- [ ] Integração com calendários
- [ ] Temas personalizáveis
- [ ] Sincronização entre dispositivos
- [ ] Subtarefas
- [ ] Anexos de arquivos

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se todos os arquivos estão corretos
2. Confirme as permissões da extensão
3. Teste em uma nova instalação

---

**Desenvolvido com ❤️ para aumentar sua produtividade!**
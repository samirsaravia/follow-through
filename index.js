class TaskManager {
    constructor() {
        this.tasks = [];
        this.history = [];
        this.webhookUrl = '';
        this.settings = {
            emailNotifications: false,
            userEmail: '',
            reminderTime: 24
        };
        this.init();
    }

    async init() {
        await this.loadFromStorage();
        this.setupEventListeners();
        this.renderTasks();
        this.renderHistory();
        this.renderCopyright();
        this.checkOverdueTasks();
        this.loadSettings();
        this.transformText();
        

        
        // Verificar tarefas vencidas a cada minuto
        setInterval(() => this.checkOverdueTasks(), 60000);
    }
    async sendBackupToWebhook() {
        if (!this.webhookUrl) {
            this.showNotification('Webhook URL não configurada!', 'error');
            return;
        }
    
        const backupData = {
            event: 'backup',
            generatedAt: new Date().toLocaleString('pt-BR'),
            tasks: this.tasks,
            history: this.history,
            settings: this.settings
        };
    
        try {
            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backupData)
            });
    
            this.showNotification('Backup enviado para o webhook com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao enviar backup:', error);
            this.showNotification('Erro ao enviar backup para o webhook!', 'error');
        }
    }

    // Copiar texto para clipboard
    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.textContent;
            button.textContent = '✓ Copiado!';
            button.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        } catch (err) {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.textContent = '✓ Copiado!';
            setTimeout(() => {
                button.textContent = 'Copiar';
            }, 2000);
        }
    }

    showCompleteModal(taskId) {
        document.getElementById('completeTaskId').value = taskId;
        document.getElementById('completionNotes').value = '';
        document.getElementById('completeModal').style.display = 'block';
    }
    
    handleCompleteSubmit(e) {
        e.preventDefault();
        const taskId = document.getElementById('completeTaskId').value;
        const notes = document.getElementById('completionNotes').value.trim();
    
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;
    
        const task = this.tasks[taskIndex];
        task.status = 'encerrado';
        task.completedAt = new Date();
        task.completionNotes = notes;
    
        this.history.push(task);
        this.tasks.splice(taskIndex, 1);
    
        this.saveToStorage();
        this.renderTasks();
        this.renderHistory();
        this.closeCompleteModal();
        this.showNotification('Tarefa concluída com detalhes!', 'success');
    }
    
    closeCompleteModal() {
        document.getElementById('completeModal').style.display = 'none';
    }

    setupEventListeners() {
        // Navegação
        document.getElementById('showTasks').addEventListener('click', () => this.showSection('tasksSection'));
        document.getElementById('showHistory').addEventListener('click', () => this.showSection('historySection'));
        document.getElementById('showSettings').addEventListener('click', () => this.showSection('settingsSection'));
        document.getElementById('showTools').addEventListener('click', () => this.showSection('toolSection'));
        document.getElementById('showTexto').addEventListener('click', ()=>this.showSubsection('textTransf'));
        document.getElementById('showTest').addEventListener('click', ()=>this.showSubsection('another'));

        // Formulário de tarefas
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        
        // Botões de prazo rápido
        document.querySelectorAll('.deadline-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setQuickDeadline(e));
        });

        // Filtros
        document.getElementById('statusFilter').addEventListener('change', () => this.renderTasks());

        // Modal
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal());
        document.getElementById('editForm').addEventListener('submit', (e) => this.handleEditSubmit(e));

        // Configurações
        document.getElementById('emailNotifications').addEventListener('change', (e) => {
            document.getElementById('emailGroup').style.display = e.target.checked ? 'block' : 'none';
        });
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        // Outros botões
        document.getElementById('generateReport').addEventListener('click', () => this.generateReport());
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());

        // Categoria - botão
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remover classe ativa de todos
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                
                // Adicionar classe ativa ao clicado
                btn.classList.add('active');

                // Definir valor no input oculto
                document.getElementById('taskCategory').value = btn.textContent;
            });
        });


        // Categoria no formulário de edição
        const editCategoryButtons = document.querySelectorAll('#editCategoryButtons .category-btn');
        editCategoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                editCategoryButtons.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.getElementById('editCategory').value = e.currentTarget.textContent;
            });
        });

        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
        //backup botão
        document.getElementById('backupWebhook').addEventListener('click', () => this.sendBackupToWebhook());
        
        //concluir tarefa
        document.getElementById('completeForm').addEventListener('submit', (e) => this.handleCompleteSubmit(e));
        document.getElementById('cancelComplete').addEventListener('click', () => this.closeCompleteModal());
        document.getElementById('closeCompleteModal').addEventListener('click', () => this.closeCompleteModal());
    }

    showSection(sectionId) {
        // Remover classe active de todas as seções
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Ativar seção atual
        document.getElementById(sectionId).classList.add('active');
        
        // Ativar botão correspondente
        if (sectionId === 'tasksSection') document.getElementById('showTasks').classList.add('active');
        if (sectionId === 'historySection') document.getElementById('showHistory').classList.add('active');
        if (sectionId === 'settingsSection') document.getElementById('showSettings').classList.add('active');
        if (sectionId === 'toolSection') document.getElementById('showTools').classList.add('active');
    }

    showSubsection(sectionId){
        // remove classe active de todas as subseções
        document.querySelectorAll('.subsection').forEach(subsection=>{
            subsection.classList.remove('active');
        });
        document.querySelectorAll('.nav-Sbtn').forEach(btn=>{
            btn.classList.remove('active');
        });

        // ativar subseção atual
        document.getElementById(sectionId).classList.add('active');

        // ativar botão correspondente
        if (sectionId === 'textTransf') document.getElementById('showTexto').classList.add("active");
        if (sectionId === 'another') document.getElementById('showTest').classList.add("active");
    }

    transformText(){

        function clearActive () {
            document.querySelectorAll('.btn-transform').forEach(btn=>{
                btn.classList.remove('active');
            })
        }
        

        const textInput = document.getElementById('textInput');
        const uppercaseBtn = document.getElementById('uppercaseBtn');
        const lowercaseBtn =  document.getElementById('lowercaseBtn');
        const capitalizeBtn = document.getElementById('capitalizeBtn');
        const textOutput = document.getElementById('textOutput');
        const copyTextBtn = document.getElementById('copyTextBtn');


        uppercaseBtn.addEventListener('click', ()=>{
            const text = textInput.value;
            textOutput.value = text.toUpperCase();

            clearActive();
            uppercaseBtn.classList.add('active');

        });

        lowercaseBtn.addEventListener('click', ()=>{
            const text = textInput.value;
            textOutput.value = text.toLowerCase();
            clearActive();
            lowercaseBtn.classList.add('active');
        });

        capitalizeBtn.addEventListener('click', ()=>{
            const text = textInput.value;
            textOutput.value = this.capitalizeWords(text);
            clearActive();
            capitalizeBtn.classList.add('active');
        });

        copyTextBtn.addEventListener('click', ()=>{
            this.copyToClipboard(textOutput.value, copyTextBtn)
        });

    }

     // Capitalizar primeira letra de cada palavra
     capitalizeWords(text) {
        return text.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

   
    setQuickDeadline(e) {
        const days = parseInt(e.target.dataset.days);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + days - 1);
        deadline.setHours(23, 59, 0, 0);
        
        document.getElementById('taskDeadline').value = this.formatDateTimeLocal(deadline);
        
        // Visual feedback
        document.querySelectorAll('.deadline-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        
        const task = {
            id: Date.now().toString(),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            deadline: new Date(document.getElementById('taskDeadline').value),
            status: 'andamento',
            category: document.getElementById('taskCategory').value,
            createdAt: new Date()
        };

        this.tasks.push(task);
        this.saveToStorage();
        this.renderTasks();
        e.target.reset();
        
        // Remover classe active dos botões
        document.querySelectorAll('.deadline-btn').forEach(btn => btn.classList.remove('active'));

        this.showNotification('Tarefa adicionada com sucesso!', 'success');
    }

    handleEditSubmit(e) {
        e.preventDefault();
        
        const taskId = document.getElementById('editTaskId').value;
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            const oldStatus = this.tasks[taskIndex].status;
            
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                title: document.getElementById('editTitle').value,
                description: document.getElementById('editDescription').value,
                deadline: new Date(document.getElementById('editDeadline').value),
                status: document.getElementById('editStatus').value,
                category: document.getElementById('editCategory').value
            };

            // Se mudou para encerrado, mover para histórico
            if (document.getElementById('editStatus').value === 'encerrado' && oldStatus !== 'encerrado') {
                this.completeTask(taskId);
            } else {
                this.saveToStorage();
                this.renderTasks();
            }
        }
        
        this.closeModal();
        this.showNotification('Tarefa atualizada com sucesso!', 'success');
    }

    editTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (!task) return;

        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTitle').value = task.title;
        document.getElementById('editDescription').value = task.description;
        document.getElementById('editDeadline').value = this.formatDateTimeLocal(new Date(task.deadline));
        document.getElementById('editStatus').value = task.status;
        const category = task.category || '';
        document.getElementById('editCategory').value = category;
        document.querySelectorAll('#editCategoryButtons .category-btn').forEach(btn => {
            if (btn.textContent === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.getElementById('editModal').style.display = 'block';
    }

    completeTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;

        const task = this.tasks[taskIndex];
        task.status = 'encerrado';
        task.completedAt = new Date();

        // Mover para histórico
        this.history.push(task);
        this.tasks.splice(taskIndex, 1);

        this.saveToStorage();
        this.renderTasks();
        this.renderHistory();
        this.showNotification('Tarefa concluída!', 'success');
    }

    deleteTask(taskId, fromHistory = false) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            if (fromHistory) {
                this.history = this.history.filter(task => task.id !== taskId);
                this.renderHistory();
            } else {
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                this.renderTasks();
            }
            this.saveToStorage();
            this.showNotification('Tarefa excluída!', 'info');
        }
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    checkOverdueTasks() {
        const now = new Date();
        let hasUpdates = false;

        this.tasks.forEach(task => {
            if (new Date(task.deadline) < now && task.status === 'andamento') {
                task.status = 'atrasada';
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            this.saveToStorage();
            this.renderTasks();
        }
    }
    renderTasks() {
        const tbody = document.getElementById('tasksTableBody');
        const filter = document.getElementById('statusFilter').value;
    
        let filteredTasks = this.tasks;
        if (filter !== 'all') {
            filteredTasks = this.tasks.filter(task => task.status === filter);
        }
    
        // Agrupar por categoria
        const groupedByCategory = {};
        filteredTasks.forEach(task => {
            const category = task.category || 'Sem Categoria';
            if (!groupedByCategory[category]) {
                groupedByCategory[category] = [];
            }
            groupedByCategory[category].push(task);
        });
    
        tbody.innerHTML = '';
    
        Object.keys(groupedByCategory).forEach(category => {
            // Cabeçalho da categoria
            const categoryRow = document.createElement('tr');
            categoryRow.innerHTML = `
                <td colspan="6" style="background-color: #eee; font-weight: bold; text-align: center;">
                     ${category.toUpperCase()}
                </td>
            `;
            tbody.appendChild(categoryRow);
    
            // Tarefas da categoria
            groupedByCategory[category]
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                .forEach(task => {
                    const row = document.createElement('tr');
    
                    row.innerHTML = `
                        <td class='t-header'>${task.id}</td>
                        <td>${task.title}</td>
                        <td>${task.description}</td>
                        <td>${this.formatDate(task.deadline)}</td>
                        <td><span class="status ${task.status}">${this.getStatusText(task.status)}</span></td>
                    `;
    
                    const actionsTd = document.createElement('td');
                    actionsTd.classList.add('action-buttons');
    
                    const editButton = document.createElement('button');
                    editButton.className = 'action-btn edit-btn';
                    editButton.textContent = 'Editar';
                    editButton.addEventListener('click', () => this.editTask(task.id));
    
                    const completeButton = document.createElement('button');
                    completeButton.className = 'action-btn complete-btn';
                    completeButton.textContent = 'Concluir';
                    completeButton.addEventListener('click', () => this.showCompleteModal(task.id));
    
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'action-btn delete-btn';
                    deleteButton.textContent = 'Excluir';
                    deleteButton.addEventListener('click', () => this.deleteTask(task.id));
    
                    actionsTd.appendChild(editButton);
                    actionsTd.appendChild(completeButton);
                    actionsTd.appendChild(deleteButton);
    
                    row.appendChild(actionsTd);
                    tbody.appendChild(row);
                });
        });
    }
    
    renderHistory() {
        const tbody = document.getElementById('historyTableBody');
        
        // Ordenar por data de conclusão (mais recente primeiro)
        const sortedHistory = this.history.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        // Agrupar tarefas por mês
        const tasksByMonth = this.groupTasksByMonth(sortedHistory);

        tbody.innerHTML = '';
        
        // Renderizar cada grupo de mês
        Object.keys(tasksByMonth).forEach(monthKey => {
            // Criar linha de cabeçalho do mês
            const monthHeaderRow = document.createElement('tr');
            monthHeaderRow.classList.add('month-header');
            monthHeaderRow.innerHTML = `
                <td colspan="6" style="background-color: #f0f0f0; font-weight: bold; text-align: center; padding: 10px;">
                    ${this.formatMonthHeader(monthKey)}
                </td>
            `;
            tbody.appendChild(monthHeaderRow);

            // Renderizar tarefas do mês
            tasksByMonth[monthKey].forEach(task => {
                const row = document.createElement('tr');

                row.innerHTML = `
                    <td>${task.id}</td>
                    <td>${task.title}</td>
                    <td>${task.description}<br>>>>><<<<<br>Obs:${task.completionNotes || 'Sem detalhes'}</td>
                    <td>${this.formatDate(task.deadline)}</td>
                    <td>${this.formatDate(task.completedAt)}</td>
                `;

                const actionsTd = document.createElement('td');
                actionsTd.classList.add('action-buttons');

                const deleteButton = document.createElement('button');
                deleteButton.className = 'action-btn delete-btn';
                deleteButton.textContent = 'Excluir';
                deleteButton.addEventListener('click', () => this.deleteTask(task.id, true));

                actionsTd.appendChild(deleteButton);
                row.appendChild(actionsTd);
                tbody.appendChild(row);
            });
        });
    }

    // Função auxiliar para agrupar tarefas por mês
    groupTasksByMonth(tasks) {
        const grouped = {};
        
        tasks.forEach(task => {
            const date = new Date(task.completedAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(task);
        });
        
        return grouped;
    }

    // Função auxiliar para formatar o cabeçalho do mês
    formatMonthHeader(monthKey) {
        const [year, month] = monthKey.split('-');
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        return `${monthNames[parseInt(month) - 1]} de ${year}`;
    }

    generateReport() {
        const report = {
            totalTasks: this.tasks.length,
            completedTasks: this.history.length,
            overdueTasks: this.tasks.filter(task => task.status === 'atrasada').length,
            inProgressTasks: this.tasks.filter(task => task.status === 'andamento').length,
            generatedAt: new Date().toLocaleString('pt-BR'),
            tasks: this.tasks,
            history: this.history
        };

        const reportText = this.formatReportForEmail(report);
        
        if (this.settings.emailNotifications && this.settings.userEmail) {
            this.sendEmailReport(reportText);
        } else {
            // Baixar como arquivo
            this.downloadReport(reportText);
        }
    }

    formatReportForEmail(report) {
        return `
RELATÓRIO DE ACOMPANHAMENTOS - ${report.generatedAt}
================================================

RESUMO:
- Total de acompanhamentos ativos: ${report.totalTasks}
- Acompanhamentos concluídos: ${report.completedTasks}
- Acompanhamentos atrasados: ${report.overdueTasks}
- Acompanhamento em andamento: ${report.inProgressTasks}

ACOMPANHAMENTOS ATIVOS:
${report.tasks.map(task => `
-------------------------------------------
- [${task.id}] ${task.title}
  Descrição: ${task.description}
  Prazo: ${this.formatDate(task.deadline)}
  Status: ${this.getStatusText(task.status)}

`).join('')}

HISTÓRICO DE ACOMPANHAMENTOS CONCLUÍDOS:
${report.history.map(task => `
---------------------------------------
- [${task.id}] ${task.title}
  Descrição: ${task.description}
  Observações:${task.completionNotes}
  Prazo Original: ${this.formatDate(task.deadline)}
  Concluído em: ${this.formatDate(task.completedAt)}

`).join('')}

================================================
Relatório gerado automaticamente pelo Gerenciador de Acompanhamentos
        `;
    }

    sendEmailReport(reportText) {
        // Simular envio de email (em uma extensão real, você usaria uma API de email)
        const mailtoLink = `mailto:${this.settings.userEmail}?subject=Relatório de Tarefas - ${new Date().toLocaleDateString('pt-BR')}&body=${encodeURIComponent(reportText)}`;
        
        // Criar link temporário e clicar
        const link = document.createElement('a');
        link.href = mailtoLink;
        link.click();
        
        this.showNotification('Cliente de email aberto para envio do relatório!', 'info');
    }

    downloadReport(reportText) {
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-tarefas-${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Relatório baixado com sucesso!', 'success');
    }

    clearHistory() {
        if (confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
            this.history = [];
            this.saveToStorage();
            this.renderHistory();
            this.showNotification('Histórico limpo!', 'info');
        }
    }

    loadSettings() {
        document.getElementById('emailNotifications').checked = this.settings.emailNotifications;
        document.getElementById('userEmail').value = this.settings.userEmail;
        document.getElementById('reminderTime').value = this.settings.reminderTime;
        
        document.getElementById('emailGroup').style.display = 
            this.settings.emailNotifications ? 'block' : 'none';
    }

    saveSettings() {
        this.settings = {
            emailNotifications: document.getElementById('emailNotifications').checked,
            userEmail: document.getElementById('userEmail').value,
            reminderTime: parseInt(document.getElementById('reminderTime').value)
        };
        
        this.saveToStorage();
        this.showNotification('Configurações salvas!', 'success');
        
        // Configurar lembretes se necessário
        this.setupReminders();
    }

    setupReminders() {
        if (typeof chrome !== 'undefined' && chrome.alarms) {
            // Limpar alarmes existentes
            chrome.alarms.clearAll();
            
            // Configurar novos alarmes para tarefas próximas do vencimento
            this.tasks.forEach(task => {
                if (task.status === 'andamento') {
                    const deadline = new Date(task.deadline);
                    const reminderTime = new Date(deadline.getTime() - (this.settings.reminderTime * 60 * 60 * 1000));
                    
                    if (reminderTime > new Date()) {
                        chrome.alarms.create(`task-${task.id}`, {
                            when: reminderTime.getTime()
                        });
                    }
                }
            });
        }
    }

    async saveToStorage() {
        const serializeTask = (task) => ({
            ...task,
            deadline: task.deadline instanceof Date ? task.deadline.toISOString() : task.deadline,
            createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
            completedAt: task.completedAt instanceof Date ? task.completedAt.toISOString() : task.completedAt
        });
    
        const data = {
            tasks: this.tasks.map(serializeTask),
            history: this.history.map(serializeTask),
            settings: this.settings
        };
    
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set(data);
            } else {
                localStorage.setItem('taskManagerData', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
        }
    }
    async loadFromStorage() {
        try {
            let data;
    
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['tasks', 'history', 'settings']);
                data = result;
            } else {
                const stored = localStorage.getItem('taskManagerData');
                data = stored ? JSON.parse(stored) : {};
            }
    
            const deserializeTask = (task) => ({
                ...task,
                deadline: task.deadline ? new Date(task.deadline) : null,
                createdAt: task.createdAt ? new Date(task.createdAt) : null,
                completedAt: task.completedAt ? new Date(task.completedAt) : null
            });
    
            this.tasks = (data.tasks || []).map(deserializeTask);
            this.history = (data.history || []).map(deserializeTask);
            this.settings = { ...this.settings, ...data.settings };
    
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    formatDate(date) {
        const d = (date instanceof Date) ? date : new Date(date);
        if (isNaN(d.getTime())) return 'Data Inválida';
    
        return d.toLocaleDateString('pt-BR');
    }
   

    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    getStatusText(status) {
        const statusMap = {
            'andamento': 'Andamento',
            'atrasada': 'Atrasada',
            'encerrado': 'Encerrado'
        };
        return statusMap[status] || status;
    }

    showNotification(message, type = 'info') {
        // Criar notificação visual
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Cores baseadas no tipo
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3',
            warning: '#ff9800'
        };
        notification.style.background = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);

        // Usar notificações do navegador se disponível
        if (typeof chrome !== 'undefined' && chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon48.png',
                title: 'Gerenciador',
                message: message
            });
        }
    }
    // Renderizar informações de copyright
    renderCopyright() {
        const currentYear = new Date().getFullYear();
        const copyrightInfo = {
            year: currentYear,
            author: chrome?.runtime?.getManifest?.()?.author||"Samir S.",
            license: "MIT",
            version: chrome?.runtime?.getManifest?.()?.version || "1.0.0",
            repository: "https://github.com/samirsaravia/follow-through",
            contact: "samir.saravia.10@gmail.com",
            description: chrome?.runtime?.getManifest?.()?.description || "Plugin com ferramentas úteis",
            name: chrome?.runtime?.getManifest?.()?.name,
        };

        // Criar elemento de copyright se não existir
        let copyrightElement = document.getElementById('copyright-info');
        if (!copyrightElement) {
            copyrightElement = document.createElement('div');
            copyrightElement.id = 'copyright-info';
            copyrightElement.className = 'copyright-container';
        }

        copyrightElement.innerHTML = `
            <div class="copyright-content">
                <div class="copyright-main">
                    <p class="copyright-text">
                        © ${copyrightInfo.year} ${copyrightInfo.author}. Todos os direitos reservados.
                    </p>
                    <p class="version-info">
                        Versão ${copyrightInfo.version} | Licença ${copyrightInfo.license}
                    </p>
                </div>
                <div class="copyright-links">
                    <button id="show-license" class="copyright-link btn-link">
                        📜 Licença
                    </button>
                </div>
                <div class="copyright-details" id="copyright-details" style="display: none;">
                    <h4>Informações Legais</h4>
                    <div class="legal-info">
                        <p><strong>Plugin:</strong> ${copyrightInfo.name}</p>
                        <p><strong>Desenvolvedor:</strong> ${copyrightInfo.author}</p>
                        <p><strong>Data de Criação:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                        <p><strong>Licença:</strong> ${copyrightInfo.license}</p>
                        <p><strong>Uso Permitido:</strong> Pessoal</p>
                        <p><strong>Distribuição:</strong> Permitida com atribuição</p>
                        <div class="license-text">
                            <h5>Termos de Uso:</h5>
                            <ul>
                                <li>✅ Uso pessoal permitido</li>
                                <li>✅ Modificação e distribuição permitidas</li>
                                <li>✅ Inclusão em projetos privados</li>
                                <li>❌ Remoção de créditos de copyright</li>
                                <li>❌ Uso para atividades ilegais</li>
                                <li>✅ Descrição:${copyrightInfo.description}</li>
                            </ul>
                        </div>
                        <div class="disclaimer">
                            <h5>Aviso Legal:</h5>
                            <p>Este software é fornecido "como está", sem garantias de qualquer tipo. 
                            O desenvolvedor não se responsabiliza por danos diretos ou indiretos 
                            resultantes do uso deste plugin.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Adicionar estilos CSS para copyright
        this.addCopyrightStyles();

        // Inserir no footer ou criar footer se não existir
        const footer = document.querySelector('footer') || this.createFooter();
        
        // Substituir conteúdo do footer existente ou adicionar ao novo
        footer.innerHTML = '';
        footer.appendChild(copyrightElement);

        // Adicionar event listeners
        this.setupCopyrightEventListeners();
    }

    // Criar footer se não existir
    createFooter() {
        const footer = document.createElement('footer');
        footer.className = 'plugin-footer';
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(footer);
        }
        return footer;
    }

    // Adicionar estilos CSS para copyright
    addCopyrightStyles() {
        const styleId = 'copyright-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .copyright-container {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 12px;
                    padding: 16px;
                    margin-top: 16px;
                    border: 1px solid #dee2e6;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .copyright-content {
                    text-align: center;
                }

                .copyright-main {
                    margin-bottom: 12px;
                }

                .copyright-text {
                    font-size: 12px;
                    color: #495057;
                    margin: 0 0 4px 0;
                    font-weight: 500;
                }

                .version-info {
                    font-size: 10px;
                    color: #6c757d;
                    margin: 0;
                    font-style: italic;
                }

                .copyright-links {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-bottom: 12px;
                }

                .copyright-link {
                    font-size: 10px;
                    color: #3373dc;
                    text-decoration: none;
                    padding: 4px 8px;
                    border-radius: 6px;
                    background: rgba(51, 115, 220, 0.1);
                    transition: all 0.2s ease;
                    border: none;
                    cursor: pointer;
                }

                .copyright-link:hover {
                    background: rgba(51, 115, 220, 0.2);
                    transform: translateY(-1px);
                }

                .btn-link {
                    background: rgba(51, 115, 220, 0.1) !important;
                    color: #3373dc !important;
                }

                .copyright-details {
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    margin-top: 12px;
                    border: 1px solid #e9ecef;
                    text-align: left;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .copyright-details h4 {
                    color: #343a40;
                    font-size: 14px;
                    margin: 0 0 12px 0;
                    border-bottom: 2px solid #3373dc;
                    padding-bottom: 4px;
                }

                .legal-info p {
                    font-size: 11px;
                    color: #495057;
                    margin: 4px 0;
                    line-height: 1.4;
                }

                .legal-info strong {
                    color: #343a40;
                }

                .license-text {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    margin: 8px 0;
                }

                .license-text h5 {
                    font-size: 12px;
                    color: #343a40;
                    margin: 0 0 8px 0;
                }

                .license-text ul {
                    margin: 0;
                    padding-left: 16px;
                    font-size: 10px;
                    color: #495057;
                }

                .license-text li {
                    margin: 4px 0;
                    line-height: 1.3;
                }

                .disclaimer {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 6px;
                    padding: 12px;
                    margin-top: 8px;
                }

                .disclaimer h5 {
                    font-size: 12px;
                    color: #856404;
                    margin: 0 0 6px 0;
                }

                .disclaimer p {
                    font-size: 10px;
                    color: #856404;
                    margin: 0;
                    line-height: 1.4;
                }

                @media (max-width: 480px) {
                    .copyright-links {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .copyright-link {
                        width: 100%;
                        text-align: center;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Configurar event listeners para copyright
    setupCopyrightEventListeners() {
        const showLicenseBtn = document.getElementById('show-license');
        const copyrightDetails = document.getElementById('copyright-details');

        if (showLicenseBtn && copyrightDetails) {
            showLicenseBtn.addEventListener('click', () => {
                const isVisible = copyrightDetails.style.display !== 'none';
                copyrightDetails.style.display = isVisible ? 'none' : 'block';
                showLicenseBtn.textContent = isVisible ? '📜 Licença' : '❌ Fechar';
            });
        }

        // Event listener para links externos
        const externalLinks = document.querySelectorAll('.copyright-link[target="_blank"]');
        externalLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Analytics ou tracking aqui se necessário
                console.log('Link externo clicado:', link.href);
            });
        });
    }

    // // Método para obter informações do plugin dinamicamente
    // getPluginInfo() {
    //     return {
    //         name: chrome?.runtime?.getManifest?.()?.name || "Handful",
    //         version: chrome?.runtime?.getManifest?.()?.version || "1.0.0",
    //         author: chrome?.runtime?.getManifest?.()?.author || "Desenvolvedor",
    //         description: chrome?.runtime?.getManifest?.()?.description || "Plugin com ferramentas úteis"
    //     };
    // }

}

// Inicializar o gerenciador de tarefas
const taskManager = new TaskManager();



// CSS para animações das notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

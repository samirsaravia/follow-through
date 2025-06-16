// Service Worker para a extensão do Chrome
// Gerencia alarmes, notificações e tarefas em background

class BackgroundTaskManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listener para alarmes (lembretes de tarefas)
        if (chrome.alarms) {
            chrome.alarms.onAlarm.addListener((alarm) => {
                this.handleTaskReminder(alarm);
            });
        }

        // Listener para quando a extensão é instalada
        chrome.runtime.onInstalled.addListener(() => {
            console.log('Gerenciador instalado com sucesso!');
            this.setupInitialData();
        });

        // Listener para quando a extensão inicia
        chrome.runtime.onStartup.addListener(() => {
            this.checkOverdueTasks();
        });

        // Verificar tarefas vencidas periodicamente
        setInterval(() => {
            this.checkOverdueTasks();
        }, 5 * 60 * 1000); // A cada 5 minutos
    }

    async handleTaskReminder(alarm) {
        if (alarm.name.startsWith('task-')) {
            const taskId = alarm.name.replace('task-', '');
            
            try {
                const data = await chrome.storage.local.get(['tasks', 'settings']);
                const tasks = data.tasks || [];
                const settings = data.settings || {};
                
                const task = tasks.find(t => t.id === taskId);
                
                if (task && task.status === 'andamento') {
                    // Criar notificação
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon48.png',
                        title: '⏰ Lembrete de Tarefa',
                        message: `A tarefa "${task.title}" vence em ${settings.reminderTime || 24} horas!`,
                        buttons: [
                            { title: 'Ver Tarefa' },
                            { title: 'Marcar como Concluída' }
                        ]
                    });
                }
            } catch (error) {
                console.error('Erro ao processar lembrete:', error);
            }
        }
    }

    async checkOverdueTasks() {
        try {
            const data = await chrome.storage.local.get(['tasks']);
            const tasks = data.tasks || [];
            let hasUpdates = false;
            const now = new Date();

            tasks.forEach(task => {
                const deadline = new Date(task.deadline);
                if (deadline < now && task.status === 'andamento') {
                    task.status = 'atrasada';
                    hasUpdates = true;
                    
                    // Notificar sobre tarefa atrasada
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon48.png',
                        title: '🚨 Tarefa Atrasada',
                        message: `A tarefa "${task.title}" está atrasada!`
                    });
                }
            });

            if (hasUpdates) {
                await chrome.storage.local.set({ tasks });
            }
        } catch (error) {
            console.error('Erro ao verificar tarefas vencidas:', error);
        }
    }

    async setupInitialData() {
        try {
            const data = await chrome.storage.local.get(['tasks', 'history', 'settings']);
            
            // Configurar dados iniciais se não existirem
            if (!data.tasks) {
                await chrome.storage.local.set({
                    tasks: [],
                    history: [],
                    settings: {
                        emailNotifications: false,
                        userEmail: '',
                        reminderTime: 24
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao configurar dados iniciais:', error);
        }
    }

    // Método para limpar alarmes antigos e configurar novos
    async updateTaskAlarms() {
        try {
            // Limpar todos os alarmes existentes
            await chrome.alarms.clearAll();
            
            const data = await chrome.storage.local.get(['tasks', 'settings']);
            const tasks = data.tasks || [];
            const settings = data.settings || { reminderTime: 24 };

            // Configurar alarmes para tarefas ativas
            tasks.forEach(task => {
                if (task.status === 'andamento') {
                    const deadline = new Date(task.deadline);
                    const reminderTime = new Date(deadline.getTime() - (settings.reminderTime * 60 * 60 * 1000));
                    
                    if (reminderTime > new Date()) {
                        chrome.alarms.create(`task-${task.id}`, {
                            when: reminderTime.getTime()
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao atualizar alarmes:', error);
        }
    }
}
    q
// Listener para cliques em notificações
if (chrome.notifications) {
    chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
        try {
            if (buttonIndex === 0) {
                // Abrir a extensão
                chrome.action.openPopup();
            } else if (buttonIndex === 1) {
                // Marcar como concluída (isso requereria mais lógica)
                console.log('Funcionalidade de completar tarefa via notificação');
            }
        } catch (error) {
            console.error('Erro ao processar clique na notificação:', error);
        }
    });

    chrome.notifications.onClicked.addListener(() => {
        // Abrir a extensão quando a notificação for clicada
        chrome.action.openPopup();
    });
}

// Listener para mudanças no storage (sincronizar alarmes)
if (chrome.storage) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && (changes.tasks || changes.settings)) {
            backgroundManager.updateTaskAlarms();
        }
    });
}

// Inicializar o gerenciador de background
const backgroundManager = new BackgroundTaskManager();

// Exportar para uso em outros contextos se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundTaskManager;
}
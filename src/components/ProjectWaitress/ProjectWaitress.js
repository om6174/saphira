import { invoke } from '@tauri-apps/api/core';
import eventBus from '../eventBus';

export default {
    data() {
        return {
            clients: [], // List of projects/clients
        };
    },
    mounted() {
        this.loadClients(); // Call the function to fetch and set the clients
        eventBus.$on('makeWaitressServeByName', this.openProjectByName);
        eventBus.$on('makeWaitressServeByIndex', this.openProjectByIndex);

    },
    methods: {
        async loadClients() {
            try {
                const fetchedClients = await invoke('read_project_config');
                this.clients = [...fetchedClients]; // Create a new array to trigger reactivity
            } catch (error) {
                console.error("Failed to load project configuration:", error);
            }
        },
        async openProject(client) {
            try {
                await invoke('open_project', {
                    folderPath: client.folder_path,
                    projectPath: client.project_path,
                });
            } catch (error) {
                console.error("Error while opening project:", error);
            }
        },
        async openProjectByName(name) {
            const client = this.clients.find(c => c.project_name.toLowerCase() === name);
            if (client) {
                await this.openProject(client);
            } else {
                console.error(`Project not found by name: ${name}`);
            }
        },
        async openProjectByIndex(index) {
            const client = this.clients[index - 1];
            if (client) {
                await this.openProject(client);
            } else {
                console.error(`Project not found at index: ${index}`);
            }
        }
    },
};

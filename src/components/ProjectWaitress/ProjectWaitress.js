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
                console.log("Fetching clients...");
                const fetchedClients = await invoke('read_project_config');
                console.log("Fetched clients:", fetchedClients);
                this.clients = [...fetchedClients]; // Create a new array to trigger reactivity
            } catch (error) {
                console.error("Failed to load project configuration:", error);
            }
        },
        async openProject(client) {
            console.log("clients in open", this.clients)
            try {
                const folderMessage = await invoke('open_project', {
                    folderPath: client.folder_path,
                    projectPath: client.project_path,
                });
                console.log(folderMessage);
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
        // async openProjectByNameOrIndex(client) {
        //     // Ensure the clients list is populated
        //     if (!this.clients || this.clients.length === 0) {
        //         console.error("Clients not loaded yet.", this.clients);
        //         return;
        //     }

        //     console.log("Current clients list:", this.clients);

        //     let project = null;

        //     // Search for project by name or index
        //     if (typeof client === 'string') {
        //         // Search by name
        //         project = this.clients.find(c => c.name === client); // Assuming 'name' is a key in the client object
        //     } else if (typeof client === 'number') {
        //         // Search by index
        //         project = this.clients[client];
        //     }

        //     console.log("Project resolved:", project);

        //     if (project) {
        //         try {
        //             this.openProject(project);
        //         } catch (err) {
        //             console.error("Error opening project:", err);
        //         }
        //     } else {
        //         console.error(`Project not found: ${client} (${typeof client})`);
        //     }
        // },
    },
};

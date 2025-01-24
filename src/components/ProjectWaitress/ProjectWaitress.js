import { invoke } from '@tauri-apps/api/core';

export default {
    data() {
        return {
            clients: [],
        };
    },
    async mounted() {
        try {
            // Fetch the project configuration from the backend
            this.clients = await invoke('read_project_config');
        } catch (error) {
            console.error("Failed to load project configuration:", error);
        }
    },
    methods: {
        async openProject(client) {
            try {
                const folderMessage = await invoke('open_project', {
                    folderPath: client.folder_path,
                    projectPath: client.project_path
                });
                console.log(folderMessage);
            } catch (error) {
                console.error("Error:", error);
            }
        }
    }
};

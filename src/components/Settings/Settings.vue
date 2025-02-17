<template>
  <div class="custom-icon" style="top: 20px;" @mouseover="showTooltip('settings')" @mouseleave="hideTooltip">
    <img class="icon-img" src="../../assets/settings.svg" @click="toggleSettings" alt="Settings Icon" />
    <span v-if="tooltip === 'settings'" class="tooltip">Settings</span>
  </div>

  <div v-if="isSettingsOpen" :class="{ 'overlay': true, 'fade-out': isClosing }" @click="toggleSettings">
    <div :class="{ 'custom-modal': true, 'slide-out': isClosing }" @click.stop>
      <h2>App Settings</h2>
      <form>
        <div class="form-group">
          <label for="theme">Theme:</label>
          <select id="theme" v-model="localSettings.theme" @change="saveTheme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div class="form-group">
          <label for="language">Language:</label>
          <select id="language" v-model="localSettings.language" @change="saveLanguage">
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </div>

        <button type="button" @click="closeSettings">Close</button>
        <button type="button" @click="logout">Logout</button>
      </form>
    </div>
  </div>

  <button type="button" @click="toggleClientPaths">Edit Client Paths</button>

  <div v-if="isClientPathsOpen" :class="{ 'overlay': true, 'fade-out': isClosing }" @click="toggleClientPaths">
    <div :class="{ 'custom-modal': true, 'slide-out': isClosing }" @click.stop>
      <h2>Client Paths</h2>
      <table class="client-paths-table">
        <thead>
          <tr>
            <th></th>
            <th>Shortcut</th>
            <th>Project Name</th>
            <th>Folder Path</th>
            <th>Project Path</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(path, index) in clientPaths" :key="index">
            <td><img src="../../assets/delete.svg" @click="deleteClientPath(index)" alt="Delete Icon"
                class="delete-icon" /></td>
            <td> <input type="text" v-model="clientPaths[index].shortcut" @input="debounceSaveClientPaths"  maxlength="2" />
            </td>
            <td> <input type="text" v-model="clientPaths[index].project_name" @input="debounceSaveClientPaths" />
            </td>
            <td><input type="text" :value="path.folder_path" @click="selectFolder(index, 'folder_path')" readonly />
            </td>
            <td><input type="text" :value="path.project_path" @click="selectFolder(index, 'project_path')" readonly />
            </td>

            <td>
              <label class="switch">
                <input type="checkbox" :checked="path.active" @change="toggleClientPath(path, index)">
                <span class="slider"></span>
              </label>
            </td>
          </tr>
          <tr @click="addClientPath" class="add-client-path-row">
            <td colspan="6" class="add-client-path-cell">
              <img src="../../assets/add.svg" alt="Add Icon" class="add-icon" />
            </td>
          </tr>
        </tbody>
      </table>
      <button type="button" @click="closeClientPaths">Close</button>
    </div>
  </div>
</template>

<script>
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import eventBus from '../eventBus';

export default {
  props: {
    settings: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isSettingsOpen: false,
      isClosing: false,
      localSettings: { ...this.settings }, // Initialize with the settings passed from parent
      tooltip: '',
      isClientPathsOpen: false,
      clientPaths: [],
      clientPathTimeouts: {},
      debounceTimeout: null,
    };
  },
  emits: ["update-settings", "update-username"], // Declare the custom events

  methods: {
    toggleSettings() {
      if (this.isSettingsOpen) {
        this.closeSettings();
      } else {
        this.isSettingsOpen = true;
      }
    },
    closeSettings() {
      this.isClosing = true;
      setTimeout(() => {
        this.isSettingsOpen = false;
        this.isClosing = false;
      }, 250); // Match the duration of the fade-out animation
    },
    saveTheme() {
      this.$emit("update-settings", this.localSettings); // Emit updated settings to parent
    },
    saveLanguage() {
      this.$emit("update-settings", this.localSettings); // Emit updated settings to parent
    },
    logout() {
      localStorage.removeItem('username');
      this.$emit('update-username', '');
      this.closeSettings();
    },
    showTooltip(type) {
      this.tooltip = type;
    },
    hideTooltip() {
      this.tooltip = '';
    },
    toggleClientPaths() {
      if (this.isClientPathsOpen) {
        this.closeClientPaths();
      } else {
        this.isClientPathsOpen = true;
      }
    },
    closeClientPaths() {
      this.isClosing = true;
      setTimeout(() => {
        this.isClientPathsOpen = false;
        this.isClosing = false;
      }, 250);
    },
    addClientPath() {
      this.clientPaths.push({ shortcut: 0, folder_path: '', project_path: '', project_name: '', active: false });
      this.saveClientPaths();
    },
    saveClientPaths() {
      console.log(this.clientPaths)
      localStorage.setItem('clientPaths', JSON.stringify(this.clientPaths));
      eventBus.$emit('makeWaitressUpdateClients');

    },
    debounceSaveClientPaths() {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.saveClientPaths();
      }, 300);
    },
    deleteClientPath(index) {
      this.clientPaths.splice(index, 1);
      this.saveClientPaths();
    },
    toggleClientPath(path, index) {
      this.clientPaths[index].active = !path.active;
      this.saveClientPaths();
    },
    updateClientfolder_path(event, index) {
      this.clientPaths[index].folder_path = event.target.value;
      this.debounceSaveClientPaths();
    },
    async loadClientPaths() {
      try {
        const fetchedClients = await invoke('read_project_config');
        this.clientPaths = fetchedClients.map(client => ({
          folder_path: client.folder_path,
          project_path: client.project_path,
          project_name: client.project_name,
          shortcut: client.shortcut,
          active: client.active,
        }));
      } catch (error) {
        console.error("Failed to load client paths:", error);
      }
    },
    async selectFolder(index, type) {
      try {
        const selected = await open({
          directory: true,
          multiple: true,
        });
        if (selected) {
          this.clientPaths[index][type] = selected[0];
          this.debounceSaveClientPaths();
        }
      } catch (error) {
        console.error("Failed to select folder:", error);
      }
    },
  },
  created() {
    const storedClientPaths = localStorage.getItem('clientPaths');
    if (storedClientPaths) {
      this.clientPaths = JSON.parse(storedClientPaths);
      return;
    }
    this.loadClientPaths();
  },
  watch: {
    settings: {
      handler(newSettings) {
        this.localSettings = { ...newSettings }; // Update local settings when parent settings change
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
/* Mimic Reminders.css styles */
.client-paths-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.client-paths-table th,
.client-paths-table td {
  padding: 20px 20px;
  text-align: center;
  border-bottom: 2px solid #ddd;
}

.client-paths-table th {
  background-color: #4CAF50;
  color: white;
}

.client-paths-table tbody tr:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

body.dark .client-paths-table tbody tr:hover {
  background-color: rgba(102, 102, 102, 0.3);
}

.delete-icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-left: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: #4CAF50;
}

input:checked+.slider:before {
  transform: translateX(20px);
}

.add-client-path-row {
  cursor: pointer;
}

.add-client-path-cell {
  padding: 0px !important;
  text-align: center;
}

.add-icon {
  width: 60px;
  height: 60px;
}
</style>
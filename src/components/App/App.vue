<template>
  <div id="app">
    <settings :settings="settings" @update-settings="updateSettings" />

    <h1>Speech Recognition and Synthesis</h1>
    <div class="main-container">
      <!-- Top Row: Speech Recognition and Speech Synthesis -->
      <div class="top-row">
        <speech-recognition />
        <speech-synthesis />
      </div>

      <!-- Bottom Row: Project Waitress -->
      <div class="bottom-row">
        <project-waitress ref="projectWaitress" />
      </div>
    </div>
  </div>
</template>

<script>
import SpeechRecognition from "../SpeechRecog/SpeechRecog.vue";
import SpeechSynthesis from "../SpeechSynth/SpeechSynth.vue";
import ProjectWaitress from "../ProjectWaitress/ProjectWaitress.vue";
import Settings from "../Settings/Settings.vue";
import { invoke } from "@tauri-apps/api/core";
import eventBus from "../eventBus";
import {updateCanvasLineColor} from "../SpeechSynth/SpeechSynth";
export default {
  components: {
    SpeechRecognition,
    SpeechSynthesis,
    ProjectWaitress,
    Settings,
  },
  data() {
    return {
      settings: {
        username: 'omkar',
        theme: 'dark', // or 'dark' depending on user preference
        language: 'en', // default language
      },
    };
  },
  created() {
    this.initializeDb();
    this.loadSettings();
  },
  methods: {
    async updateSettings(newSettings) {
      await invoke('set_user_settings', {
        username: newSettings.username,
        theme: newSettings.theme,
        language: newSettings.language
      }).catch(err => console.error(err));
      this.settings = { ...newSettings };
    },
    async loadSettings() {
      if (this.settings.username === "") {
        // Use default settings when username is empty
        this.settings = {
          username: '',
          theme: 'dark',
          language: 'en',
        };
      } else {
        // Fetch settings from the database
        const settings = await invoke('get_user_settings', { username: this.settings.username }).catch(err => console.error(err));
        localStorage.setItem('userSettings', JSON.stringify(settings));
        this.settings = { ...settings };  // assuming the response is directly a UserSettings object

      }
    },
    async initializeDb() {
      await invoke('initialize_db');
    },
  },
  watch: {
    'settings': {
      handler(newSettings) {
        // This handler will trigger when any part of 'settings' changes
        updateCanvasLineColor(newSettings.theme); // Update the canvas line color
        // Apply theme to the body tag
        document.body.classList.remove('light', 'dark'); // Remove both themes to avoid duplicates
        document.body.classList.add(newSettings.theme); // Add the new theme
      },
      deep: true, // Watch for changes to any nested property inside 'settings'
    },
  },
};
</script>

<style src="./App.css" />

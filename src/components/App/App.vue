<template>
  <div id="app">
    <div v-if="loading" class="overlay">
      <p>Waking up Saphira</p>
    </div>

    <div v-else>
      <settings :settings="settings" @update-settings="updateSettings" @update-username="handleUsernameUpdate" />
      <reminders />
      <pomodoro />
      <!-- Show a loading message or spinner while settings are being fetched -->

      <!-- Onboarding Overlay (visible if username is empty) -->
      <div v-if="isOnboarding" class="overlay">
        <login :username="settings.username" @update-username="handleUsernameUpdate" />
      </div>
      <div v-else>

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
    </div>
  </div>
</template>

<script>
import SpeechRecognition from "../SpeechRecog/SpeechRecog.vue";
import SpeechSynthesis from "../SpeechSynth/SpeechSynth.vue";
import ProjectWaitress from "../ProjectWaitress/ProjectWaitress.vue";
import Settings from "../Settings/Settings.vue";
import Login from "../Login/Login.vue";
import Reminders from "../Reminders/Reminders.vue";
import { invoke } from "@tauri-apps/api/core";
import { updateCanvasLineColor } from "../SpeechSynth/SpeechSynth";
import Pomodoro from "../Pomodoro/Pomodoro.vue";

export default {
  components: {
    SpeechRecognition,
    SpeechSynthesis,
    ProjectWaitress,
    Settings,
    Login,
    Reminders,
    Pomodoro
  },
  data() {
    return {
      settings: {
        username: '',
        theme: '', // or 'dark' depending on user preference
        language: '', // default language
      },
      isOnboarding: false, // controls the onboarding visibility
      localUsername: '', // or 'dark' depending on user 
      loading: true,
    };
  },
  created() {
    document.body.classList.add('dark');
    //this.initializeDb();
    this.loadSettings();
  },
  methods: {
    async setUserName() {
      this.settings.username = this.localUsername;
      this.isOnboarding = false;
      await this.updateSettings(this.settings);
      localStorage.setItem('username', this.localUsername);

    },
    async updateSettings(newSettings) {
      await invoke('set_user_settings', {
        username: newSettings.username,
        theme: newSettings.theme,
        language: newSettings.language
      }).catch(err => console.error(err));

      this.settings = newSettings;
    },
    async loadSettings() {
      const savedUsername = localStorage.getItem('username');
      if (!savedUsername) {
        // Use default settings when username is empty
        this.isOnboarding = true;


      } else {
        // Fetch settings from the database
        const settings = await invoke('get_user_settings', { username: this.settings.username }).catch(err => console.error(err));
        localStorage.setItem('userSettings', JSON.stringify(settings));
        this.settings = { ...settings };  // assuming the response is directly a UserSettings object
      }
      setTimeout(() => this.loading = false, 1000);

    },
    async initializeDb() {
      await invoke('initialize_db');
    },
    async handleUsernameUpdate(newUsername) {
      this.settings.username = newUsername;
      this.isOnboarding = !newUsername;
      await this.updateSettings(this.settings);
    },
  },
  watch: {
    'settings': {
      handler(newSettings, oldSettings) {
        if (oldSettings.theme !== newSettings.theme) {
          console.log('settings changed:', newSettings.username, oldSettings.username);
          // This handler will trigger when any part of 'settings' changes
          updateCanvasLineColor(newSettings.theme); // Update the canvas line color
          // Apply theme to the body tag
          document.body.classList.remove('light', 'dark'); // Remove both themes to avoid duplicates
          document.body.classList.add(newSettings.theme); // Add the new theme
        }

      },
      deep: true, // Watch for changes to any nested property inside 'settings'
    },
  },
};
</script>

<style src="./App.css" />

<template>
  <div class="settings-icon">
    <img src="../../assets/settings.svg" @click="toggleSettings" alt="Settings Icon" />
  </div>

  <div v-if="isSettingsOpen" class="overlay" @click="toggleSettings">
    <div class="settings-modal" @click.stop>
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

        <button type="button" @click="saveSettings">Save</button>
      </form>
    </div>
  </div>
</template>

<script>
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
      localSettings: { ...this.settings }, // Initialize with the settings passed from parent
    };
  },
  emits: ["update-settings"], // Declare the custom event

  methods: {
    toggleSettings() {
      this.isSettingsOpen = !this.isSettingsOpen;
    },
    saveSettings() {
      if (JSON.stringify(this.localSettings) !== JSON.stringify(this.settings)) {
      this.$emit("update-settings", this.localSettings); // Emit updated settings to parent
      }else{
        console.log("No changes made to settings");
      }
      this.isSettingsOpen = false;
    },
    saveTheme(){
      this.$emit("update-settings", this.localSettings); // Emit updated settings to parent
    },
    saveLanguage(){
      this.$emit("update-settings", this.localSettings); // Emit updated settings to parent
    }
  },
};
</script>




<style scoped src="./Settings.css"></style>
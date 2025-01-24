<template>
  <div class="section">
    <h2>Speech Recognition</h2>
    <button
      class="action-button record-button"
      :class="{ recording: isRecording }"
      @click="startListening"
    >
      {{ isRecording ? 'Stop Listening' : 'Start Listening' }}
    </button>
    <div id="speechResult">
      <p v-if="speechText">{{ speechText }}</p>
      <p v-else>No speech detected yet.</p>
    </div>
  </div>
</template>

<script>
import { startSpeechRecognition } from './SpeechRecog';

export default {
  data() {
    return {
      speechText: '',
      recognition: null, // Store the recognition instance
      isRecording: false, // Track if recording is in progress
    };
  },
  mounted(){
    const projectWaitressRef = this.$refs.projectWaitress; // Get the ref of ProjectWaitress

  },
  methods: {
    startListening() {
      if (this.isRecording) {
        // Stop the recognition but do not change the state yet
        this.recognition.stop();
      } else {
        // Start a new recognition instance and update the state
        this.recognition = startSpeechRecognition(this.updateSpeechResult, this.$refs.projectWaitress);

        // Set up onend event to change the state when recognition ends
        this.recognition.onend = () => {
          this.isRecording = false; // Update state when recognition ends
        };

        this.isRecording = true; // Update recording state immediately when starting
      }
    },
    updateSpeechResult(transcript) {
      this.speechText = transcript;
    },
  },
  beforeDestroy() {
    // Cleanup recognition if the component is destroyed to avoid memory leaks
    if (this.recognition) {
      this.recognition.stop();
    }
  },
};
</script>

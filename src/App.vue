<template>
  <div id="app">
    <h1>Speech Recognition and Synthesis</h1>
    <div class="main-container">
      <!-- Top Row: Speech Recognition and Speech Synthesis -->
      <div class="top-row">
        <speech-recognition />
        <speech-synthesis />
      </div>

      <!-- Bottom Row: Project Waitress -->
      <div class="bottom-row">
        <project-waitress ref="projectWaitress"/>
      </div>
    </div>
  </div>
</template>


<script>
import SpeechRecognition from "./components/SpeechRecog/SpeechRecog.vue";
import SpeechSynthesis from "./components/SpeechSynth/SpeechSynth.vue";
import ProjectWaitress from "./components/ProjectWaitress/ProjectWaitress.vue";
import './styles/main.css'; // Import your global styles

export default {
  components: {
    SpeechRecognition,
    SpeechSynthesis,
    ProjectWaitress,
  },
};
</script>

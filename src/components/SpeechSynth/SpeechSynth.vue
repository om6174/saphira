<template>
    <div class="section">
      <h2>Speech Synthesis</h2>
      <button class="action-button" @click="speakWithDefaultVoice(DIALOGUES.INTRO_DIALOGUE)">Introduce yourself</button>
      <canvas id="waveform"></canvas>

    </div>
</template>

<style scoped src="./SpeechSynth.css" />

<script>

import DIALOGUES from '../../services/dialogues.js';
import { speakWithDefaultVoice, initializeAudioElements } from './SpeechSynth.js';

export default {
  data() {
    return {
      DIALOGUES, // Make DIALOGUES available in the template
    };
  },
  methods:{
    speakWithDefaultVoice
  },
  created() {
    initializeAudioElements();
    speakWithDefaultVoice(DIALOGUES.WELCOME_DIALOGUE + DIALOGUES.HELP_DIALOGUE, true);

  },
};
</script>
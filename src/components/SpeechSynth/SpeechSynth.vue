<template>
    <div class="section">
      <h2>Speech Synthesis</h2>
      <button class="action-button" @click="speakWithDefaultVoice(DIALOGUES.INTRO_DIALOGUE)">Introduce yourself</button>
      <canvas id="waveform"></canvas>

    </div>
</template>

<script>

import DIALOGUES from '../../services/dialogues.js';
import { speakWithDefaultVoice } from './SpeechSynth.js';

export default {
  data() {
    return {
      DIALOGUES, // Make DIALOGUES available in the template
    };
  },
  methods:{
    speakWithDefaultVoice
  },
  mounted() {
    speakWithDefaultVoice(DIALOGUES.WELCOME_DIALOGUE + DIALOGUES.HELP_DIALOGUE);
  },
};
</script>
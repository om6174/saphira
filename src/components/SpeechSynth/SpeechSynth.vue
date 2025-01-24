<template>
    <div class="section">
      <h2>Speech Synthesis</h2>
      <button class="action-button" @click="speakIntroDialogue">Introduce yourself</button>
      <canvas id="waveform"></canvas>

    </div>
</template>

<script>

import DIALOGUES from '../../services/dialogues.js';
import { speakWithDefaultVoice } from './SpeechSynth.js';

export default {
  mounted() {
    this.speakWelcomeAndHelp();
  },
  methods: {
    speakWelcomeAndHelp() {
      speakWithDefaultVoice(DIALOGUES.WELCOME_DIALOGUE + DIALOGUES.HELP_DIALOGUE);
    },
    speakIntroDialogue() {
      speakWithDefaultVoice(DIALOGUES.INTRO_DIALOGUE);
    },
  },
};
</script>
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

<style scoped src="./SpeechRecog.css" />

<script src="./SpeechRecog.js"></script>

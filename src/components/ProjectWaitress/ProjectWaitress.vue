<template>
  <div class="section">
    <h2>Select Project to Open</h2>
    <div v-if="clients.length === 0" class="no-projects">
      Configured Projects will appear here
    </div>
    <div v-else class="project-cards-container">
      <div 
        class="project-card" 
        v-for="(client, index) in clients" 
        :key="client.project_name" 
        @click="openProject(client)"
      >
        <p>{{ client.shortcut }}</p>
        <h3>{{ client.project_name }}</h3>
      </div>
    </div>
  </div>
</template>

<script src="./ProjectWaitress.js"></script>

<style scoped src="./ProjectWaitress.css" />


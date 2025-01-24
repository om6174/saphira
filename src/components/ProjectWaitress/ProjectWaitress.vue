<template>
  <div class="section">
    <h2>Select Project to Open</h2>
    <button 
      class="action-button" 
      v-for="client in clients" 
      :key="client.project_name" 
      @click="openProject(client)"
    >
      Open {{ client.project_name }}
    </button>
  </div>
</template>

<script src="./ProjectWaitress.js"></script>

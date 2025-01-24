<template>
  <div class="section">
    <h2>Select Project to Open</h2>
    <div class="project-cards-container">
      <div 
        class="project-card" 
        v-for="client in clients" 
        :key="client.project_name" 
        @click="openProject(client)"
      >
        <h3>{{ client.project_name }}</h3>
      </div>
    </div>
  </div>
</template>

<script src="./ProjectWaitress.js"></script>

<style scoped>
.project-cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.project-card {
  border: 1px solid #ccc;
  padding: 16px;
  margin: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 150px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  opacity: 0.8;
  background: linear-gradient(to bottom right, rgba(184, 18, 51, 0.7), rgba(122, 4, 4, 0.5));
}

.project-card:hover {
  background: linear-gradient(to bottom left, rgba(122, 4, 4, 0.5), rgba(184, 18, 51, 0.7)); /* Reversed gradient */
}
</style>

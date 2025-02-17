<template>
    <div class="overlay">
        <div class="custom-modal">
            <h2>Welcome!</h2>
            <p>What should I call you?</p>
            <input v-model="localUsername" type="text" placeholder="Enter your name" />
            <button @click="setUserName">Submit</button>
        </div>
    </div>
</template>

<script>
import Login from "./Login.js";

export default Login;
</script>
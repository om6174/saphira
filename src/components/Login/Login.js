export default {
  props: ['username'],
  data() {
    return {
      localUsername: this.username,
    };
  },
  methods: {
    async setUserName() {
      this.$emit('update-username', this.localUsername);
      localStorage.setItem('username', this.localUsername);
    },
  },
};

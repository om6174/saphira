export default {
    props: {
        settings: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            isSettingsOpen: false,
        };
    },
    methods: {
        toggleSettings() {
            this.isSettingsOpen = !this.isSettingsOpen;
        },
        saveSettings() {
            this.$emit('updateSettings', this.settings);
        },
    },
};
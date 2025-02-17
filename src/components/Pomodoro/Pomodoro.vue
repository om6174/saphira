<template>
    <div class="custom-icon" style="top: 120px;" @mouseover="showTooltip('pomodoro')" @mouseleave="hideTooltip">
        <img class="icon-img" src="../../assets/tomato.svg" @click="togglePomodoro" alt="Pomodoro Icon" />
        <span v-if="tooltip === 'pomodoro'" class="tooltip">Pomodoro</span>
    </div>

    <div v-if="isPomodoroOpen" :class="{ 'overlay': true, 'fade-out': isClosing }" @click="togglePomodoro">
        <div :class="{ 'custom-modal': true, 'slide-out': isClosing }" @click.stop>
            <h2>Pomodoro Settings</h2>
            <form>
                <div class="form-group">
                    <label for="workTimer">Work Timer:</label>
                    <input id="workTimer" v-model="localPomodoro.workTimer" maxlength="5" />
                </div>

                <div class="form-group">
                    <label for="restTimer">Rest Timer:</label>
                    <input id="restTimer" v-model="localPomodoro.restTimer" maxlength="5" />
                </div>

                <div class="form-group">
                    <label for="repeatTill">Repeat Till:</label>
                    <input id="repeatTill" v-model="localPomodoro.repeatTill" maxlength="8" placeholder="HH:MM AM/PM" />
                </div>

                <div class="form-group">
                    <button type="button" @click="togglePomodoroActive">{{ localPomodoro.active ? 'Deactivate' :
                        'Activate' }}</button>
                    <button type="button" @click="savePomodoro">Save</button>
                    <button type="button" @click="closePomodoro">Close</button>
                </div>


            </form>
        </div>
    </div>
</template>

<script>
import { speakWithDefaultVoice } from '../SpeechSynth/SpeechSynth.js';

export default {
    data() {
        return {
            isPomodoroOpen: false,
            isClosing: false,
            localPomodoro: {...JSON.parse(localStorage.getItem('pomodoro')), "active": false} || {
                workTimer: '',
                restTimer: '',
                repeatTill: '',
                active: false,
            },
            workTimeout: null,
            restTimeout: null,
            repeatTillTimeout: null,
            tooltip: '',
        };
    },
    methods: {
        togglePomodoro() {
            if (this.isPomodoroOpen) {
                this.closePomodoro();
            } else {
                this.isPomodoroOpen = true;
            }
        },
        closePomodoro() {
            this.isClosing = true;
            setTimeout(() => {
                this.isPomodoroOpen = false;
                this.isClosing = false;
            }, 250); // Match the duration of the fade-out animation
        },
        savePomodoro() {
            localStorage.setItem('pomodoro', JSON.stringify(this.localPomodoro));
        },
        togglePomodoroActive() {
            this.localPomodoro.active = !this.localPomodoro.active;
            if (this.localPomodoro.active) {
                localStorage.setItem('pomodoro', JSON.stringify(this.localPomodoro));
                this.startWorkTimer();
                this.setRepeatTillTimeout();
                speakWithDefaultVoice("Happy working", false);
            } else {
                clearTimeout(this.workTimeout);
                clearTimeout(this.restTimeout);
                clearTimeout(this.repeatTillTimeout);
                speakWithDefaultVoice("Pomodoro deactivated", false);
            }
        },
        startWorkTimer() {
            const workTimeInMs = this.parseTime(this.localPomodoro.workTimer);
            this.workTimeout = setTimeout(() => {
                speakWithDefaultVoice("Time to take a break.", false);
                this.startRestTimer();
            }, workTimeInMs);
        },
        startRestTimer() {
            const restTimeInMs = this.parseTime(this.localPomodoro.restTimer);
            this.restTimeout = setTimeout(() => {
                speakWithDefaultVoice("Let's get back to work!!", false);
                this.startWorkTimer();
            }, restTimeInMs);
        },
        parseTime(time) {
            const timeValue = parseInt(time.slice(0, -1), 10);
            const timeUnit = time.slice(-1);
            switch (timeUnit) {
                case 's':
                    return timeValue * 1000;
                case 'm':
                    return timeValue * 60 * 1000;
                case 'h':
                    return timeValue * 60 * 60 * 1000;
                default:
                    return 0;
            }
        },
        setRepeatTillTimeout() {
            const now = new Date();
            const [time, period] = this.localPomodoro.repeatTill.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            const targetHours = period.toLowerCase() === 'pm' && hours !== 12 ? hours + 12 : hours;
            const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHours, minutes);
            console.log(targetTime, "time")
            if (targetTime > now) {
                console.log("inside");
                const timeUntilRepeatTill = targetTime - now;
                console.log(timeUntilRepeatTill, "time until repeat till");
                console.log(targetTime, "targetTime");
                console.log(now, "now");
                this.repeatTillTimeout = setTimeout(() => {
                    console.log("inside timeout");
                    if (this.localPomodoro.active) {
                        console.log("inside timeout active");
                        this.localPomodoro.active = false;
                        clearTimeout(this.workTimeout);
                        clearTimeout(this.restTimeout);
                        this.savePomodoro();
                        speakWithDefaultVoice("Your work session is now complete!!! Hurrrrray!!!", false);
                    }
                }, timeUntilRepeatTill);
            }
        },
        showTooltip(type) {
            this.tooltip = type;
        },
        hideTooltip() {
            this.tooltip = '';
        },
    },
};
</script>

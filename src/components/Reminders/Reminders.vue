<template>
    <div class="custom-icon" style="top: 70px;" @mouseover="showTooltip('reminders')" @mouseleave="hideTooltip">
        <img class="icon-img" src="../../assets/clock.svg" @click="toggleReminders" alt="Reminders Icon" />
        <span v-if="tooltip === 'reminders'" class="tooltip">Reminders</span>
    </div>

    <div v-if="isRemindersOpen" :class="{ 'overlay': true, 'fade-out': isClosing }" @click="toggleReminders">
        <div :class="{ 'custom-modal': true, 'slide-out': isClosing }" @click.stop>
            <h2>Reminders</h2>
            <table class="reminders-table">
                <thead>
                    <tr>
                        <th></th>

                        <th>Name</th>
                        <th>Time</th>
                        <th>Repeat</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(reminder, index) in reminders" :key="index">
                        <td><img src="../../assets/delete.svg" @click="deleteReminder(index)" alt="Delete Icon"
                                class="delete-icon" />
                        </td>
                        <td><input v-model="reminder.name" @input="debounceSaveReminders" /></td>
                        <td>
                            <select v-model="reminder.hour" @change="debounceSaveReminders"
                                @wheel="scrollChange($event, 'hour', reminder)">
                                <option v-for="hour in 12" :key="hour" :value="hour">{{ hour }}</option>
                            </select>
                            :
                            <select v-model="reminder.minute" @change="debounceSaveReminders"
                                @wheel="scrollChange($event, 'minute', reminder)">
                                <option v-for="minute in 60" :key="minute" :value="minute">{{ minute < 10 ? '0' + minute
                                    : minute }}</option>
                            </select>
                            <select v-model="reminder.period" @change="debounceSaveReminders"
                                @wheel="scrollChange($event, 'period', reminder)">
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </td>
                        <td>
                            <select v-model="reminder.shouldRepeat" @change="updateRepeat(index, $event)">
                                <option :value="true">Repeats</option>
                                <option :value="false">One-time</option>
                            </select>
                        </td>
                        <td>
                            <label class="switch">
                                <input type="checkbox" :checked="reminder.active"
                                    @change="toggleReminder(reminder, index)">
                                <span class="slider"></span>
                            </label>
                        </td>
                    </tr>
                    <tr @click="addReminder" class="add-reminder-row">
                        <td colspan="5" class="add-reminder-cell">
                            <img src="../../assets/add.svg" alt="Add Icon" class="add-icon" />
                        </td>
                    </tr>
                </tbody>
            </table>
            <button type="button" @click="closeReminders">Close</button>
        </div>
    </div>

    <div class="custom-icon" style="top: 180px;" @mouseover="showTooltip('alarms')" @mouseleave="hideTooltip">
        <img class="icon-img" src="../../assets/alarm.svg" @click="toggleAlarms" alt="Alarms Icon" />
        <span v-if="tooltip === 'alarms'" class="tooltip">Alarms</span>
    </div>

    <div v-if="isAlarmsOpen" :class="{ 'overlay': true, 'fade-out': isClosing }" @click="toggleAlarms">
        <div :class="{ 'custom-modal': true, 'slide-out': isClosing }" @click.stop>
            <h2>Alarms</h2>
            <table class="alarms-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Time</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(alarm, index) in alarms" :key="index">
                        <td><img src="../../assets/delete.svg" @click="deleteAlarm(index)" alt="Delete Icon"
                                class="delete-icon" /></td>
                        <td><input v-model="alarm.name" @input="debounceSaveAlarms" /></td>
                        <td>
                            <select v-model="alarm.hour" @change="debounceSaveAlarms"
                                @wheel="scrollChange($event, 'hour', alarm)">
                                <option v-for="hour in 12" :key="hour" :value="hour">{{ hour }}</option>
                            </select>
                            :
                            <select v-model="alarm.minute" @change="debounceSaveAlarms"
                                @wheel="scrollChange($event, 'minute', alarm)">
                                <option v-for="minute in 60" :key="minute" :value="minute">{{ minute < 10 ? '0' + minute
                                    : minute }}</option>
                            </select>
                            <select v-model="alarm.period" @change="debounceSaveAlarms"
                                @wheel="scrollChange($event, 'period', alarm)">
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </td>
                        <td>
                            <label class="switch">
                                <input type="checkbox" :checked="alarm.active" @change="toggleAlarm(alarm, index)">
                                <span class="slider"></span>
                            </label>
                        </td>
                    </tr>
                    <tr @click="addAlarm" class="add-alarm-row">
                        <td colspan="4" class="add-alarm-cell">
                            <img src="../../assets/add.svg" alt="Add Icon" class="add-icon" />
                        </td>
                    </tr>
                </tbody>
            </table>
            <button type="button" @click="closeAlarms">Close</button>
        </div>
    </div>
</template>

<script>
import { speakWithDefaultVoice } from '../SpeechSynth/SpeechSynth.js';

export default {
    data() {
        return {
            isRemindersOpen: false,
            isClosing: false,
            reminders: [],
            reminderTimeouts: {},
            debounceTimeout: null,
            isAlarmsOpen: false,
            alarms: [],
            alarmTimeouts: {},
            tooltip: '',
        };
    },
    created() {
        this.loadReminders();
        this.loadAlarms();
    },
    methods: {
        toggleReminders() {
            if (this.isRemindersOpen) {
                this.closeReminders();
            } else {
                this.isRemindersOpen = true;
            }
        },
        closeReminders() {
            this.isClosing = true;
            setTimeout(() => {
                this.isRemindersOpen = false;
                this.isClosing = false;
            }, 250); // Match the duration of the fade-out animation
        },
        loadReminders() {
            const storedReminders = localStorage.getItem('reminders');
            if (storedReminders) {
                this.reminders = JSON.parse(storedReminders);
            } else {
                this.reminders = [
                    { hour: 12, minute: 0, period: 'AM', shouldRepeat: true, name: 'Test Reminder', active: false },
                ];
                localStorage.setItem('reminders', JSON.stringify(this.reminders));
            }
        },
        toggleReminder(reminder, index) {
            console.log("here")
            this.reminders[index].active = !reminder.active;
            localStorage.setItem('reminders', JSON.stringify(this.reminders));
            if (reminder.active) {
                this.setReminder(reminder, index);
            } else {
                clearTimeout(this.reminderTimeouts[index]);
                speakWithDefaultVoice("Alright, going quiet...", false);
            }
        },
        setReminder(reminder, index) {
            const timeInMs = this.parseTime(reminder.hour, reminder.minute, reminder.period);
            const reminderFunction = () => {
                speakWithDefaultVoice(`Don't forget to ${reminder.name}`, false);
                if (reminder.shouldRepeat && reminder.active) {
                    this.reminderTimeouts[index] = setTimeout(reminderFunction, timeInMs);
                } else if (!reminder.shouldRepeat && reminder.active) {
                    this.reminders[index].active = false;
                    this.saveReminders();
                }
            };
            this.reminderTimeouts[index] = setTimeout(reminderFunction, timeInMs);
            speakWithDefaultVoice("Locked and loaded!!!", false);
        },
        parseTime(hour, minute, period) {
            const hours = period === 'PM' && hour !== 12 ? hour + 12 : hour;
            return (hours * 60 + minute) * 60 * 1000;
        },
        addReminder() {
            this.reminders.push({ hour: 12, minute: 0, period: 'AM', shouldRepeat: false, name: 'Do something', active: false });
            this.saveReminders();
        },
        saveReminders() {
            console.log("debounce test")
            localStorage.setItem('reminders', JSON.stringify(this.reminders));
        },
        updateRepeat(index, event) {
            this.reminders[index].shouldRepeat = event.target.value === 'true';
            this.saveReminders();
        },
        debounceSaveReminders() {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                this.saveReminders();
            }, 300);
        },
        deleteReminder(index) {
            clearTimeout(this.reminderTimeouts[index]);
            this.reminders.splice(index, 1);
            this.saveReminders();
            speakWithDefaultVoice("Deleted!!!", false);
        },
        toggleAlarms() {
            if (this.isAlarmsOpen) {
                this.closeAlarms();
            } else {
                this.isAlarmsOpen = true;
            }
        },
        closeAlarms() {
            this.isClosing = true;
            setTimeout(() => {
                this.isAlarmsOpen = false;
                this.isClosing = false;
            }, 250); // Match the duration of the fade-out animation
        },
        loadAlarms() {
            const storedAlarms = localStorage.getItem('alarms');
            if (storedAlarms) {
                this.alarms = JSON.parse(storedAlarms);
            } else {
                this.alarms = [
                    { hour: 12, minute: 0, period: 'AM', name: 'Test Alarm', active: false },
                ];
                localStorage.setItem('alarms', JSON.stringify(this.alarms));
            }
        },
        toggleAlarm(alarm, index) {
            this.alarms[index].active = !alarm.active;
            localStorage.setItem('alarms', JSON.stringify(this.alarms));
            if (alarm.active) {
                this.setAlarm(alarm, index);
            } else {
                clearTimeout(this.alarmTimeouts[index]);
            }
        },
        setAlarm(alarm, index) {
            const now = new Date();
            const alarmTime = new Date();
            let hours = alarm.period === 'PM' && alarm.hour !== 12 ? alarm.hour + 12 : alarm.hour;
            hours = alarm.period === 'AM' && alarm.hour === 12 ? 0 : alarm.hour;
            alarmTime.setHours(hours);
            alarmTime.setMinutes(alarm.minute);
            alarmTime.setSeconds(0);
            alarmTime.setMilliseconds(0);

            if (alarmTime <= now) {
                console.log("next day")
                alarmTime.setDate(alarmTime.getDate() + 1); // Set for the next day if the time has already passed
            }
            console.log("alarm time", alarmTime, now, hours)
            const timeUntilAlarm = alarmTime - now;
            const alarmFunction = () => {
                this.playRandomAlarmSound();
                if (alarm.active) {
                    this.alarms[index].active = false;
                    this.saveAlarms();
                }
            };
            this.alarmTimeouts[index] = setTimeout(alarmFunction, timeUntilAlarm);
        },
        playRandomAlarmSound() {
            const alarmSounds = [
                new URL('../../assets/alarms/hip hop.mp3', import.meta.url).href,
                new URL('../../assets/alarms/happy folk.mp3', import.meta.url).href,
            ];
            const randomSound = alarmSounds[Math.floor(Math.random() * alarmSounds.length)];
            const audio = new Audio(randomSound);
            audio.play().catch(error => {
                console.error("Failed to play audio:", error);
            });
        },
        addAlarm() {
            this.alarms.push({ hour: 12, minute: 0, period: 'AM', name: 'Do something', active: false });
            this.saveAlarms();
        },
        saveAlarms() {
            localStorage.setItem('alarms', JSON.stringify(this.alarms));
        },
        debounceSaveAlarms() {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                this.saveAlarms();
            }, 300);
        },
        deleteAlarm(index) {
            clearTimeout(this.alarmTimeouts[index]);
            this.alarms.splice(index, 1);
            this.saveAlarms();
        },
        showTooltip(type) {
            this.tooltip = type;
        },
        hideTooltip() {
            this.tooltip = '';
        },
        scrollChange(event, type, item) {
            event.preventDefault();
            const delta = Math.sign(event.deltaY);
            if (type === 'hour') {
                item.hour = (item.hour + delta + 12) % 12 || 12;
            } else if (type === 'minute') {
                item.minute = (item.minute + delta + 60) % 60;
            } else if (type === 'period') {
                item.period = item.period === 'AM' ? 'PM' : 'AM';
            }
            this.debounceSaveReminders();
        },
    },
    watch: {
        reminders: {
            handler(newReminders) {
                localStorage.setItem('reminders', JSON.stringify(newReminders));
            },
            deep: true,
        },
        alarms: {
            handler(newAlarms) {
                localStorage.setItem('alarms', JSON.stringify(newAlarms));
            },
            deep: true,
        },
    },
};
</script>

<style scoped src="./Reminders.css"></style>
<style scoped>
.delete-icon {
    width: 20px;
    height: 20px;
    cursor: pointer;
    margin-left: 10px;
}

.switch {
    position: relative;
    display: inline-block;
    width: 20px;
    height: 20px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 20px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked+.slider {
    background-color: #4CAF50;
}

input:checked+.slider:before {
    transform: translateX(20px);
}

.add-reminder-row {
    cursor: pointer;
}

.add-reminder-cell {
    padding: 0px !important;
    text-align: center;
}

.add-icon {
    width: 60px;
    height: 60px;
}

.alarms-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 20px;
    border-radius: 8px;
    overflow: hidden;
}

.alarms-table th,
.alarms-table td {
    min-width: 50%;
    padding: 20px 20px;
    text-align: center;
    border-bottom: 2px solid #ddd;
}

.alarms-table th {
    background-color: #FF5722;
    color: white;
}

.alarms-table tbody tr:hover {
    background-color: rgba(255, 87, 34, 0.1);
}

body.dark .alarms-table tbody tr:hover {
    background-color: rgba(102, 102, 102, 0.3);
}

.reminders-table th:nth-child(3),
.reminders-table td:nth-child(3),
.alarms-table th:nth-child(3),
.alarms-table td:nth-child(3) {
    min-width: 150px;
    /* Adjust the width as needed */
}

select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: transparent;
    border: none;
    padding: 5px 10px;
    /* Add space for custom arrow */
    margin: 0;
    font-size: 16px;
}

select::-ms-expand {
    display: none;
}
</style>

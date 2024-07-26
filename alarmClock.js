const readline = require('readline');

class Alarm {
    constructor(alarmTime, dayOfWeek, alertTime, onDismissOrSnooze) {
        this.alarmTime = alarmTime;
        this.dayOfWeek = dayOfWeek;
        this.alertTime = alertTime;
        this.snoozeCount = 0;
        this.intervalId = null;
        this.isAlerted = false;
        this.onDismissOrSnooze = onDismissOrSnooze; // Callback for when alarm is dismissed or snoozed
    }

    toString() {
        return `Alarm set for ${this.dayOfWeek} at ${this.alarmTime}, alerts at ${this.alertTime.toLocaleTimeString([], { timeZone: 'Asia/Kolkata' })} `;
    }

    startAlertInterval() {
        this.intervalId = setInterval(() => {
            const now = new Date();
            const currentIST = new Date(now.toLocaleString("en-US", { timeZone: 'Asia/Kolkata' }));

            if (!this.isAlerted && currentIST >= this.alertTime) {
                this.isAlerted = true;
                clearInterval(this.intervalId);
                console.log(`Alarm! It's ${this.alarmTime} on ${this.dayOfWeek}.`);
                this.promptSnooze();
            }
        }, 1000); // Check every second
    }

    promptSnooze() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(`Snooze for 5 minutes? (yes/no) `, (answer) => {
            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                this.snooze();
            } else {
                console.log("Alarm dismissed.");
                rl.close();
                this.onDismissOrSnooze(); // Call the callback after dismissing
            }
        });
    }

    snooze() {
        if (this.snoozeCount < 3) {
            this.alertTime.setMinutes(this.alertTime.getMinutes() + 5);
            this.snoozeCount++;
            console.log(`Alarm snoozed. Next alert time: ${this.alertTime.toLocaleTimeString([], { timeZone: 'Asia/Kolkata' })}`);
            this.isAlerted = false; // Reset alert status
            this.startAlertInterval(); // Restart the alert interval after snooze
            this.onDismissOrSnooze(); // Call the callback after snoozing
        } else {
            console.log("Snooze limit reached for this alarm.");
            this.onDismissOrSnooze(); // Call the callback after reaching snooze limit
        }
    }
}

class AlarmClock {
    constructor() {
        this.alarms = [];
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    displayTime() {
        const now = new Date();
        const currentTimeIST = now.toLocaleTimeString([], { timeZone: 'Asia/Kolkata' });
        console.log(`Current time in IST: ${currentTimeIST}`);
    }

    displayAlarms() {
        if (this.alarms.length === 0) {
            console.log("No alarms set.");
        } else {
            console.log("Alarms:");
            this.alarms.forEach((alarm, index) => {
                console.log(`${index}: ${alarm}`);
            });
        }
    }

    createAlarm(dayOfWeek) {
        const rl = this.rl;

        rl.question(`Enter alarm time for ${dayOfWeek} (HH:MM): `, (alarmTime) => {
            if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(alarmTime)) {
                console.log("Invalid time format. Please enter time in HH:MM format.");
                this.createAlarm(dayOfWeek); // Prompt again
                return;
            }

            const now = new Date();
            const alarmDateTime = new Date();

            // Set alarmDateTime to today's date and time based on alarmTime
            const [hours, minutes] = alarmTime.split(':');
            alarmDateTime.setHours(parseInt(hours));
            alarmDateTime.setMinutes(parseInt(minutes));
            alarmDateTime.setSeconds(0); // Ensure seconds are set to 0 for accuracy

            // Find next occurrence of the specified dayOfWeek
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const currentDay = days[now.getDay()];
            const targetDayIndex = days.indexOf(dayOfWeek);

            if (targetDayIndex === -1) {
                console.log("Invalid day of the week.");
                this.createAlarm(dayOfWeek); // Prompt again
                return;
            }

            let daysToAdd = targetDayIndex - days.indexOf(currentDay);
            if (daysToAdd < 0) {
                daysToAdd += 7; // Move to next week if the day has passed for this week
            }

            alarmDateTime.setDate(now.getDate() + daysToAdd);

            const alarm = new Alarm(alarmTime, dayOfWeek, alarmDateTime, () => this.promptNextAction());
            this.alarms.push(alarm);
            console.log(`Alarm set: ${alarm}`);
            alarm.startAlertInterval();

            this.promptNextAction();
        });
    }

    deleteAlarm(index) {
        if (index >= 0 && index < this.alarms.length) {
            const alarm = this.alarms[index];
            const rl = this.rl;
            rl.question(`Are you sure you want to delete the alarm set for ${alarm.dayOfWeek} at ${alarm.alarmTime}? (yes/no) `, (answer) => {
                if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                    const deletedAlarm = this.alarms.splice(index, 1)[0];
                    console.log(`Deleted alarm: ${deletedAlarm}`);
                } else {
                    console.log("Delete operation cancelled.");
                }
                this.promptNextAction();
            });
        } else {
            console.log("Invalid alarm index.");
            this.promptNextAction();
        }
    }

    snoozeAlarm(index) {
        if (index >= 0 && index < this.alarms.length) {
            this.alarms[index].snooze();
        } else {
            console.log("Invalid alarm index.");
        }
    }

    promptNextAction() {
        const rl = this.rl;
        rl.question(`What would you like to do next? (set alarm / delete alarm / display time / display alarms): `, (action) => {
            if (action.toLowerCase() === 'set alarm') {
                rl.question('Enter the day of the week: ', (dayOfWeek) => {
                    this.createAlarm(dayOfWeek);
                });
            } else if (action.toLowerCase() === 'delete alarm') {
                this.displayAlarms();
                rl.question('Enter the alarm index to delete: ', (index) => {
                    this.deleteAlarm(parseInt(index));
                });
            } else if (action.toLowerCase() === 'display time') {
                this.displayTime();
                this.promptNextAction();
            } else if (action.toLowerCase() === 'display alarms') {
                this.displayAlarms();
                this.promptNextAction();
            } else {
                console.log('Invalid action. Please try again.');
                this.promptNextAction();
            }
        });
    }
}

// Example usage:
const clock = new AlarmClock();
clock.promptNextAction();

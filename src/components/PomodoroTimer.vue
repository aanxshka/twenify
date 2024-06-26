<template>
  <div class="bg-opacity-30 bg-neutral-800 flex flex-col items-center justify-center py-8 min-h-[50vh]">
    <!-- Coin Message Box -->
    <div v-if="coinMessage" class="absolute bg-neutral-800 top-[10rem] right-0 rounded-l-full py-4 pl-9 pr-8 z-10">
      <div class="flex items-center justify-center gap-2">
        <img src="/icons/coins.svg" alt="" class="w-4 h-4" />
        <p class="text-white font-semibold">
          Congratulations! You earned {{ coinMessage }} QuackCoins
        </p>
      </div>
    </div>

    <!-- Pomodoro Toggle -->
    <div class="relative">
      <div class="flex gap-4">
        <button @click="manualToggleSession('pomo')" :class="{ underline: sessionNumber % 2 === 0 }"
          class="px-4 py-2 text-white underline-offset-4 duration-150 hover:scale-110">
          Pomodoro
        </button>
        <button @click="manualToggleSession('short')" :class="{
          underline: (sessionNumber % 2 === 1 && sessionNumber !== 7) || sessionNumber === -1
        }" class="px-4 py-2 text-white underline-offset-4 duration-150 hover:scale-110">
          Short Break
        </button>
        <button @click="manualToggleSession('long')" :class="{ underline: sessionNumber === 7 }"
          class="px-4 py-2 text-white underline-offset-4 duration-150 hover:scale-110">
          Long Break
        </button>
        <button @click="toggleSettings" class="px-4 py-2 text-white rounded-md duration-150 hover:scale-125">
          <img src="/icons/gear-solid.svg" alt="" class="w-4 gear-icon cursor-pointer" />
        </button>
      </div>

      <!-- Setting Dashboard -->
      <div v-if="showSettings" class="bg-tPurple p-4 rounded-lg shadow-xl absolute top-0 -right-[25em]">
        <div class="grid grid-cols-3 grid-rows-2 gap-2 mb-4 -mt-6">
          <label class="text-white w-28 font-semibold flex justify-center items-end">Pomodoro</label>
          <label class="text-white w-28 font-semibold flex justify-center items-end">Short Break</label>
          <label class="text-white w-28 font-semibold flex justify-center items-end">Long Break</label>
          <input type="number" v-model="sessions.pomo" @change="manualToggleSession('pomo')" :disabled="isRunning"
            class="flex w-28 rounded-lg" min="15" max="90" />
          <input type="number" v-model="sessions.short" @change="manualToggleSession('short')" :disabled="isRunning"
            class="flex w-28 rounded-lg" min="5" max="45" />
          <input type="number" v-model="sessions.long" @change="manualToggleSession('long')" :disabled="isRunning"
            class="flex w-28 rounded-lg" min="5" max="45" />
        </div>
        <div class="flex justify-between">
          <button @click="saveSettings" class="px-4 py-2 bg-tYellow text-white rounded-md mr-2">
            Save
          </button>
          <button @click="cancelSettings" class="px-4 py-2 bg-gray-400 text-white rounded-md">
            Cancel
          </button>
        </div>
        <div class="pb-4 pt-6 flex flex-row gap-3">
          <label class="text-white w-28 font-semibold text-nowrap">Audio Level</label>
          <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="updateVolume" class="flex w-full" />
        </div>
        <div class="pt-2 flex flex-row items-center gap-3">
          <label class="text-white font-semibold text-nowrap">Audio File</label>
          <select v-model="selectedAudio" class="flex rounded-md shadow-md">
            <option value="./audios/quack.mp3">Quack</option>
            <option value="./audios/bedside-clock-alarm.m4a">Bedside Clock</option>
            <option value="./audios/digital-alarm-clock.m4a">Digital Alarm Clock</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Pomodoro Functional -->
    <div class="grid grid-cols-2">
      <img :src="pomodoroImage" alt="" class="h-32 hover:scale-105 duration-150" />
      <div class="flex flex-col -ml-28 items-center">
        <div class="text-7xl font-bold mb-4 text-white duration-150 hover:scale-110">
          {{ formatTime }}
        </div>
        <Button @click="toggleTimer" :buttonText="isRunning ? 'Stop' : 'Start'"></Button>
      </div>
    </div>
  </div>
</template>

<script>
import firebaseApp from '../firebase.js'
import Button from '../components/Button.vue'
import { doc, getFirestore, updateDoc, addDoc, collection, increment, getDocs } from 'firebase/firestore'

const db = getFirestore(firebaseApp)

export default {
  props: {
    userData: {
      type: Object,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      sessions: {
        long: parseInt(this.userData.LongTime),
        pomo: parseInt(this.userData.PomoTime),
        short: parseInt(this.userData.ShortTime)
      },
      isRunning: false,
      intervalId: null,
      coinMessage: null,
      showSettings: false,
      sessionNumber: 0,
      timeLeft: 0,
      volume: 1,
      selectedAudio: './audios/quack.mp3'
    }
  },

  components: {
    Button
  },

  computed: {
    formatTime() {
      let minutes = Math.floor(this.timeLeft / 60)
      let seconds = this.timeLeft % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },

    pomodoroImage() {
      if (this.sessionNumber > 6) {
        return '/duckfeet/allfeet.png'
      } else if (this.sessionNumber > 4) {
        return '/duckfeet/3feet.png'
      } else if (this.sessionNumber > 2) {
        return '/duckfeet/2feet.png'
      } else if (this.sessionNumber > 0) {
        return '/duckfeet/1feet.png'
      } else {
        return '/duckfeet/nofeet.png'
      }
    }
  },

  mounted() {
    this.initializeData()
  },

  methods: {
    initializeData() {
      this.sessions = {
        long: parseInt(this.userData.LongTime),
        pomo: parseInt(this.userData.PomoTime),
        short: parseInt(this.userData.ShortTime)
      }
      this.sessionNumber = parseInt(localStorage.getItem('sessionNumber') || 0)
      this.timeLeft = parseFloat(localStorage.getItem('timeLeft') || this.userData.PomoTime * 60)
      this.volume = parseFloat(localStorage.getItem('volume')) || 1
      this.selectedAudio = localStorage.getItem('selectedAudio') || './audios/quack.mp3'

      localStorage.setItem('sessionNumber', this.sessionNumber)
      localStorage.setItem('timeLeft', this.timeLeft)
      localStorage.setItem('volume', this.volume)
      localStorage.setItem('selectedAudio', this.selectedAudio)
    },

    checkTimerState() {
      if (localStorage.getItem('isRunning') === 'true') {
        this.startTimer()
      }
    },

    updateVolume() {
      this.$emit('volume-change', this.volume)
      localStorage.setItem('volume', this.volume)
    },

    playAudio(volume) {
      const audio = new Audio(this.selectedAudio)
      audio.volume = volume
      audio.play()
    },

    playRingAudio(volume) {
      const audio = new Audio('./audios/start.mp3')
      audio.volume = volume
      audio.play()
    },

    startTimer() {
      this.playRingAudio(this.volume)
      this.isRunning = true
      localStorage.setItem('isRunning', 'true')
      this.intervalId = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--
          localStorage.setItem('timeLeft', this.timeLeft)
        } else {
          this.isRunning = false
          clearInterval(this.intervalId)

          if (this.sessionNumber % 2 === 1) {
            this.isRunning = false
            this.timeLeft = this.sessions['pomo'] * 60
            localStorage.setItem('timeLeft', this.timeLeft)
            if (this.sessionNumber === 7) {
              this.sessionNumber = 0
            } else {
              this.sessionNumber++
            }
            localStorage.setItem('sessionNumber', this.sessionNumber)
          } else {
            this.playAudio(this.volume)
            this.incrementCoin()
            this.incrementTotalHours()
            this.incrementLeaderboard()
            this.addToDateFocusedCollection()
            this.sessionNumber++
            localStorage.setItem('sessionNumber', this.sessionNumber)
            if (this.sessionNumber === 6) {
              this.isRunning = false
              this.timeLeft = this.sessions['long'] * 60
              localStorage.setItem('timeLeft', this.timeLeft)
            } else {
              this.isRunning = false
              this.timeLeft = this.sessions['short'] * 60
              localStorage.setItem('timeLeft', this.timeLeft)
            }
          }
        }
      }, 1000)
    },

    stopTimer() {
      clearInterval(this.intervalId)
      this.isRunning = false
      localStorage.setItem('isRunning', 'false')
    },

    toggleTimer() {
      if (!this.isRunning) {
        this.startTimer()
      } else {
        this.stopTimer()
      }
    },

    manualToggleSession(sessionType) {
      this.isRunning = false
      if (sessionType === 'pomo') {
        if (this.sessionNumber % 2 != 0) {
          localStorage.setItem('sessionNumber', 0)
          this.sessionNumber = 0
        }
        localStorage.setItem('timeLeft', this.sessions[sessionType] * 60)
        this.timeLeft = this.sessions['pomo'] * 60
      } else if (sessionType === 'short') {
        localStorage.setItem('sessionNumber', -1)
        this.sessionNumber = -1
        localStorage.setItem('timeLeft', this.sessions[sessionType] * 60)
        this.timeLeft = this.sessions['short'] * 60
      } else if (sessionType === 'long') {
        localStorage.setItem('sessionNumber', 7)
        this.sessionNumber = 7
        localStorage.setItem('timeLeft', this.sessions[sessionType] * 60)
        this.timeLeft = this.sessions['long'] * 60
      }
      this.checkValueInRange(sessionType)
    },

    // Check if the value is within the range
    checkValueInRange(sessionType) {
      let min, max;

      switch (sessionType) {
        case 'pomo':
          min = 15;
          max = 90;
          break;
        case 'short':
          min = 5;
          max = 45;
          break;
        case 'long':
          min = 5;
          max = 45;
          break;
      }
      if (this.sessions[sessionType] < min) {
        this.sessions[sessionType] = min;
      } else if (this.sessions[sessionType] > max) {
        this.sessions[sessionType] = max;
      }
    },

    incrementLeaderboard() {
      const docRef = doc(db, 'Leaderboard', this.userEmail)
      updateDoc(docRef, { TotalHours: increment(this.sessions.pomo / 60) })
        .then(() => {
          console.log('Leaderboard incremented successfully!')
        })
        .catch((error) => {
          console.error('Error updating Leaderboard: ', error)
        })
    },

    incrementTotalHours() {
      const docRef = doc(db, 'Total Hours', this.userEmail)
      updateDoc(docRef, { TotalHours: increment(this.sessions.pomo / 60) })
        .then(() => {
          console.log('Total Hours incremented successfully!')
        })
        .catch((error) => {
          console.error('Error updating Total Hours: ', error)
        })
    },

    async addToDateFocusedCollection() {
      const currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0) // set time for comparison

      const duration = this.sessions['pomo']

      const collectionRef = collection(db, 'Users', this.userEmail, 'DateFocused')

      // fetch all documents from the collection
      const querySnapshot = await getDocs(collectionRef)

      let docToUpdate = null

      querySnapshot.forEach((doc) => {
        const docDate = new Date(doc.data().Date.toMillis())
        docDate.setHours(0, 0, 0, 0) // set time for comparison

        if (docDate.getTime() === currentDate.getTime()) {
          // found the document to update
          docToUpdate = doc
        }
      });

      if (docToUpdate) {
        // update the document
        const docRef = doc(db, 'Users', this.userEmail, 'DateFocused', docToUpdate.id)
        return updateDoc(docRef, { FocusedMinute: increment(duration) })
          .then(() => {
            console.log('Duration updated successfully!')
          })
          .catch((error) => {
            console.error('Error updating duration: ', error)
          });
      } else {
        // No document with today's date, create new one
        const dateFocused = { Date: new Date(), FocusedMinute: duration }
        return addDoc(collectionRef, dateFocused)
          .then(() => {
            console.log('Duration added successfully!')
          })
          .catch((error) => {
            console.error('Error adding duration: ', error)
          });
      }
    },

    incrementCoin() {
      const docRef = doc(db, 'Users', this.userEmail)
      updateDoc(docRef, { Coins: increment(this.sessions.pomo) })
        .then(() => {
          console.log('Coin added successfully!')
          this.coinMessage = `You earned ${this.sessions.pomo} coin(s)!`

          setTimeout(() => {
            this.coinMessage = null
          }, 3000)
        })
        .catch((error) => {
          console.error('Error adding Coins: ', error)
          this.coinMessage = null
        })
    },

    toggleSettings() {
      this.showSettings = !this.showSettings
      const gearIcon = document.querySelector('.gear-icon')
      gearIcon.classList.toggle('rotate')
    },

    saveSettings() {
      const docRef = doc(db, 'Users', this.userEmail)
      return updateDoc(docRef, {
        PomoTime: this.sessions.pomo,
        ShortTime: this.sessions.short,
        LongTime: this.sessions.long
      }).then(() => {
        this.showSettings = false
        this.sessionNumber = 0
        this.timeLeft = this.sessions.pomo * 60
        localStorage.setItem('sessionNumber', this.sessionNumber)
        localStorage.setItem('timeLeft', this.timeLeft)
      })
    },

    cancelSettings() {
      this.showSettings = false
    }
  }
}
</script>

<style>
.rotate {
  transform: rotate(90deg);
  transition: transform 0.3s ease-in-out;
}
</style>

<script setup>
import ChatView from '../views/ChatView.vue'
import JoinChatName from '../components/JoinChat.vue'
import { socket } from '../socket'
import { reactive } from 'vue'

const cdata = reactive({
  name: '',
  showChat: false
})

// const connected = computed(() => {
//   return state.connected;
// })

function joinRoom(n) {
  if (n !== '') {
    socket.connect()
    socket.emit('create_user', n)
    cdata.name = n
    cdata.showChat = true
  }
}
</script>

<template>
  <!-- <p>State: {{ connected }}</p> -->

  <JoinChatName @join-room="joinRoom" v-if="cdata.showChat == false" />

  <ChatView :username="cdata.name" v-else />
</template>

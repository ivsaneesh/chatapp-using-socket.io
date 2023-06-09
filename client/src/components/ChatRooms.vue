<script setup>
import { watchEffect, ref, onMounted } from 'vue'
import { socket } from '../socket'

const emit = defineEmits(['selectedRoom'])

let unreadCount = ref(0)

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  member_count: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    required: true
  }
})

onMounted(() => {
})

watchEffect(async () => {
  /// get the unread message count of the chat room
  socket.on('unread_message_count', (data) => {
    if (props.active == false) {
      if (data.room == props.name && props.username != data.username) {
        unreadCount.value = data.count
      }
    } else {
      unreadCount.value = 0
    }
  })
  socket.on('clear_message_count', (data) => {
    if (data.room == props.name && props.username == data.username) {
      unreadCount.value = data.count
    }
  })
})

function onChatRoomClick() {
  const roomData = {
    room: props.name,
    username: props.username
  }

  socket.emit('join_room', roomData)
  socket.emit('switch_room', roomData)

  const obj = {
    room: props.name,
    member_count: props.member_count
  }
  // vue emit
  emit('selectedRoom', obj)
}
</script>

<template>
  <div class="d-flex justify-content-between align-items-center p-3" @click="onChatRoomClick()">
    <div>
      <h6>{{ props.name }}</h6>
      <div style="font-size: 12px">{{ props.member_count }} people joined</div>
    </div>
    <div>
      <div
        class="rounded rounded-circle text-white text-center"
        style="
          width: 25px;
          height: 25px;
          font-size: 12px;
          padding-top: 4px;
          background-color: #ff4a00;
        "
      >
        {{ unreadCount }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { watchEffect, ref, reactive, onMounted } from 'vue'
import { socket } from '../socket'
import ChatRooms from '../components/ChatRooms.vue'

const cdata = reactive({
  currentMessage: '',
  room: '',
  currentRoom: '',
  messageList: [],
  selected_room_member_count: 0
})

onMounted(() => {
  socket.emit('get_chat_rooms')
})

const props = defineProps({
  username: {
    type: String,
    required: true
  }
})

let chatRooms = ref([])

watchEffect(async () => {
  /// get chat rooms
  socket.on('receive_chat_rooms', (data) => {
    if (data) {
      chatRooms.value = []
      Object.entries(data).forEach(([key, value]) => {
        chatRooms.value.unshift({ name: key, member_count: value.members.length })
      })
    }
  })

  /// get the new message
  socket.on('receive_message', (data) => {
    cdata.messageList.push(data)
    scrollToBottom()
  })

  /// get the chat history message when switching the room
  socket.on('chat_history', (data) => {
    cdata.messageList = []
    data.forEach((element) => {
      cdata.messageList.push(element)
    })
    scrollToBottom()
  })

  /// get the chat rooms list
  socket.on('chat_rooms', (data) => {
    chatRooms.value = []
    Object.entries(data).forEach(([key, value]) => {
      chatRooms.value.unshift({ name: key, member_count: value.members.length })
    })
  })
})

function joinChatRoom() {
  if (cdata.room !== '') {
    const roomData = {
      room: cdata.room,
      username: props.username
    }
    socket.emit('join_room', roomData)
    cdata.currentRoom = cdata.room
    cdata.room = ''
  }
}

function sendMessage() {
  if (cdata.currentMessage !== '') {
    const messageData = {
      room: cdata.currentRoom,
      author: props.username,
      message: cdata.currentMessage,
      time: new Date(Date.now()).getHours() + ':' + new Date(Date.now()).getMinutes()
    }

    socket.emit('send_message', messageData)
    cdata.currentMessage = ''
  }
  scrollToBottom()
}

function onRoomSelected(n) {
  if (n !== '') {
    cdata.currentRoom = n.room
    cdata.selected_room_member_count = n.member_count
  }

  scrollToBottom()
}

function scrollToBottom() {
  var chatWindow = document.getElementById('chat_div')
  chatWindow.scrollIntoView()
}
</script>

<template>
  <!-- <h5>Username {{ props.username }}</h5> -->

  <div class="row h-100 m-0">
    <div class="col-12 col-md-3 h-100 ps-0">
      <div class="bg-white h-100">
        <div class="row">
          <div class="col-12" style="height: 55px">
            <div class="p-3">
              <h5 class="m-0">Rooms</h5>
            </div>
          </div>
        </div>
        <hr class="m-0" />
        <div class="row">
          <div class="col-12">
            <div class="p-3">
              <div class="input-group">
                <input
                  type="text"
                  class="form-control form-control-sm rounded"
                  placeholder="Type new room name"
                  aria-label="Room name"
                  aria-describedby="room-name"
                  v-model="cdata.room"
                  @keypress.enter="joinChatRoom()"
                />
                <div class="input-group-append">
                  <button
                    type="button"
                    class="btn ms-3 text-white"
                    style="background-color: #ff4a00"
                    @click="joinChatRoom()"
                  >
                    &#43;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr class="m-0" />
        <div>
          <div
            class="rounded shadow m-3"
            :style="cdata.currentRoom == item.name ? 'border-left : 2px solid #ff4a00' : ''"
            v-for="(item, index) in chatRooms"
            :key="index"
          >
            <ChatRooms
              :name="item.name"
              :member_count="item.member_count"
              :username="props.username"
              :active="cdata.currentRoom == item.name"
              @selected-room="onRoomSelected"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-9 h-100 pe-0">
      <div class="bg-white h-100">
        <div class="row align-items-center">
          <div class="col-12" style="height: 55px">
            <div class="px-3 pt-2">
              <h6 class="m-0">{{ cdata.currentRoom }}</h6>
              <div style="font-size: 12px; color: #ff4a00">
                {{
                  cdata.selected_room_member_count != 0
                    ? cdata.selected_room_member_count + ' people joined'
                    : ''
                }}
              </div>
            </div>
          </div>
        </div>
        <hr class="m-0" />
        <div style="background-color: #fafafa">
          <div class="p-3" style="height: 58vh; overflow-y: scroll; font-size: 13px">
            <div v-for="(messageContent, indexM) in cdata.messageList" :key="indexM">
              <div class="row justify-content-start" v-if="messageContent.author != props.username">
                <div class="col-6">
                  <div class="fw-bold">{{ messageContent.author }}</div>
                  <div class="my-2 p-2 rounded" style="background-color: #eaeaea">
                    {{ messageContent.message }}
                  </div>
                  <div style="font-size: 11px">{{ messageContent.time }}</div>
                </div>
              </div>
              <div class="row justify-content-end" v-else>
                <div class="col-6">
                  <div class="fw-bold">{{ messageContent.author }}</div>
                  <div class="my-2 p-2 rounded" style="background-color: #fee6da">
                    {{ messageContent.message }}
                  </div>
                  <div style="font-size: 11px">{{ messageContent.time }}</div>
                </div>
              </div>
            </div>
            <div id="chat_div"></div>
          </div>
          <div class="pb-4">
            <div class="row">
              <div class="col-12">
                <div class="p-3">
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control form-control-sm rounded"
                      aria-label="chat"
                      aria-describedby="chat"
                      v-model="cdata.currentMessage"
                      placeholder="Hey..."
                      @keypress.enter="sendMessage()"
                    />
                    <div class="input-group-append">
                      <button
                        type="button"
                        class="btn ms-3 text-white"
                        style="background-color: #ff4a00"
                        @click="sendMessage()"
                      >
                        &#9658;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>

<script setup>
import { reactive } from 'vue'

const cdata = reactive({
  name: ''
})
</script>
<template>
  <div class="bg-light" style="height: 100vh">
    <div class="d-flex justify-content-center align-items-center h-100">
      <div class="card w-50 p-4">
        <div class="text-center m-3">
          <h3 class="mt-3">Join Chat</h3>
        </div>
        <div class="text-center m-1">
          <input
            class="form-control mx-auto"
            type="text"
            placeholder="Name..."
            v-model="cdata.name"
            @keypress.enter="$emit('joinRoom', cdata.name)"
          />
        </div>
        <div class="text-center m-3">
          <button
            class="btn"
            @click="$emit('joinRoom', cdata.name)"
            style="background-color: #ff4a00; width: 300px"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<template>
  <li>
    <article>
      <p>{{ label }}</p>
      <audio controls :src="src"></audio>
      <button>Delete</button>
    </article>
  </li>
</template>

<script setup>
const label = "Default";
const props = defineProps({
  src: { type: String, required: true },
});
</script>

<style scoped></style>

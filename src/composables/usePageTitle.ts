// src/composables/usePageTitle.ts
import { watch } from 'vue'
import { useRoute } from 'vue-router'

export function usePageTitle(defaultTitle = 'UB FormFlow') {
  const route = useRoute()

  watch(
    () => route.meta.title,
    (title) => {
      document.title = (title as string) || defaultTitle
    },
    { immediate: true },
  )
}

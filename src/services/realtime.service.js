import Pusher from 'pusher-js'

let pusher = null
let channel = null

function authEndpoint() {
  return import.meta.env.VITE_PUSHER_AUTH_ENDPOINT
    || `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/broadcasting/auth`
}

export function subscribeToAdminNotifications(onAvailable, onError) {
  const key = import.meta.env.VITE_PUSHER_APP_KEY
  const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER

  // Pusher is optional in local development. The notification store keeps
  // polling as its fallback when credentials have not been configured yet.
  if (!key || !cluster) return () => {}

  const token = localStorage.getItem('sibimo_token')

  pusher = new Pusher(key, {
    cluster,
    forceTLS: true,
    authEndpoint: authEndpoint(),
    auth: {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  })

  pusher.connection.bind('error', onError)
  channel = pusher.subscribe('private-admin-notifications')
  channel.bind('notification.available', onAvailable)

  return unsubscribeFromAdminNotifications
}

export function unsubscribeFromAdminNotifications() {
  if (channel) {
    channel.unbind('notification.available')
    pusher?.unsubscribe('private-admin-notifications')
  }

  if (pusher) {
    pusher.connection.unbind('error')
    pusher.disconnect()
  }

  channel = null
  pusher = null
}

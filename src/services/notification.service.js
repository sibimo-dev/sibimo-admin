import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)

export const getNotifications = () => unwrap(api.get('/notifications'))

import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)

export const getStaffList = () => unwrap(api.get('/staff'))
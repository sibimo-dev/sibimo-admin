import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)

const unwrapList = (request) =>
  unwrap(request).then((data) => (Array.isArray(data) ? data : data?.data ?? []))

export const getUsers = () => unwrapList(api.get('/users'))
export const createUser = (payload) => unwrap(api.post('/users', payload))
export const updateUser = (id, payload) => unwrap(api.put(`/users/${id}`, payload))
export const deleteUser = (id) => unwrap(api.delete(`/users/${id}`))

export const getRoles = () => unwrapList(api.get('/roles'))
export const createRole = (payload) => unwrap(api.post('/roles', payload))
export const updateRole = (id, payload) => unwrap(api.put(`/roles/${id}`, payload))
export const deleteRole = (id) => unwrap(api.delete(`/roles/${id}`))
export const syncRolePermissions = (id, permissionIds) =>
  unwrap(api.put(`/roles/${id}/permissions`, { permission_ids: permissionIds }))

export const getPermissions = () => unwrapList(api.get('/permissions'))
export const createPermission = (payload) => unwrap(api.post('/permissions', payload))
export const updatePermission = (id, payload) =>
  unwrap(api.put(`/permissions/${id}`, payload))
export const deletePermission = (id) => unwrap(api.delete(`/permissions/${id}`))

export const getUserPermissions = (userId) =>
  unwrapList(api.get('/user-permissions', { params: { user_id: userId } }))
export const grantUserPermission = (userId, permissionId) =>
  unwrap(api.post('/user-permissions', {
    user_id: userId,
    permission_id: permissionId,
  }))
export const revokeUserPermission = (userId, permissionId) =>
  unwrap(api.delete('/user-permissions', {
    data: {
      user_id: userId,
      permission_id: permissionId,
    },
  }))

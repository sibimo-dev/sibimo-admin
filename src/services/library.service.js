import api from './api'

const unwrap = (request) => request.then((response) => response.data.data)

export const getBookCategories = () => unwrap(api.get('/book-categories'))
export const createBookCategory = (payload) => unwrap(api.post('/book-categories', payload))
export const updateBookCategory = (id, payload) => unwrap(api.put(`/book-categories/${id}`, payload))
export const deleteBookCategory = (id) => unwrap(api.delete(`/book-categories/${id}`))

export const getBooks = () => unwrap(api.get('/books'))
export const getBook = (id) => unwrap(api.get(`/books/${id}`))
export const createBook = (payload) => unwrap(api.post('/books', payload))
export const updateBook = (id, payload) => unwrap(api.put(`/books/${id}`, payload))
export const deleteBook = (id) => unwrap(api.delete(`/books/${id}`))

export const getLoans = () => unwrap(api.get('/book-loans'))
export const createLoan = (payload) => unwrap(api.post('/book-loans', payload))
export const returnLoan = (id, payload) => unwrap(api.put(`/book-loans/${id}`, payload))

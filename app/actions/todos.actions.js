export const ADD_TODO = 'ADD TODO'

export const addNewTodo = (newTodo) => {
  return {
    type: ADD_TODO,
    payload: newTodo
  }
}
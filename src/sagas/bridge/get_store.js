function* get_store() {
  const data = yield electronAPI.getStore();
  return data
}

export default get_store
// Placeholder function for task completion
function toggleTaskCompletion(id, isCompleted) {
  console.log(`Task ${id} completion status: ${isCompleted}`);
  // Implement the update API call here
  if (isCompleted) {
      deleteItem(id, 'task');
  }
}

function editItem(id) {
  console.log(`Edit item with id: ${id}`);
  // Implement the edit functionality here
}

//unused function v
function updatePriorityValue(value) {
  document.getElementById("priorityValue").textContent = value;
}

export{ updatePriorityValue, editItem, toggleTaskCompletion };
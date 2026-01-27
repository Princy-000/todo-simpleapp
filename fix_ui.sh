#!/bin/bash
# Fix UI.js renderTodos method

FILE="src/modules/UI.js"

# Add parameter to method signature
sed -i '205s/renderTodos()/renderTodos(todos = null)/' "$FILE"

# Find and replace the three project.todos references
# First, find the line numbers
line1=$(grep -n "if (project.todos.length === 0)" "$FILE" | head -1 | cut -d: -f1)
line2=$(grep -n "project.todos.forEach" "$FILE" | head -1 | cut -d: -f1)
line3=$(grep -n "Rendered.*project.todos.length" "$FILE" | head -1 | cut -d: -f1)

# Add todosToRender variable after container.innerHTML = ''
container_line=$(grep -n "container.innerHTML = ''" "$FILE" | head -1 | cut -d: -f1)
sed -i "$((container_line + 1))i\    const todosToRender = todos || project.todos;" "$FILE"

# Update the three references
sed -i "${line1}s/project.todos.length/todosToRender.length/" "$FILE"
sed -i "${line2}s/project.todos.forEach/todosToRender.forEach/" "$FILE"
sed -i "${line3}s/project.todos.length/todosToRender.length/" "$FILE"

echo "UI.js fixed successfully!"

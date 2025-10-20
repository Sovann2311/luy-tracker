let categories = [];

// Load categories from localStorage on page load
document.addEventListener("DOMContentLoaded", loadCategoriesFromLocalStorage);

// Save categories to localStorage
function saveCategoriesToLocalStorage() {
    localStorage.setItem("categories", JSON.stringify(categories));
}

// Load categories from localStorage
function loadCategoriesFromLocalStorage() {
    const storedCategories = localStorage.getItem("categories");
    if (storedCategories) {
        categories = JSON.parse(storedCategories);
        updateCategoryList();
    }
}

// Update the category list display
function updateCategoryList() {
    const categoryList = document.getElementById("categoryList");
    categoryList.innerHTML = "";
    categories.forEach((category, index) => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";
        listItem.textContent = category;
        
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "btn btn-warning btn-sm ml-2";
        editButton.onclick = () => openEditCategoryModal(index);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "btn btn-danger btn-sm ml-2";
        deleteButton.onclick = () => deleteCategory(index);

        listItem.appendChild(editButton);
        listItem.appendChild(deleteButton);
        categoryList.appendChild(listItem);
    });
}

// Add a new category
document.getElementById("addCategory").addEventListener("click", function() {
    const categoryInput = document.getElementById("categoryInput");
    const categoryName = categoryInput.value.trim();
    if (categoryName) {
        categories.push(categoryName);
        saveCategoriesToLocalStorage();
        updateCategoryList();
        categoryInput.value = ""; // Clear input
    }
});

// Open modal to edit a category
function openEditCategoryModal(index) {
    const categoryInput = document.getElementById("categoryInput");
    categoryInput.value = categories[index];
    
    // Update the add button to update on click
    document.getElementById("addCategory").onclick = function() {
        const updatedCategory = categoryInput.value.trim();
        if (updatedCategory) {
            categories[index] = updatedCategory;
            saveCategoriesToLocalStorage();
            updateCategoryList();
            categoryInput.value = ""; // Clear input
        }
    };
}

// Delete a category
function deleteCategory(index) {
    categories.splice(index, 1);
    saveCategoriesToLocalStorage();
    updateCategoryList();
}

// Call this function to open the category modal
function openCategoryModal() {
    $('#categoryModal').modal('show');
}
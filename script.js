// Enhanced Luy Tracker with Dashboard, Budgeting, and Analytics

let expenses = [];
let categories = ['Food', 'Travel', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare'];
let currentEditIndex = null;
let monthlyBudget = 0;
let budgetCurrency = 'USD';

// Exchange rates (simplified - in real app, use API)
const exchangeRates = {
    'USD': 1,
    'KHR': 4000
};

// Initialize app
document.addEventListener("DOMContentLoaded", function() {
    loadAllData();
    initializeDate();
    updateDashboard();
    initializeCharts();
    setupEventListeners();
});

// Load all data from localStorage
function loadAllData() {
    const storedExpenses = localStorage.getItem("expenses");
    const storedCategories = localStorage.getItem("categories");
    const storedBudget = localStorage.getItem("monthlyBudget");
    const storedBudgetCurrency = localStorage.getItem("budgetCurrency");
    
    if (storedExpenses) expenses = JSON.parse(storedExpenses);
    if (storedCategories) categories = JSON.parse(storedCategories);
    if (storedBudget) monthlyBudget = parseFloat(storedBudget);
    if (storedBudgetCurrency) budgetCurrency = storedBudgetCurrency;
    
    updateCategorySelects();
    updateExpenseTable();
    updateBudgetDisplay();
}

// Save all data to localStorage
function saveAllData() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("categories", JSON.stringify(categories));
    localStorage.setItem("monthlyBudget", monthlyBudget.toString());
    localStorage.setItem("budgetCurrency", budgetCurrency);
}

// Initialize current date
function initializeDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    document.getElementById('editExpenseDate').value = today;
    
    // Initialize month filter
    updateMonthFilter();
}

// Setup event listeners
function setupEventListeners() {
    // Expense form
    document.getElementById("expenseForm").addEventListener("submit", addExpense);
    
    // Edit expense form
    document.getElementById("editExpenseForm").addEventListener("submit", updateExpense);
    
    // Search and filter
    document.getElementById("searchExpenses").addEventListener("input", updateExpenseTable);
    document.getElementById("filterCategory").addEventListener("change", updateExpenseTable);
    document.getElementById("filterMonth").addEventListener("change", updateExpenseTable);
    
    // Export buttons
    document.getElementById("downloadCSV").addEventListener("click", downloadCSV);
    document.getElementById("downloadPDF").addEventListener("click", downloadPDF);
    
    // Category management
    document.getElementById("addCategory").addEventListener("click", addCategoryFromModal);
    
    // Set initial budget values
    document.getElementById("monthlyBudget").value = monthlyBudget;
    document.getElementById("budgetCurrency").value = budgetCurrency;
}

// Add new expense
function addExpense(event) {
    event.preventDefault();

    const date = document.getElementById("expenseDate").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const currency = document.getElementById("expenseCurrency").value;
    const category = document.getElementById("expenseCategory").value;
    const moneyType = document.getElementById("expenseMoneyType").value;
    const expenseType = document.getElementById("expenseType").value;
    const note = document.getElementById("expenseNote").value;
    const expense = { 
        date, 
        amount, 
        currency, 
        category, 
        moneyType, 
        expenseType, 
        note, 
        id: Date.now() // Unique ID for each expense
    };

    expenses.push(expense);
    saveAllData();
    updateExpenseTable();
    updateDashboard();
    updateCharts();
    
    // Success animation
    const form = document.getElementById("expenseForm");
    form.classList.add('success-flash');
    setTimeout(() => form.classList.remove('success-flash'), 1000);
    
    // Reset form
    event.target.reset();
    document.getElementById("expenseDate").value = new Date().toISOString().split('T')[0];
}

// Update expense table with filtering
function updateExpenseTable() {
    const tableBody = document.getElementById("expenseTableBody");
    const searchTerm = document.getElementById("searchExpenses").value.toLowerCase();
    const filterCategory = document.getElementById("filterCategory").value;
    const filterMonth = document.getElementById("filterMonth").value;
    
    let filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.note.toLowerCase().includes(searchTerm) || 
                             expense.category.toLowerCase().includes(searchTerm);
        const matchesCategory = !filterCategory || expense.category === filterCategory;
        const matchesMonth = !filterMonth || expense.date.startsWith(filterMonth);
        
        return matchesSearch && matchesCategory && matchesMonth;
    });

    tableBody.innerHTML = "";

    if (filteredExpenses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    No expenses found. Add your first expense above!
                </td>
            </tr>
        `;
        return;
    }

    // Sort by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    filteredExpenses.forEach((expense, index) => {
        const originalIndex = expenses.findIndex(e => e.id === expense.id);
        const row = document.createElement("tr");
        row.className = "expense-row";
        
        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>
                <strong>${expense.amount} ${expense.currency}</strong>
                ${expense.currency !== 'USD' ? `<br><small>(${convertCurrency(expense.amount, expense.currency, 'USD').toFixed(2)} USD)</small>` : ''}
            </td>
            <td>
                <span class="badge badge-primary">${expense.category}</span>
            </td>
            <td>${expense.moneyType === 'Cash' ? 'Self-Money' : 'House Money'}</td>
            <td>${expense.expenseType}</td>
            <td>${expense.note || '-'}</td>
            <!-- Recurring column removed -->
            <td>
                <button class="btn btn-warning btn-sm" onclick="openEditModal(${originalIndex})">
                    Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteExpense(${originalIndex})">
                    Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update dashboard statistics
function updateDashboard() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthExpenses = expenses.filter(expense => 
        expense.date.startsWith(currentMonth)
    );

    // Convert all to USD for calculations
    const totalExpensesUSD = currentMonthExpenses.reduce((sum, expense) => {
        return sum + convertCurrency(expense.amount, expense.currency, 'USD');
    }, 0);

    const dailyAverage = totalExpensesUSD / new Date().getDate();
    const largestExpense = Math.max(...currentMonthExpenses.map(expense => 
        convertCurrency(expense.amount, expense.currency, 'USD')
    ), 0);

    // Update DOM
    document.getElementById("totalExpenses").textContent = `$${totalExpensesUSD.toFixed(2)}`;
    document.getElementById("dailyAverage").textContent = `$${dailyAverage.toFixed(2)}`;
    document.getElementById("largestExpense").textContent = `$${largestExpense.toFixed(2)}`;
    
    updateBudgetDisplay();
}

// Budget functions
function setBudget() {
    const budgetInput = document.getElementById("monthlyBudget");
    const currencySelect = document.getElementById("budgetCurrency");
    
    monthlyBudget = parseFloat(budgetInput.value) || 0;
    budgetCurrency = currencySelect.value;
    
    saveAllData();
    updateBudgetDisplay();
    updateDashboard();
    
    // Show success message
    alert(`Budget set to ${monthlyBudget} ${budgetCurrency} per month!`);
}

function updateBudgetDisplay() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthExpenses = expenses.filter(expense => 
        expense.date.startsWith(currentMonth)
    );

    const totalExpensesUSD = currentMonthExpenses.reduce((sum, expense) => {
        return sum + convertCurrency(expense.amount, expense.currency, 'USD');
    }, 0);

    const budgetUSD = convertCurrency(monthlyBudget, budgetCurrency, 'USD');
    const remainingBudget = budgetUSD - totalExpensesUSD;
    const progressPercentage = budgetUSD > 0 ? (totalExpensesUSD / budgetUSD) * 100 : 0;

    // Update progress bar
    const progressBar = document.getElementById("budgetProgress");
    progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
    progressBar.textContent = `${Math.round(progressPercentage)}%`;
    
    // Update progress bar color based on usage
    if (progressPercentage > 90) {
        progressBar.className = "progress-bar bg-danger";
    } else if (progressPercentage > 75) {
        progressBar.className = "progress-bar bg-warning";
    } else {
        progressBar.className = "progress-bar bg-success";
    }

    // Update budget text
    document.getElementById("budgetText").textContent = 
        `Spent: $${totalExpensesUSD.toFixed(2)} / $${budgetUSD.toFixed(2)} (${Math.round(progressPercentage)}%)`;
    
    document.getElementById("remainingBudget").textContent = `$${Math.max(remainingBudget, 0).toFixed(2)}`;
}

// Chart functions
let categoryChart, monthlyChart;

function initializeCharts() {
    // Category Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Monthly Trend Chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Expenses (USD)',
                data: [],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    updateCharts();
}

function updateCharts() {
    updateCategoryChart();
    updateMonthlyChart();
}

function updateCategoryChart() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthExpenses = expenses.filter(expense => 
        expense.date.startsWith(currentMonth)
    );

    const categoryTotals = {};
    categories.forEach(category => {
        categoryTotals[category] = 0;
    });

    currentMonthExpenses.forEach(expense => {
        const amountUSD = convertCurrency(expense.amount, expense.currency, 'USD');
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + amountUSD;
    });

    const labels = [];
    const data = [];

    categories.forEach(category => {
        if (categoryTotals[category] > 0) {
            labels.push(category);
            data.push(categoryTotals[category]);
        }
    });

    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.update();
}

function updateMonthlyChart() {
    // Get last 6 months
    const months = [];
    const monthlyTotals = {};
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        months.push(monthName);
        monthlyTotals[monthKey] = 0;
    }

    // Calculate monthly totals
    expenses.forEach(expense => {
        const monthKey = expense.date.slice(0, 7);
        if (monthlyTotals.hasOwnProperty(monthKey)) {
            const amountUSD = convertCurrency(expense.amount, expense.currency, 'USD');
            monthlyTotals[monthKey] += amountUSD;
        }
    });

    const data = months.map((month, index) => {
        const monthKey = Object.keys(monthlyTotals)[index];
        return monthlyTotals[monthKey] || 0;
    });

    monthlyChart.data.labels = months;
    monthlyChart.data.datasets[0].data = data;
    monthlyChart.update();
}

// Category Management
function updateCategorySelects() {
    const selects = [
        'expenseCategory',
        'editExpenseCategory',
        'filterCategory'
    ];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="" selected disabled>Please select</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    });
}

function addCategoryFromModal() {
    const categoryInput = document.getElementById("categoryInput");
    const categoryName = categoryInput.value.trim();
    
    if (categoryName && !categories.includes(categoryName)) {
        categories.push(categoryName);
        saveAllData();
        updateCategoryList();
        updateCategorySelects();
        categoryInput.value = "";
    }
}

function updateCategoryList() {
    const categoryList = document.getElementById("categoryList");
    categoryList.innerHTML = "";
    
    categories.forEach((category, index) => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";
        listItem.textContent = category;
        
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.onclick = () => deleteCategory(index);

        listItem.appendChild(deleteButton);
        categoryList.appendChild(listItem);
    });
}

function deleteCategory(index) {
    // Check if category is used in expenses
    const isUsed = expenses.some(expense => expense.category === categories[index]);
    
    if (isUsed) {
        if (!confirm(`This category is used in ${expenses.filter(e => e.category === categories[index]).length} expenses. Delete anyway?`)) {
            return;
        }
    }
    
    categories.splice(index, 1);
    saveAllData();
    updateCategoryList();
    updateCategorySelects();
    updateExpenseTable();
    updateCharts();
}

// Export functions
function downloadCSV() {
    let csvContent = "Date,Amount,Currency,Category,Money Type,Expense Type,Description\n";

    expenses.forEach(expense => {
        const row = [
            expense.date,
            expense.amount,
            expense.currency,
            expense.category,
            expense.moneyType,
            expense.expenseType,
            `"${expense.note.replace(/"/g, '""')}"`
        ];
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expenses.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function downloadPDF() {
    // Simple PDF export using window.print() for now
    // In a real implementation, use jsPDF library
    window.print();
}

// Utility functions
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const amountUSD = fromCurrency === 'USD' ? amount : amount / exchangeRates[fromCurrency];
    return toCurrency === 'USD' ? amountUSD : amountUSD * exchangeRates[toCurrency];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function updateMonthFilter() {
    const filter = document.getElementById('filterMonth');
    const months = new Set(expenses.map(expense => expense.date.slice(0, 7)));
    const sortedMonths = Array.from(months).sort().reverse();
    
    filter.innerHTML = '<option value="">All Time</option>';
    sortedMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = new Date(month + '-01').toLocaleDateString('default', { 
            year: 'numeric', 
            month: 'long' 
        });
        filter.appendChild(option);
    });
}

function toggleBudgetSection() {
    const section = document.getElementById('budgetSection');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

function toggleDarkMode() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button text
    const button = document.querySelector('[onclick="toggleDarkMode()"]');
    button.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function clearAllExpenses() {
    if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) {
        expenses = [];
        saveAllData();
        updateExpenseTable();
        updateDashboard();
        updateCharts();
    }
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
    const button = document.querySelector('[onclick="toggleDarkMode()"]');
    if (button) {
        button.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
}

// Keep your existing functions for editing and deleting expenses
function openEditModal(index) {
    currentEditIndex = index;
    const expense = expenses[index];

    document.getElementById("editExpenseDate").value = expense.date;
    document.getElementById("editExpenseAmount").value = expense.amount;
    document.getElementById("editExpenseCurrency").value = expense.currency;
    document.getElementById("editExpenseCategory").value = expense.category;
    document.getElementById("editExpenseMoneyType").value = expense.moneyType;
    document.getElementById("editExpenseType").value = expense.expenseType;
    document.getElementById("editExpenseNote").value = expense.note;

    $('#editExpenseModal').modal('show');
}

function updateExpense(event) {
    event.preventDefault();

    const updatedExpense = {
        date: document.getElementById("editExpenseDate").value,
        amount: parseFloat(document.getElementById("editExpenseAmount").value),
        currency: document.getElementById("editExpenseCurrency").value,
        category: document.getElementById("editExpenseCategory").value,
        moneyType: document.getElementById("editExpenseMoneyType").value,
        expenseType: document.getElementById("editExpenseType").value,
        note: document.getElementById("editExpenseNote").value,
        id: expenses[currentEditIndex].id
    };

    expenses[currentEditIndex] = updatedExpense;
    saveAllData();
    updateExpenseTable();
    updateDashboard();
    updateCharts();

    $('#editExpenseModal').modal('hide');
}

function deleteExpense(index) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses.splice(index, 1);
        saveAllData();
        updateExpenseTable();
        updateDashboard();
        updateCharts();
    }
}

// Modal functions
function openCategoryModal() {
    updateCategoryList();
    $('#categoryModal').modal('show');
}
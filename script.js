// Enhanced Luy Tracker with Dashboard, Budgeting, and Analytics

let expenses = [];
let categories = ['Food', 'Travel', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare'];
let currentEditIndex = null;

// Exchange rates (simplified - in real app, use API)
const exchangeRates = {
    'USD': 1,
    'KHR': 4000
};

// Color palette for categories (shared between chart and expense badges)
const categoryColors = [
    '#007bff', // blue
    '#28a745', // green
    '#ffc107', // yellow
    '#dc3545', // red
    '#6f42c1', // purple
    '#fd7e14', // orange
    '#20c997', // teal
    '#17a2b8', // cyan
    '#6610f2', // indigo
    '#e83e8c'  // pink
];

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
    if (storedExpenses) expenses = JSON.parse(storedExpenses);
    if (storedCategories) categories = JSON.parse(storedCategories);
    
    
    updateCategorySelects();
    updateExpenseTable();
    // budget feature removed
}

// Save all data to localStorage
function saveAllData() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("categories", JSON.stringify(categories));
    // budget feature removed
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
    document.getElementById("filterMonth").addEventListener("change", updateExpenseTable);
    
    // Export buttons
    document.getElementById("downloadCSV").addEventListener("click", downloadCSV);
    document.getElementById("downloadPDF").addEventListener("click", downloadPDF);

    // Import button
    document.getElementById("importData").addEventListener("click", () => document.getElementById("importFile").click());
    document.getElementById("importFile").addEventListener("change", importData);
    
    // Category management
    document.getElementById("addCategory").addEventListener("click", addCategoryFromModal);
    
    // Set initial budget values
    // budget feature removed
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
    const filterMonth = document.getElementById("filterMonth").value;
    
    let filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.note.toLowerCase().includes(searchTerm) || 
                             expense.category.toLowerCase().includes(searchTerm);
        const matchesMonth = !filterMonth || expense.date.startsWith(filterMonth);
        
        return matchesSearch && matchesMonth;
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
        
        const categoryIndex = categories.indexOf(expense.category);
        const categoryColor = categoryIndex >= 0 ? categoryColors[categoryIndex % categoryColors.length] : '#6c757d';
        const badgeStyle = `background-color: ${categoryColor}; color: #fff; border: 1px solid ${shadeColor(categoryColor, -10)};`;

        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>
                <strong>${expense.amount} ${expense.currency}</strong>
                ${expense.currency !== 'USD' ? `<br><small>(${convertCurrency(expense.amount, expense.currency, 'USD').toFixed(2)} USD)</small>` : ''}
            </td>
            <td>
                <span class="badge" style="${badgeStyle}">${expense.category}</span>
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
    
}

// Budget functions
// budget functions removed

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
                backgroundColor: [] // will be populated dynamically based on categories
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
    const backgroundColors = [];

    categories.forEach(category => {
        if (categoryTotals[category] > 0) {
            labels.push(category);
            data.push(categoryTotals[category]);
            const colorIndex = categories.indexOf(category) % categoryColors.length;
            backgroundColors.push(categoryColors[colorIndex]);
        }
    });

    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.data.datasets[0].backgroundColor = backgroundColors;
    categoryChart.update();
}

function updateMonthlyChart() {
    // Get last 6 months
    const months = [];
    const monthKeys = [];
    const monthlyTotals = {};
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        monthKeys.push(monthKey);
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

    const data = monthKeys.map(key => monthlyTotals[key] || 0);
    const labels = monthKeys.map(key => {
        return new Date(key + '-02').toLocaleString('default', { month: 'short', year: '2-digit' });
    });

    monthlyChart.data.labels = labels;
    monthlyChart.data.datasets[0].data = data;
    monthlyChart.update();
}

// Category Management
function updateCategorySelects() {
    const selects = [
        'expenseCategory',
        'editExpenseCategory'
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

// Utility to darken or lighten a hex color. amount between -100 and 100.
function shadeColor(hex, percent) {
    // Remove leading '#'
    const h = hex.replace('#', '');
    const num = parseInt(h, 16);
    const r = (num >> 16) + Math.round(2.55 * percent);
    const g = ((num >> 8) & 0x00FF) + Math.round(2.55 * percent);
    const b = (num & 0x0000FF) + Math.round(2.55 * percent);
    const clamp = v => Math.max(0, Math.min(255, v));
    return `#${(clamp(r) << 16 | clamp(g) << 8 | clamp(b)).toString(16).padStart(6, '0')}`;
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

// Import data from Excel/CSV
function importData(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        try {
            const newExpenses = json.map(row => {
                // Basic validation and mapping
                if (!row.Date || !row.Amount || !row.Category) {
                    throw new Error('Invalid row found. Each row must have Date, Amount, and Category.');
                }
                
                // Handle Excel date which might be parsed as a Date object
                const date = row.Date instanceof Date ? row.Date.toISOString().split('T')[0] : row.Date;

                return {
                    date: date,
                    amount: parseFloat(row.Amount),
                    currency: row.Currency || 'USD',
                    category: row.Category,
                    moneyType: row['Money Type'] || 'Cash',
                    expenseType: row['Expense Type'] || 'Cash',
                    note: row.Description || '',
                    id: Date.now() + Math.random() // Ensure unique ID
                };
            });

            expenses.push(...newExpenses);
            saveAllData();
            updateExpenseTable();
            updateDashboard();
            updateCharts();
            alert(`${newExpenses.length} expenses imported successfully!`);
        } catch (error) {
            alert(`Error importing data: ${error.message}`);
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset file input
}
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const balanceEl = document.getElementById('balance');
    const incomeEl = document.getElementById('income-total');
    const expenseEl = document.getElementById('expense-total');
    const expenseForm = document.getElementById('expense-form');
    const incomeForm = document.getElementById('income-form');
    const transactionList = document.getElementById('transaction-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Initialize Charts
    const lineCtx = document.getElementById('expense-chart').getContext('2d');
    const pieCtx = document.getElementById('expense-pie-chart').getContext('2d');
    let lineChart, pieChart;

    // Local Storage Key
    const LOCAL_STORAGE_KEY = 'expenseTracker.transactions';
    
    // Load transactions from local storage
    let transactions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];

    // Initialize app
    function init() {
        updateValues();
        renderTransactionList('all');
        updateLineChart();
        updatePieChart();
        
        // Set default date values to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expense-date').value = today;
        document.getElementById('income-date').value = today;
        
        // Add event listeners
        expenseForm.addEventListener('submit', addExpense);
        incomeForm.addEventListener('submit', addIncome);
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(btn => btn.classList.remove('active'));
                btn.classList.add('active');
                renderTransactionList(btn.dataset.filter);
            });
        });
        
        // Tab navigation
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });
        
        // Navbar navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    // Add expense transaction
    function addExpense(e) {
        e.preventDefault();
        
        const categoryEl = document.getElementById('expense-category');
        const amountEl = document.getElementById('expense-amount');
        const dateEl = document.getElementById('expense-date');
        const noteEl = document.getElementById('expense-note');
        
        if(categoryEl.value === '' || amountEl.value.trim() === '' || dateEl.value === '') {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const transaction = {
            id: generateID(),
            text: categoryEl.value,
            note: noteEl.value,
            amount: parseFloat(amountEl.value),
            date: new Date(dateEl.value),
            type: 'expense'
        };
        
        transactions.push(transaction);
        updateLocalStorage();
        
        // Add with animation
        const newItem = createTransactionElement(transaction);
        transactionList.appendChild(newItem);
        
        // Reset form
        expenseForm.reset();
        dateEl.value = new Date().toISOString().split('T')[0]; // Reset to today
        
        // Update values
        updateValues();
        
        // Update charts
        updateLineChart();
        updatePieChart();
        
        // Show notification
        showNotification('Expense added successfully', 'success');
    }
    
    // Add income transaction
    function addIncome(e) {
        e.preventDefault();
        
        const sourceEl = document.getElementById('income-source');
        const amountEl = document.getElementById('income-amount');
        const dateEl = document.getElementById('income-date');
        const noteEl = document.getElementById('income-note');
        
        if(sourceEl.value === '' || amountEl.value.trim() === '' || dateEl.value === '') {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const transaction = {
            id: generateID(),
            text: sourceEl.value,
            note: noteEl.value,
            amount: parseFloat(amountEl.value),
            date: new Date(dateEl.value),
            type: 'income'
        };
        
        transactions.push(transaction);
        updateLocalStorage();
        
        // Add with animation
        const newItem = createTransactionElement(transaction);
        transactionList.appendChild(newItem);
        
        // Reset form
        incomeForm.reset();
        dateEl.value = new Date().toISOString().split('T')[0]; // Reset to today
        
        // Update values
        updateValues();
        
        // Update charts
        updateLineChart();
        updatePieChart();
        
        // Show notification
        showNotification('Income added successfully', 'success');
    }

    // Delete transaction
    function deleteTransaction(id) {
        const transactionEl = document.querySelector(`[data-id="${id}"]`);
        
        // Add removal animation
        transactionEl.style.transform = 'translateX(100%)';
        transactionEl.style.opacity = '0';
        
        setTimeout(() => {
            transactions = transactions.filter(transaction => transaction.id !== id);
            updateLocalStorage();
            updateValues();
            updateLineChart();
            updatePieChart();
            transactionEl.remove();
            showNotification('Transaction removed', 'info');
        }, 300);
    }

    // Update line chart
    function updateLineChart() {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        // Group by day
        const dailyData = {};
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = days[date.getDay()];
            dailyData[dayName] = { income: 0, expense: 0 };
        }
        
        transactions.forEach(transaction => {
            const transDate = new Date(transaction.date);
            if (transDate >= lastWeek) {
                const dayName = days[transDate.getDay()];
                if (dailyData[dayName]) {
                    if (transaction.type === 'income') {
                        dailyData[dayName].income += transaction.amount;
                    } else {
                        dailyData[dayName].expense += transaction.amount;
                    }
                }
            }
        });
        
        const chartData = {
            labels: Object.keys(dailyData),
            incomeData: Object.values(dailyData).map(day => day.income),
            expenseData: Object.values(dailyData).map(day => day.expense)
        };
        
        if (lineChart) {
            lineChart.destroy();
        }
        
        lineChart = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: chartData.incomeData,
                        backgroundColor: 'rgba(0, 184, 148, 0.2)',
                        borderColor: 'rgba(0, 184, 148, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(0, 184, 148, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Expenses',
                        data: chartData.expenseData,
                        backgroundColor: 'rgba(255, 118, 117, 0.2)',
                        borderColor: 'rgba(255, 118, 117, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(255, 118, 117, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'linear',
                        from: 0.5,
                        to: 0.4,
                        loop: false
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#f7fafc'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#2d3748',
                        titleColor: '#f7fafc',
                        bodyColor: '#f7fafc',
                        borderColor: '#6c5ce7',
                        borderWidth: 1,
                        caretPadding: 10,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ₹${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(160, 174, 192, 0.1)'
                        },
                        ticks: {
                            color: '#a0aec0'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(160, 174, 192, 0.1)'
                        },
                        ticks: {
                            color: '#a0aec0',
                            callback: function(value) {
                                return '₹' + value;
                            }
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Update pie chart
    function updatePieChart() {
        // Group expenses by category
        const categoryData = {};
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        // Initialize with zero values for common categories
        const commonCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Health', 'Education', 'Other'];
        commonCategories.forEach(cat => {
            categoryData[cat] = 0;
        });
        
        // Calculate totals for each category
        expenseTransactions.forEach(transaction => {
            const category = transaction.text;
            if (categoryData[category] !== undefined) {
                categoryData[category] += transaction.amount;
            } else {
                categoryData[category] = transaction.amount;
            }
        });
        
        // Filter out zero values
        const filteredCategories = {};
        Object.keys(categoryData).forEach(category => {
            if (categoryData[category] > 0) {
                filteredCategories[category] = categoryData[category];
            }
        });
        
        // Chart colors for categories
        const categoryColors = {
            'Food': 'rgba(255, 99, 132, 0.8)',
            'Transport': 'rgba(54, 162, 235, 0.8)',
            'Shopping': 'rgba(255, 206, 86, 0.8)',
            'Entertainment': 'rgba(75, 192, 192, 0.8)',
            'Utilities': 'rgba(153, 102, 255, 0.8)',
            'Health': 'rgba(255, 159, 64, 0.8)',
            'Education': 'rgba(199, 199, 199, 0.8)',
            'Other': 'rgba(83, 102, 255, 0.8)'
        };
        
        const labels = Object.keys(filteredCategories);
        const data = Object.values(filteredCategories);
        const backgroundColors = labels.map(label => categoryColors[label] || getRandomColor());
        
        if (pieChart) {
            pieChart.destroy();
        }
        
        if (data.length === 0) {
            // No expense data, show empty chart with message
            pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: ['No expenses yet'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['rgba(160, 174, 192, 0.2)']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#f7fafc'
                            }
                        },
                        tooltip: {
                            enabled: false
                        }
                    }
                }
            });
            return;
        }
        
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(33, 39, 48, 0.6)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#f7fafc',
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#2d3748',
                        titleColor: '#f7fafc',
                        bodyColor: '#f7fafc',
                        borderColor: '#6c5ce7',
                        borderWidth: 1,
                        caretPadding: 10,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ₹${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Update values
    function updateValues() {
        const incomeTotal = transactions
            .filter(transaction => transaction.type === 'income')
            .reduce((acc, transaction) => acc + transaction.amount, 0)
            .toFixed(2);
            
        const expenseTotal = transactions
            .filter(transaction => transaction.type === 'expense')
            .reduce((acc, transaction) => acc + transaction.amount, 0)
            .toFixed(2);
            
        const balance = (incomeTotal - expenseTotal).toFixed(2);
        
        // Update DOM with animations
        animateValue(balanceEl, balanceEl.innerText.replace('₹', ''), balance, '₹');
        animateValue(incomeEl, incomeEl.innerText.replace('₹', ''), incomeTotal, '₹');
        animateValue(expenseEl, expenseEl.innerText.replace('₹', ''), expenseTotal, '₹');
    }

    // Animate value change
    function animateValue(element, start, end, prefix = '') {
        start = parseFloat(start) || 0;
        end = parseFloat(end);
        
        if (start === end) return; // No change needed
        
        const duration = 500;
        const range = end - start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range)) || 10;
        
        let current = start;
        const timer = setInterval(function() {
            current += increment;
            element.innerText = `${prefix}${current.toFixed(2)}`;
            
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.innerText = `${prefix}${end}`;
                clearInterval(timer);
            }
        }, stepTime);
    }

    // Render transaction list
    function renderTransactionList(filter = 'all') {
        transactionList.innerHTML = '';
        
        let filteredTransactions = transactions;
        
        if (filter !== 'all') {
            filteredTransactions = transactions.filter(transaction => transaction.type === filter);
        }
        
        if (filteredTransactions.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No transactions found';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = 'var(--text-secondary)';
            emptyMessage.style.padding = '20px 0';
            transactionList.appendChild(emptyMessage);
            return;
        }
        
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        filteredTransactions.forEach(transaction => {
            const transactionEl = createTransactionElement(transaction);
            transactionList.appendChild(transactionEl);
        });
    }

    // Create transaction element
    function createTransactionElement(transaction) {
        const { id, text, note, amount, type, date } = transaction;
        
        const listItem = document.createElement('li');
        listItem.classList.add('transaction-item', type);
        listItem.dataset.id = id;
        
        const formattedDate = new Date(date).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        listItem.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-description">${text}</div>
                <div class="transaction-note">${note ? note : ''}</div>
                <div class="transaction-date">${formattedDate}</div>
            </div>
            <div class="transaction-amount ${type}">
                ${type === 'income' ? '+' : '-'}₹${amount.toFixed(2)}
            </div>
            <button class="delete-btn">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        
        listItem.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(id));
        
        return listItem;
    }

    // Show notification
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;
        
        // Style notification
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '5px';
        notification.style.color = '#fff';
        notification.style.fontSize = '0.9rem';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        notification.style.transition = 'all 0.3s ease';
        notification.style.zIndex = '1000';
        
        // Set notification color based on type
        if (type === 'success') {
            notification.style.backgroundColor = 'var(--income-color)';
        } else if (type === 'error') {
            notification.style.backgroundColor = 'var(--expense-color)';
        } else {
            notification.style.backgroundColor = 'var(--primary-color)';
        }
        
        document.body.appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Hide and remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Generate random ID
    function generateID() {
        return Math.floor(Math.random() * 1000000000);
    }
    
    // Generate random color for pie chart
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = 'rgba(';
        for (let i = 0; i < 3; i++) {
            color += Math.floor(Math.random() * 256) + ',';
        }
        color += '0.8)';
        return color;
    }

    // Update local storage
    function updateLocalStorage() {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
    }

    // Initialize the app
    init();
});
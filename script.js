
"use strict";

const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("transaction-date");

const balanceElement = document.getElementById("total-balance");
const incomeElement = document.getElementById("income-total");
const expenseElement = document.getElementById("expense-total");

const transactionList = document.getElementById("transaction-list");
const searchInput = document.getElementById("search");
const filterInput = document.getElementById("filter-type");


const STORAGE_KEY = "spendwise-transactions";

function loadTransactions() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const parsedData = savedData ? JSON.parse(savedData) : [];

        return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
        console.error("Could not load transactions:", error);
        return [];
    }
}

let transactions = loadTransactions();


function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );
    } catch (error) {
        console.error("Could not save transactions:", error);
        alert("Unable to save data in this browser.");
    }
}


function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }).format(amount);
}

function updateSummary() {
    const income = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const expenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const balance = income - expenses;

    if (balanceElement) {
        balanceElement.textContent = formatCurrency(balance);
    }

    if (incomeElement) {
        incomeElement.textContent = formatCurrency(income);
    }

    if (expenseElement) {
        expenseElement.textContent = formatCurrency(expenses);
    }
}


function renderTransactions() {
    if (!transactionList) {
        console.error('HTML element "#transaction-list" was not found.');
        return;
    }

    transactionList.replaceChildren();

    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedFilter = filterInput
        ? filterInput.value
        : "all";

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch =
            transaction.description.toLowerCase().includes(searchTerm) ||
            transaction.category.toLowerCase().includes(searchTerm);

        const matchesType =
            selectedFilter === "all" ||
            transaction.type === selectedFilter;

        return matchesSearch && matchesType;
    });

    if (filteredTransactions.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = transactions.length === 0
            ? "No transactions yet. Add your first transaction!"
            : "No transactions match your search.";

        transactionList.appendChild(emptyMessage);
        return;
    }

   
    const sortedTransactions = [...filteredTransactions].sort(
        (a, b) => b.createdAt - a.createdAt
    );

    sortedTransactions.forEach(transaction => {
        const item = document.createElement("article");
        item.className = "transaction-item";

        const details = document.createElement("div");
        details.className = "transaction-details";

        const title = document.createElement("h3");
        title.textContent = transaction.description;

        const meta = document.createElement("p");
        meta.textContent =
            `${transaction.category} · ${transaction.date}`;

        details.append(title, meta);

        const amount = document.createElement("span");
        amount.className = transaction.type === "income"
            ? "transaction-income"
            : "transaction-expense";

        const sign = transaction.type === "income" ? "+" : "−";
        amount.textContent = sign + formatCurrency(transaction.amount);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-transaction";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute(
            "aria-label",
            `Delete transaction: ${transaction.description}`
        );

        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });

        const rightSide = document.createElement("div");
        rightSide.className = "transaction-actions";
        rightSide.append(amount, deleteButton);

        item.append(details, rightSide);
        transactionList.appendChild(item);
    });
}


if (form) {
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const description = descriptionInput.value.trim();
        const amount = Number(amountInput.value);
        const type = typeInput.value;
        const category = categoryInput.value;
        const date = dateInput.value;

        if (!description) {
            alert("Please enter a transaction description.");
            descriptionInput.focus();
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter an amount greater than zero.");
            amountInput.focus();
            return;
        }

        if (type !== "income" && type !== "expense") {
            alert("Please select income or expense.");
            typeInput.focus();
            return;
        }

        if (!category) {
            alert("Please select a category.");
            categoryInput.focus();
            return;
        }

        if (!date) {
            alert("Please select a transaction date.");
            dateInput.focus();
            return;
        }

        const transaction = {
            id: crypto.randomUUID(),
            description: description,
            amount: amount,
            type: type,
            category: category,
            date: date,
            createdAt: Date.now()
        };

        transactions.push(transaction);
        saveTransactions();

        updateSummary();
        renderTransactions();

        form.reset();

     
        if (dateInput) {
            dateInput.value = getTodayDate();
        }

        if (descriptionInput) {
            descriptionInput.focus();
        }
    });
}

function deleteTransaction(id) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
        return;
    }

    transactions = transactions.filter(
        transaction => transaction.id !== id
    );

    saveTransactions();
    updateSummary();
    renderTransactions();
}


if (searchInput) {
    searchInput.addEventListener("input", renderTransactions);
}


if (filterInput) {
    filterInput.addEventListener("change", renderTransactions);
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


if (dateInput && !dateInput.value) {
    dateInput.value = getTodayDate();
}

updateSummary();
renderTransactions();

console.log("SpendWise initialized successfully!");

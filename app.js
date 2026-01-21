import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const ctx = document.getElementById('expenseChart').getContext('2d');
let myChart = null;
let currentExpenses = []; 

// AI Categorization Logic
function aiCategorize(desc) {
    const text = desc.toLowerCase();
    if (text.match(/pizza|burger|zomato|swiggy|food|grocery|eat|cafe|dinner|rest/)) return 'Food';
    if (text.match(/uber|ola|auto|petrol|diesel|bus|train|travel|flight/)) return 'Travel';
    if (text.match(/amazon|flipkart|myntra|shopping|buy|shirt|shoes|mall/)) return 'Shopping';
    if (text.match(/bill|rent|recharge|wifi|electric|water|gas|netflix/)) return 'Utilities';
    return 'Others';
}

// 1. Save Data
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    let category = document.getElementById('category').value;

    if (category === "Auto") category = aiCategorize(desc);

    try {
        await addDoc(collection(db, "expenses"), {
            description: desc,
            amount: amount,
            category: category,
            timestamp: Date.now()
        });
        expenseForm.reset();
    } catch (err) { console.error("Firebase Error:", err); }
});

// 2. Real-time Sync & UI Update
const q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    let totals = { Food: 0, Travel: 0, Shopping: 0, Utilities: 0, Others: 0 };
    let grandTotal = 0;
    expenseList.innerHTML = "";
    currentExpenses = []; 

    snapshot.docs.forEach((snapDoc) => {
        const data = snapDoc.data();
        data.id = snapDoc.id; 
        currentExpenses.push(data);

        totals[data.category] = (totals[data.category] || 0) + data.amount;
        grandTotal += data.amount;

        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `
            <div>
                <p style="font-weight:600">${data.description}</p>
                <small style="color: #6366f1;">${data.category}</small>
            </div>
            <div class="item-right">
                <span>₹${data.amount.toLocaleString('en-IN')}</span>
                <button class="delete-btn" data-id="${data.id}">🗑️</button>
            </div>
        `;
        expenseList.appendChild(li);
    });

    updateDashboard(totals, grandTotal);
    attachDeleteListeners();
});

// 3. Delete Logic
function attachDeleteListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            if (confirm("Permanently delete this entry?")) {
                await deleteDoc(doc(db, "expenses", id));
            }
        };
    });
}

// 4. Update Dashboard
function updateDashboard(totals, grandTotal) {
    document.getElementById('total-val').innerText = "₹" + grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    
    const statusText = document.getElementById('status-text');
    const overBudget = grandTotal > 10000;
    statusText.innerText = overBudget ? "Over Budget!" : "On Track";
    statusText.style.color = overBudget ? "#ef4444" : "#10b981";

    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals),
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
                borderWidth: 2
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, // Essential for mobile responsiveness
            plugins: { 
                legend: { 
                    position: window.innerWidth < 600 ? 'bottom' : 'right',
                    labels: { boxWidth: 12, padding: 15 }
                } 
            }
        }
    });
}

// Window resize listener to refresh chart placement
window.addEventListener('resize', () => {
    if (myChart) {
        myChart.options.plugins.legend.position = window.innerWidth < 600 ? 'bottom' : 'right';
        myChart.update();
    }
});

// 5. PDF Generation
document.getElementById('download-pdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    pdf.setFontSize(18);
    pdf.text("Expense Report - India", 14, 20);
    pdf.setFontSize(11);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    const rows = currentExpenses.map(item => [
        new Date(item.timestamp).toLocaleDateString(),
        item.description,
        item.category,
        `Rs. ${item.amount.toFixed(2)}`
    ]);

    pdf.autoTable({
        startY: 40, head: [['Date', 'Description', 'Category', 'Amount']],
        body: rows, theme: 'striped', headStyles: { fillColor: [99, 102, 241] }
    });

    pdf.save("Expense_Report.pdf");
});
import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const chartCtx = document.getElementById('expenseChart').getContext('2d');
let myChart = null;

// Real-time AI Categorizer
function aiCategorize(desc) {
    const text = desc.toLowerCase();
    if (text.match(/food|pizza|eat|zomato|cafe|swiggy|dining|restaurant/)) return 'Food';
    if (text.match(/uber|ola|petrol|travel|train|flight|bus|diesel/)) return 'Travel';
    if (text.match(/amazon|flipkart|shopping|buy|clothes|nike|mall/)) return 'Shopping';
    if (text.match(/rent|bill|recharge|wifi|electric|water|gas/)) return 'Utilities';
    return 'Others';
}

// Transaction Submission
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    let cat = document.getElementById('category').value;
    if (cat === "Auto") cat = aiCategorize(desc);

    try {
        await addDoc(collection(db, "expenses"), {
            description: desc, amount, category: cat, timestamp: Date.now()
        });
        expenseForm.reset();
    } catch (err) { alert("Operation failed: " + err.message); }
});

// Real-time UI Sync
const q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    let totals = { Food: 0, Travel: 0, Shopping: 0, Utilities: 0, Others: 0 };
    let grandTotal = 0;
    expenseList.innerHTML = "";

    snapshot.forEach((d) => {
        const data = d.data();
        grandTotal += data.amount;
        totals[data.category] = (totals[data.category] || 0) + data.amount;

        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `
            <div class="item-info">
                <b>${data.description}</b>
                <small>${data.category}</small>
            </div>
            <div style="display:flex; align-items:center; gap:15px">
                <span style="font-weight:700">₹${data.amount.toLocaleString('en-IN')}</span>
                <button onclick="window.delExp('${d.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i data-lucide="trash-2" size="18"></i></button>
            </div>
        `;
        expenseList.appendChild(li);
    });
    
    lucide.createIcons(); // Refresh icons for new list items
    updateVisuals(totals, grandTotal);
});

function updateVisuals(totals, grandTotal) {
    document.getElementById('total-val').innerText = "₹" + grandTotal.toLocaleString('en-IN');
    
    // Budget Progress Logic (Limit: 30,000)
    const percent = Math.min((grandTotal / 30000) * 100, 100);
    document.getElementById('budget-fill').style.width = percent + "%";
    
    if (myChart) myChart.destroy();
    myChart = new Chart(chartCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals),
                backgroundColor: ['#7047eb', '#10b981', '#ffc107', '#ff8a65', '#a29bfe'],
                hoverOffset: 20, borderWidth: 4, borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: { 
                legend: { 
                    position: window.innerWidth < 600 ? 'bottom' : 'right',
                    labels: { font: { family: 'Ubuntu', size: 12, weight: '500' }, usePointStyle: true, padding: 20 }
                } 
            }
        }
    });
}

window.delExp = async (id) => {
    if(confirm("Confirm deletion of audit record?")) await deleteDoc(doc(db, "expenses", id));
};
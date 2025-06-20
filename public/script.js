// Application State
let currentUser = null
let currentPage = "dashboard"
let bills = []
let users = []
let settings = {
  company: {
    name: "Your Company Name",
    address: "123 Business Street, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "info@company.com",
  },
  maxBills: 100,
  currentBills: 0,
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  // Hide loading screen after a short delay
  setTimeout(() => {
    document.getElementById("loading-screen").style.display = "none"
  }, 1000)

  loadData()
  initializeEventListeners()
  checkAuth()
})

// Data Management
function loadData() {
  // Load bills
  const savedBills = localStorage.getItem("mobileBilling_bills")
  if (savedBills) {
    bills = JSON.parse(savedBills)
  }

  // Load users
  const savedUsers = localStorage.getItem("mobileBilling_users")
  if (savedUsers) {
    users = JSON.parse(savedUsers)
  } else {
    // Initialize with default admin user
    users = [
      {
        id: 1,
        name: "Admin User",
        email: "admin@company.com",
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ]
    saveUsers()
  }

  // Load settings
  const savedSettings = localStorage.getItem("mobileBilling_settings")
  if (savedSettings) {
    settings = { ...settings, ...JSON.parse(savedSettings) }
  }

  // Update current bills count for today
  const today = new Date().toDateString()
  const todayBills = bills.filter((bill) => new Date(bill.createdAt).toDateString() === today)
  settings.currentBills = todayBills.length
}

function saveData() {
  localStorage.setItem("mobileBilling_bills", JSON.stringify(bills))
  localStorage.setItem("mobileBilling_users", JSON.stringify(users))
  localStorage.setItem("mobileBilling_settings", JSON.stringify(settings))
}

function saveBills() {
  localStorage.setItem("mobileBilling_bills", JSON.stringify(bills))
}

function saveUsers() {
  localStorage.setItem("mobileBilling_users", JSON.stringify(users))
}

function saveSettings() {
  localStorage.setItem("mobileBilling_settings", JSON.stringify(settings))
}

// Authentication
function checkAuth() {
  const savedUser = localStorage.getItem("mobileBilling_currentUser")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    showMainApp()
  } else {
    showLoginPage()
  }
}

function login(username, password) {
  // Simple authentication (in real app, this would be server-side)
  if (username === "admin" && password === "admin123") {
    currentUser = {
      id: 1,
      username: "admin",
      name: "Admin User",
      role: "admin",
    }
    localStorage.setItem("mobileBilling_currentUser", JSON.stringify(currentUser))
    showMainApp()
    showToast("Login successful!", "success")
    return true
  }
  return false
}

function logout() {
  currentUser = null
  localStorage.removeItem("mobileBilling_currentUser")
  showLoginPage()
  showToast("Logged out successfully!", "success")
}

function showLoginPage() {
  document.getElementById("login-page").classList.add("active")
  document.getElementById("main-app").classList.remove("active")
}

function showMainApp() {
  document.getElementById("login-page").classList.remove("active")
  document.getElementById("main-app").classList.add("active")
  updateDashboard()
  loadSettingsForm()
}

// Event Listeners
function initializeEventListeners() {
  // Login form
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault()
    const username = document.getElementById("username").value
    const password = document.getElementById("password").value

    if (!login(username, password)) {
      showToast("Invalid credentials!", "error")
    }
  })

  // Logout button
  document.getElementById("logout-btn").addEventListener("click", logout)

  // Menu toggle
  document.getElementById("menu-toggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("active")
  })

  // Sidebar navigation
  document.querySelectorAll(".sidebar-menu a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const page = this.getAttribute("data-page")
      navigateToPage(page)
    })
  })

  // Bill form
  document.getElementById("bill-form").addEventListener("submit", handleBillSubmit)
  document.getElementById("add-item-btn").addEventListener("click", addBillItem)
  document.getElementById("preview-bill-btn").addEventListener("click", previewBill)

  // Settings forms
  document.getElementById("save-settings-btn").addEventListener("click", saveSettingsForm)
  document.getElementById("reset-data-btn").addEventListener("click", resetAllData)

  // User management
  document.getElementById("add-user-btn").addEventListener("click", () => showUserModal())
  document.getElementById("user-form").addEventListener("submit", handleUserSubmit)

  // Bill filter
  document.getElementById("bill-filter").addEventListener("change", function () {
    displayBills(this.value)
  })

  // Modal close buttons
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.closest(".modal").classList.remove("active")
    })
  })

  // Invoice actions
  document.getElementById("print-invoice-btn").addEventListener("click", printInvoice)
  document.getElementById("download-invoice-btn").addEventListener("click", downloadInvoice)

  // Close sidebar when clicking outside
  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("sidebar")
    const menuToggle = document.getElementById("menu-toggle")

    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove("active")
    }
  })

  // Add first bill item by default
  addBillItem()
}

// Navigation
function navigateToPage(page) {
  // Update active menu item
  document.querySelectorAll(".sidebar-menu a").forEach((link) => {
    link.classList.remove("active")
  })
  document.querySelector(`[data-page="${page}"]`).classList.add("active")

  // Hide all content pages
  document.querySelectorAll(".content-page").forEach((page) => {
    page.classList.remove("active")
  })

  // Show selected page
  document.getElementById(`${page}-page`).classList.add("active")

  // Update page title
  const titles = {
    dashboard: "Dashboard",
    "create-bill": "Create Bill",
    bills: "All Bills",
    users: "User Management",
    settings: "Settings",
  }
  document.getElementById("page-title").textContent = titles[page]

  // Close sidebar on mobile
  document.getElementById("sidebar").classList.remove("active")

  // Load page-specific data
  switch (page) {
    case "dashboard":
      updateDashboard()
      break
    case "bills":
      displayBills("all")
      break
    case "users":
      displayUsers()
      break
    case "settings":
      loadSettingsForm()
      break
  }

  currentPage = page
}

// Dashboard
function updateDashboard() {
  const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0)
  const retailBills = bills.filter((bill) => bill.type === "retail").length
  const wholesaleBills = bills.filter((bill) => bill.type === "wholesale").length

  document.getElementById("total-revenue").textContent = `$${totalRevenue.toFixed(2)}`
  document.getElementById("total-bills").textContent = bills.length
  document.getElementById("retail-bills").textContent = retailBills
  document.getElementById("wholesale-bills").textContent = wholesaleBills

  displayRecentBills()
}

function displayRecentBills() {
  const recentBills = bills.slice(-5).reverse()
  const container = document.getElementById("recent-bills-list")

  if (recentBills.length === 0) {
    container.innerHTML = "<p>No bills created yet.</p>"
    return
  }

  container.innerHTML = recentBills.map((bill) => createBillCard(bill)).join("")
}

// Bill Management
function addBillItem() {
  const container = document.getElementById("items-container")
  const itemIndex = container.children.length

  const itemRow = document.createElement("div")
  itemRow.className = "item-row"
  itemRow.innerHTML = `
        <div class="form-group">
            <label>Item Name</label>
            <input type="text" name="itemName" required>
        </div>
        <div class="form-group">
            <label>Quantity</label>
            <input type="number" name="quantity" min="1" value="1" required>
        </div>
        <div class="form-group">
            <label>Price</label>
            <input type="number" name="price" min="0" step="0.01" required>
        </div>
        <div class="form-group">
            <label>Total</label>
            <input type="number" name="itemTotal" readonly>
        </div>
        <button type="button" class="remove-item-btn" onclick="removeItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `

  container.appendChild(itemRow)

  // Add event listeners for calculation
  const quantityInput = itemRow.querySelector('input[name="quantity"]')
  const priceInput = itemRow.querySelector('input[name="price"]')
  const totalInput = itemRow.querySelector('input[name="itemTotal"]')

  function updateItemTotal() {
    const quantity = Number.parseFloat(quantityInput.value) || 0
    const price = Number.parseFloat(priceInput.value) || 0
    const total = quantity * price
    totalInput.value = total.toFixed(2)
    updateBillSummary()
  }

  quantityInput.addEventListener("input", updateItemTotal)
  priceInput.addEventListener("input", updateItemTotal)
}

function removeItem(button) {
  button.closest(".item-row").remove()
  updateBillSummary()
}

function updateBillSummary() {
  const itemTotals = document.querySelectorAll('input[name="itemTotal"]')
  let subtotal = 0

  itemTotals.forEach((input) => {
    subtotal += Number.parseFloat(input.value) || 0
  })

  const discountPercent = Number.parseFloat(document.getElementById("discount").value) || 0
  const taxPercent = Number.parseFloat(document.getElementById("tax").value) || 0

  const discountAmount = subtotal * (discountPercent / 100)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (taxPercent / 100)
  const total = taxableAmount + taxAmount

  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`
  document.getElementById("discount-amount").textContent = `$${discountAmount.toFixed(2)}`
  document.getElementById("tax-amount").textContent = `$${taxAmount.toFixed(2)}`
  document.getElementById("total-amount").textContent = `$${total.toFixed(2)}`
}

// Add event listeners for discount and tax inputs
document.getElementById("discount").addEventListener("input", updateBillSummary)
document.getElementById("tax").addEventListener("input", updateBillSummary)

function handleBillSubmit(e) {
  e.preventDefault()

  // Check bill limit
  if (settings.currentBills >= settings.maxBills) {
    showToast("Daily bill limit reached!", "error")
    return
  }

  const formData = new FormData(e.target)
  const items = []

  // Collect items
  const itemRows = document.querySelectorAll(".item-row")
  itemRows.forEach((row) => {
    const name = row.querySelector('input[name="itemName"]').value
    const quantity = Number.parseFloat(row.querySelector('input[name="quantity"]').value)
    const price = Number.parseFloat(row.querySelector('input[name="price"]').value)
    const total = Number.parseFloat(row.querySelector('input[name="itemTotal"]').value)

    if (name && quantity && price) {
      items.push({ name, quantity, price, total })
    }
  })

  if (items.length === 0) {
    showToast("Please add at least one item!", "error")
    return
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discountPercent = Number.parseFloat(formData.get("discount")) || 0
  const taxPercent = Number.parseFloat(formData.get("tax")) || 0
  const discountAmount = subtotal * (discountPercent / 100)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (taxPercent / 100)
  const total = taxableAmount + taxAmount

  // Create bill
  const bill = {
    id: Date.now(),
    number: `INV-${String(bills.length + 1).padStart(4, "0")}`,
    type: formData.get("billType"),
    customer: {
      name: formData.get("customerName"),
      phone: formData.get("customerPhone"),
      email: formData.get("customerEmail"),
    },
    items,
    subtotal,
    discountPercent,
    discountAmount,
    taxPercent,
    taxAmount,
    total,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id,
  }

  bills.push(bill)
  settings.currentBills++
  saveBills()
  saveSettings()

  showToast("Bill created successfully!", "success")

  // Reset form
  e.target.reset()
  document.getElementById("items-container").innerHTML = ""
  addBillItem()
  updateBillSummary()

  // Navigate to bills page
  navigateToPage("bills")
}

function previewBill() {
  // Validate form first
  const form = document.getElementById("bill-form")
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const formData = new FormData(form)
  const items = []

  // Collect items
  const itemRows = document.querySelectorAll(".item-row")
  itemRows.forEach((row) => {
    const name = row.querySelector('input[name="itemName"]').value
    const quantity = Number.parseFloat(row.querySelector('input[name="quantity"]').value)
    const price = Number.parseFloat(row.querySelector('input[name="price"]').value)
    const total = Number.parseFloat(row.querySelector('input[name="itemTotal"]').value)

    if (name && quantity && price) {
      items.push({ name, quantity, price, total })
    }
  })

  if (items.length === 0) {
    showToast("Please add at least one item!", "error")
    return
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discountPercent = Number.parseFloat(formData.get("discount")) || 0
  const taxPercent = Number.parseFloat(formData.get("tax")) || 0
  const discountAmount = subtotal * (discountPercent / 100)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (taxPercent / 100)
  const total = taxableAmount + taxAmount

  // Create preview bill
  const previewBill = {
    number: `INV-${String(bills.length + 1).padStart(4, "0")}`,
    type: formData.get("billType"),
    customer: {
      name: formData.get("customerName"),
      phone: formData.get("customerPhone"),
      email: formData.get("customerEmail"),
    },
    items,
    subtotal,
    discountPercent,
    discountAmount,
    taxPercent,
    taxAmount,
    total,
    createdAt: new Date().toISOString(),
  }

  showInvoiceModal(previewBill)
}

// Bills Display
function displayBills(filter = "all") {
  let filteredBills = bills

  if (filter !== "all") {
    filteredBills = bills.filter((bill) => bill.type === filter)
  }

  const container = document.getElementById("all-bills-list")

  if (filteredBills.length === 0) {
    container.innerHTML = "<p>No bills found.</p>"
    return
  }

  container.innerHTML = filteredBills
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((bill) => createBillCard(bill))
    .join("")
}

function createBillCard(bill) {
  const date = new Date(bill.createdAt).toLocaleDateString()
  return `
        <div class="bill-card ${bill.type}">
            <div class="bill-header">
                <div class="bill-number">${bill.number}</div>
                <div class="bill-type ${bill.type}">${bill.type}</div>
            </div>
            <div class="bill-info">
                <div class="bill-customer">${bill.customer.name}</div>
                <div class="bill-date">${date}</div>
            </div>
            <div class="bill-footer">
                <div class="bill-amount">$${bill.total.toFixed(2)}</div>
                <div class="bill-actions">
                    <button class="btn btn-sm btn-secondary" onclick="viewBill(${bill.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBill(${bill.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `
}

function viewBill(billId) {
  const bill = bills.find((b) => b.id === billId)
  if (bill) {
    showInvoiceModal(bill)
  }
}

function deleteBill(billId) {
  if (confirm("Are you sure you want to delete this bill?")) {
    bills = bills.filter((b) => b.id !== billId)
    saveBills()
    displayBills(document.getElementById("bill-filter").value)
    updateDashboard()
    showToast("Bill deleted successfully!", "success")
  }
}

// Invoice Modal
function showInvoiceModal(bill) {
  const modal = document.getElementById("invoice-modal")
  const content = document.getElementById("invoice-content")

  content.innerHTML = generateInvoiceHTML(bill)
  modal.classList.add("active")
}

function generateInvoiceHTML(bill) {
  const date = new Date(bill.createdAt).toLocaleDateString()

  return `
        <div class="invoice-header">
            <h1>INVOICE</h1>
            <div style="margin-top: 10px;">
                <strong>${settings.company.name}</strong><br>
                ${settings.company.address}<br>
                Phone: ${settings.company.phone}<br>
                Email: ${settings.company.email}
            </div>
        </div>
        
        <div class="invoice-details">
            <div>
                <h3>Bill To:</h3>
                <strong>${bill.customer.name}</strong><br>
                ${bill.customer.phone ? `Phone: ${bill.customer.phone}<br>` : ""}
                ${bill.customer.email ? `Email: ${bill.customer.email}<br>` : ""}
            </div>
            <div style="text-align: right;">
                <h3>Invoice Details:</h3>
                <strong>Invoice #:</strong> ${bill.number}<br>
                <strong>Date:</strong> ${date}<br>
                <strong>Type:</strong> ${bill.type.toUpperCase()}<br>
            </div>
        </div>
        
        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${bill.items
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td>$${item.total.toFixed(2)}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
        
        <div class="invoice-summary">
            <table>
                <tr>
                    <td>Subtotal:</td>
                    <td>$${bill.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Discount (${bill.discountPercent}%):</td>
                    <td>-$${bill.discountAmount.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Tax (${bill.taxPercent}%):</td>
                    <td>$${bill.taxAmount.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Total:</strong></td>
                    <td><strong>$${bill.total.toFixed(2)}</strong></td>
                </tr>
            </table>
        </div>
    `
}

function printInvoice() {
  window.print()
}

function downloadInvoice() {
  // Simple download as HTML file
  const content = document.getElementById("invoice-content").innerHTML
  const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
                .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .invoice-table th, .invoice-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                .invoice-table th { background: #f8f9fa; font-weight: 600; }
                .invoice-summary { margin-left: auto; width: 300px; }
                .invoice-summary table { width: 100%; }
                .total-row { font-weight: 700; font-size: 18px; border-top: 2px solid #333; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `

  const blob = new Blob([fullHTML], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "invoice.html"
  a.click()
  URL.revokeObjectURL(url)
}

// User Management
function displayUsers() {
  const container = document.getElementById("users-list")

  if (users.length === 0) {
    container.innerHTML = "<p>No users found.</p>"
    return
  }

  container.innerHTML = users
    .map(
      (user) => `
        <div class="user-card">
            <div class="user-info">
                <h3>${user.name}</h3>
                <p>${user.email}</p>
                <p>Role: ${user.role}</p>
                <span class="user-status ${user.status}">${user.status}</span>
            </div>
            <div class="user-actions">
                <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

function showUserModal(userId = null) {
  const modal = document.getElementById("user-modal")
  const form = document.getElementById("user-form")
  const title = document.getElementById("user-modal-title")

  if (userId) {
    const user = users.find((u) => u.id === userId)
    if (user) {
      title.textContent = "Edit User"
      document.getElementById("user-name").value = user.name
      document.getElementById("user-email").value = user.email
      document.getElementById("user-role").value = user.role
      document.getElementById("user-status").value = user.status
      form.dataset.userId = userId
    }
  } else {
    title.textContent = "Add User"
    form.reset()
    delete form.dataset.userId
  }

  modal.classList.add("active")
}

function handleUserSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const userId = e.target.dataset.userId

  const userData = {
    name: formData.get("userName"),
    email: formData.get("userEmail"),
    role: formData.get("userRole"),
    status: formData.get("userStatus"),
  }

  if (userId) {
    // Edit existing user
    const userIndex = users.findIndex((u) => u.id === Number.parseInt(userId))
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...userData }
      showToast("User updated successfully!", "success")
    }
  } else {
    // Add new user
    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
    }
    users.push(newUser)
    showToast("User added successfully!", "success")
  }

  saveUsers()
  displayUsers()
  document.getElementById("user-modal").classList.remove("active")
}

function editUser(userId) {
  showUserModal(userId)
}

function deleteUser(userId) {
  if (confirm("Are you sure you want to delete this user?")) {
    users = users.filter((u) => u.id !== userId)
    saveUsers()
    displayUsers()
    showToast("User deleted successfully!", "success")
  }
}

// Settings Management
function loadSettingsForm() {
  document.getElementById("company-name").value = settings.company.name
  document.getElementById("company-address").value = settings.company.address
  document.getElementById("company-phone").value = settings.company.phone
  document.getElementById("company-email").value = settings.company.email
  document.getElementById("max-bills").value = settings.maxBills
  document.getElementById("current-bills").value = settings.currentBills
}

function saveSettingsForm() {
  settings.company.name = document.getElementById("company-name").value
  settings.company.address = document.getElementById("company-address").value
  settings.company.phone = document.getElementById("company-phone").value
  settings.company.email = document.getElementById("company-email").value
  settings.maxBills = Number.parseInt(document.getElementById("max-bills").value)

  saveSettings()
  showToast("Settings saved successfully!", "success")
}

function resetAllData() {
  if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
    localStorage.clear()
    bills = []
    users = [
      {
        id: 1,
        name: "Admin User",
        email: "admin@company.com",
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ]
    settings = {
      company: {
        name: "Your Company Name",
        address: "123 Business Street, City, State 12345",
        phone: "+1 (555) 123-4567",
        email: "info@company.com",
      },
      maxBills: 100,
      currentBills: 0,
    }

    saveData()
    loadSettingsForm()
    updateDashboard()
    displayUsers()
    displayBills("all")

    showToast("All data has been reset!", "success")
  }
}

// Toast Notifications
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container")
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
            <span>${message}</span>
        </div>
    `

  container.appendChild(toast)

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// Utility Functions
function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

// Initialize first bill item when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Add event listener for bill form calculations
  setTimeout(() => {
    if (document.getElementById("discount")) {
      document.getElementById("discount").addEventListener("input", updateBillSummary)
      document.getElementById("tax").addEventListener("input", updateBillSummary)
    }
  }, 100)
})

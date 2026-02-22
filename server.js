require("dotenv").config();
const express = require("express");
const app = express();

const env = process.env.NODE_ENV; // "production"
const version = process.env.API_VERSION; // "v1"

// Middleware to parse JSON request bodies
app.use(express.json());

// -----------------------------------------------
// In-memory "database" (we'll connect to Azure SQL later)
// -----------------------------------------------
let products = [
  { id: 1, name: "Laptop", price: 999.99, stock: 50 },
  { id: 2, name: "Mouse", price: 29.99, stock: 200 },
  { id: 3, name: "Keyboard", price: 79.99, stock: 150 },
];

let nextId = 4; // Auto-increment ID counter

// -----------------------------------------------
// ROUTES
// -----------------------------------------------

// ✅ Health Check — Azure uses this to verify app is running
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// ✅ GET all products
app.get("/products", (req, res) => {
  res.json({ status: "success", count: products.length, data: products });
});

// ✅ GET products with pagination (optional)

app.get("/products/paginated", (req, res) => {
  console.log("Received query params:", version); // Debugging line
  console.log("Received query params:", env);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = products.slice(startIndex, endIndex);

  res.json({
    status: "success man",
    data: paginatedProducts,
    pagination: {
      page,
      limit,
      total: products.length,
      pages: Math.ceil(products.length / limit),
    },
  });
});

// ✅ GET single product by ID
app.get("/products/:id", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));

  if (!product) {
    return res
      .status(404)
      .json({ status: "error", message: "Product not found" });
  }

  res.json({ status: "success", data: product });
});

// ✅ POST — Create a new product
app.post("/products", (req, res) => {
  const { name, price, stock } = req.body;

  // Basic validation
  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({
      status: "error",
      message: "Please provide name, price, and stock",
    });
  }

  const newProduct = { id: nextId++, name, price, stock };
  products.push(newProduct);

  res.status(201).json({ status: "success", data: newProduct });
});

// ✅ PUT — Update an existing product
app.put("/products/:id", (req, res) => {
  const index = products.findIndex((p) => p.id === parseInt(req.params.id));

  if (index === -1) {
    return res
      .status(404)
      .json({ status: "error", message: "Product not found" });
  }

  const { name, price, stock } = req.body;
  products[index] = { id: products[index].id, name, price, stock };

  res.json({ status: "success", data: products[index] });
});

// ✅ DELETE — Remove a product
app.delete("/products/:id", (req, res) => {
  const index = products.findIndex((p) => p.id === parseInt(req.params.id));

  if (index === -1) {
    return res
      .status(404)
      .json({ status: "error", message: "Product not found" });
  }

  const deleted = products.splice(index, 1);
  res.json({
    status: "success",
    message: `Product "${deleted[0].name}" deleted`,
  });
});

// -----------------------------------------------
// START SERVER
// Azure App Service sets PORT via environment variable
// -----------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

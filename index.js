const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ALL routes in one file
app.use('/', require('./routes/routes'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

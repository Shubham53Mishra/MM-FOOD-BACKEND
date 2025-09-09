const { updateMealBoxOrder } = require('../controllers/order.controller');
// PUT /api/orders/update-mealbox/:id - update a mealbox order
router.put('/update-mealbox/:id', updateMealBoxOrder);
const { createMealBoxOrder } = require('../controllers/order.controller');
// POST /api/orders/create-mealbox - create a mealbox order
router.post('/create-mealbox', createMealBoxOrder);

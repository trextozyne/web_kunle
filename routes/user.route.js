const express = require('express');
const router = express.Router();

const user_controller = require('../controllers/user.controller');
//

router.post('/create', user_controller.user_create);

router.post('/login', user_controller.user_login);
router.get('/login', user_controller.user_get_login);

router.post('/forgot', user_controller.user_forgot);
router.get('/forgot', user_controller.user_get_forgot);

router.post('/reset/:token', user_controller.user_reset);
router.get('/reset/:token', user_controller.user_get_reset);

router.get('/logout', user_controller.user_logout);
router.get('/admin', user_controller.admin_dashboard);
router.get('/not-found', user_controller.user_not_found);
router.get('/find', user_controller.user_all);
router.get('/find/by/:user', user_controller.user_by);
router.get('/:id', user_controller.user_details);
router.put('/:id/update-roles', user_controller.user_updateRoles);
router.put('/:id/update', user_controller.user_update);
router.delete('/:id/delete', user_controller.user_delete);


module.exports = router;
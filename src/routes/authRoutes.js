const router = require('express').Router();
const validate = require('../middlewares/validateRequest');
const { z } = require('zod');
const C = require('../controllers/authController');


const emailSchema = z.object({ body: z.object({ email: z.string().email() }) });
const registerVerifySchema = z.object({
body: z.object({
email: z.string().email(),
code: z.string().length(6),
name: z.string().min(2),
password: z.string().min(6),
}),
});
const resetVerifySchema = z.object({
body: z.object({ email: z.string().email(), code: z.string().length(6), newPassword: z.string().min(6) }),
});


router.post('/register/request-otp', validate(emailSchema), C.registerRequestOtp);
router.post('/register/verify', validate(registerVerifySchema), C.registerVerify);


router.post('/forgot/request-otp', validate(emailSchema), C.resetRequestOtp);
router.post('/forgot/verify', validate(resetVerifySchema), C.resetVerify);


module.exports = router;
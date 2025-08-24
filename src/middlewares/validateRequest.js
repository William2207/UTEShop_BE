const { ZodError } = require('zod');


function validate(schema) {
return (req, res, next) => {
try {
req.data = schema.parse({ body: req.body, query: req.query, params: req.params });
next();
} catch (e) {
if (e instanceof ZodError) {
return res.status(400).json({ error: 'Validation error', details: e.errors });
}
next(e);
}
};
}
module.exports = validate;
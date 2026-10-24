/**
 * Middleware factory to validate request body with Zod schema
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error.errors) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return res.status(400).json({
          success: false,
          message: `Validasi gagal: ${errorMessages}`,
          errors: error.errors
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Data input tidak valid.'
      });
    }
  };
}

module.exports = { validateBody };

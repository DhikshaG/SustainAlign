export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      })
    }
    req.validated = result.data
    next()
  }
}

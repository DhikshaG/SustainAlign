export const okSchema = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', enum: [true] },
    message: { type: 'string' },
    data: { nullable: true },
  },
}

export const createdSchema = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', enum: [true] },
    message: { type: 'string' },
    data: { nullable: true },
  },
}

export const errorSchema = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', enum: [false] },
    message: { type: 'string' },
    errors: { type: 'object', nullable: true },
  },
}

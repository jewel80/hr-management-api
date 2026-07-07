import Joi from 'joi';

/** Validates a positive integer `:id` path parameter. */
export const idParamSchema = Joi.object<{
  id: number;
}>({
  id: Joi.number().integer().positive().required(),
});

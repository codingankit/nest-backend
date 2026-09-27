import { ConfigFactory } from '@nestjs/config';
import { configSchema, type ConfigSchema } from './config.schema';
import { ErrorMessage } from '../constants';

export const appConfig: ConfigFactory<ConfigSchema> = () => {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      ErrorMessage.INVALID_ENV_VAR,
      result.error.flatten().fieldErrors,
    );
    process.exit(1);
  }

  return Object.freeze(result.data);
};

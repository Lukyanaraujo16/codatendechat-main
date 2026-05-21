import { Sequelize } from "sequelize";

export function assertSequelize(
  sequelize: Sequelize | undefined | null,
  caller: string
): Sequelize {
  if (!sequelize) {
    throw new Error(`${caller} requires a Sequelize instance`);
  }
  return sequelize;
}
